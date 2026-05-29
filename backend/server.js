import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { connectDB, isDbConnected, User, Portfolio, Transaction, Watchlist, PendingOrder } from './database.js';
import { MarketSimulator, STOCKS_METADATA } from './simulator.js';
import { getStockPrice } from './marketProvider.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'sensex_super_secret_key_2026';

app.use(cors());
app.use(express.json());

// Initialize Market Simulator
const simulator = new MarketSimulator();

// Graceful Database connection setup
connectDB();

// Fallback in-memory structures used when MongoDB is offline
let fallbackUsers = []; // { id, name, email, password, avatar, tradingLevel }
let fallbackPortfolios = {}; // userId -> { balance, holdings }
let fallbackTransactions = {}; // userId -> [transactions]
let fallbackWatchlists = {}; // userId -> [symbols]
let fallbackPendingOrders = []; // [pending orders]

// Seed default guest user account for instant testing
const seedDefaultUser = async () => {
  const defaultEmail = 'test@example.com';
  const defaultPassword = 'password123';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  // 1. Seed in-memory structures
  fallbackUsers.push({
    id: 'default_guest_user',
    name: 'Guest Trader',
    email: defaultEmail,
    password: hashedPassword,
    avatar: 'blue',
    tradingLevel: 'Intermediate',
    createdAt: new Date()
  });

  // 2. Seed MongoDB if online
  try {
    setTimeout(async () => {
      if (isDbConnected()) {
        const exists = await User.findOne({ email: defaultEmail });
        if (!exists) {
          const newUser = new User({
            name: 'Guest Trader',
            email: defaultEmail,
            password: hashedPassword,
            avatar: 'blue',
            tradingLevel: 'Intermediate'
          });
          await newUser.save();

          const portfolio = new Portfolio({ userId: newUser._id, balance: 1000000, holdings: [] });
          await portfolio.save();

          const watchlist = new Watchlist({ userId: newUser._id });
          await watchlist.save();
          console.log('[Database] Seeded default guest user successfully.');
        }
      }
    }, 3000);
  } catch (err) {
    console.error('Failed to seed default DB user:', err.message);
  }
};

seedDefaultUser();

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access token missing' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Token expired or invalid' });
    req.user = decoded; // { id, email }
    next();
  });
};

// Database utility helpers locked per user ID
const getUserPortfolio = async (userId) => {
  if (!isDbConnected()) {
    if (!fallbackPortfolios[userId]) {
      fallbackPortfolios[userId] = { balance: 1000000, holdings: [] };
    }
    return fallbackPortfolios[userId];
  }
  try {
    let p = await Portfolio.findOne({ userId });
    if (!p) {
      p = new Portfolio({ userId, balance: 1000000, holdings: [] });
      await p.save();
    }
    return p;
  } catch (err) {
    console.error('Failed to get DB portfolio, using fallback:', err.message);
    if (!fallbackPortfolios[userId]) {
      fallbackPortfolios[userId] = { balance: 1000000, holdings: [] };
    }
    return fallbackPortfolios[userId];
  }
};

const getUserWatchlist = async (userId) => {
  if (!isDbConnected()) {
    if (!fallbackWatchlists[userId]) {
      fallbackWatchlists[userId] = ['SENSEX', 'RELIANCE', 'TCS', 'HDFCBANK', 'INFY'];
    }
    return fallbackWatchlists[userId];
  }
  try {
    let w = await Watchlist.findOne({ userId });
    if (!w) {
      w = new Watchlist({ userId, symbols: ['SENSEX', 'RELIANCE', 'TCS', 'HDFCBANK', 'INFY'] });
      await w.save();
    }
    return w.symbols;
  } catch (err) {
    console.error('Failed to get DB watchlist, using fallback:', err.message);
    if (!fallbackWatchlists[userId]) {
      fallbackWatchlists[userId] = ['SENSEX', 'RELIANCE', 'TCS', 'HDFCBANK', 'INFY'];
    }
    return fallbackWatchlists[userId];
  }
};

const getUserTransactions = async (userId) => {
  if (!isDbConnected()) {
    return fallbackTransactions[userId] || [];
  }
  try {
    return await Transaction.find({ userId }).sort({ timestamp: -1 }).limit(50);
  } catch (err) {
    console.error('Failed to get DB transactions, using fallback:', err.message);
    return fallbackTransactions[userId] || [];
  }
};

// Auth REST Endpoints
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All registration inputs are required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    if (!isDbConnected()) {
      const exists = fallbackUsers.find(u => u.email === email);
      if (exists) return res.status(400).json({ error: 'User already exists' });

      const newUser = {
        id: Math.random().toString(36).substring(7),
        name,
        email,
        password: hashedPassword,
        avatar: 'blue',
        tradingLevel: 'Novice',
        createdAt: new Date()
      };
      fallbackUsers.push(newUser);
      
      const token = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: '7d' });
      return res.json({ token, user: { id: newUser.id, name: newUser.name, email: newUser.email, avatar: newUser.avatar, tradingLevel: newUser.tradingLevel } });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: 'User already exists' });

    const newUser = new User({
      name,
      email,
      password: hashedPassword
    });
    await newUser.save();

    const portfolio = new Portfolio({ userId: newUser._id, balance: 1000000, holdings: [] });
    await portfolio.save();

    const watchlist = new Watchlist({ userId: newUser._id });
    await watchlist.save();

    const token = jwt.sign({ id: newUser._id, email: newUser.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        avatar: newUser.avatar,
        tradingLevel: newUser.tradingLevel
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    let user;
    if (!isDbConnected()) {
      user = fallbackUsers.find(u => u.email === email);
      if (!user) return res.status(400).json({ error: 'Invalid login credentials' });
    } else {
      user = await User.findOne({ email });
      if (!user) return res.status(400).json({ error: 'Invalid login credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid login credentials' });

    const userId = !isDbConnected() ? user.id : user._id;
    const token = jwt.sign({ id: userId, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: userId,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        tradingLevel: user.tradingLevel
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    let user;
    if (!isDbConnected()) {
      user = fallbackUsers.find(u => u.id === req.user.id);
    } else {
      user = await User.findById(req.user.id).select('-password');
    }

    if (!user) return res.status(404).json({ error: 'User profile not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/profile/update', authenticateToken, async (req, res) => {
  try {
    const { name, avatar, tradingLevel } = req.body;

    if (!isDbConnected()) {
      const idx = fallbackUsers.findIndex(u => u.id === req.user.id);
      if (idx === -1) return res.status(404).json({ error: 'User profile not found' });
      
      const user = fallbackUsers[idx];
      if (name) user.name = name;
      if (avatar) user.avatar = avatar;
      if (tradingLevel) user.tradingLevel = tradingLevel;
      
      return res.json(user);
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User profile not found' });

    if (name) user.name = name;
    if (avatar) user.avatar = avatar;
    if (tradingLevel) user.tradingLevel = tradingLevel;

    await user.save();
    res.json({
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      tradingLevel: user.tradingLevel
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Secure Tickers/News (Public endpoints)
app.get('/api/stocks', (req, res) => {
  res.json(simulator.getFullState());
});

app.get('/api/news', (req, res) => {
  res.json(simulator.getNews());
});

// Public Search Endpoint - Handles 60+ blue chips or instantiates custom ticker searches dynamically
app.get('/api/stocks/search', (req, res) => {
  try {
    const query = (req.query.q || '').toUpperCase().trim();
    if (!query) {
      return res.json([]);
    }

    const activeStocks = simulator.getFullState();
    const matches = [];

    // 1. Matches in currently active stocks
    Object.keys(activeStocks).forEach(symbol => {
      const name = activeStocks[symbol].name.toUpperCase();
      if (symbol.includes(query) || name.includes(query)) {
        matches.push(activeStocks[symbol]);
      }
    });

    // 2. Matches in metadata not currently active
    Object.keys(STOCKS_METADATA).forEach(symbol => {
      const name = STOCKS_METADATA[symbol].name.toUpperCase();
      const inMatches = matches.some(m => m.symbol === symbol);
      if (!inMatches && (symbol.includes(query) || name.includes(query))) {
        const stock = simulator.addDynamicStock(symbol, STOCKS_METADATA[symbol].name);
        matches.push(stock);
      }
    });

    // 3. Dynamic Custom Seeding fallback if search is 2-8 char alphanumeric string
    if (matches.length === 0 && /^[A-Z0-9-]{2,8}$/.test(query)) {
      const customStock = simulator.addDynamicStock(query);
      matches.push(customStock);
    }

    res.json(matches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Secured REST Endpoints (Require authenticateToken)
app.get('/api/portfolio', authenticateToken, async (req, res) => {
  try {
    const portfolio = await getUserPortfolio(req.user.id);
    res.json(portfolio);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/transactions', authenticateToken, async (req, res) => {
  try {
    const transactions = await getUserTransactions(req.user.id);
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    if (!isDbConnected()) {
      const userOrders = fallbackPendingOrders.filter(o => o.userId === req.user.id);
      return res.json(userOrders);
    }
    const orders = await PendingOrder.find({ userId: req.user.id }).sort({ timestamp: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/orders/cancel', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ error: 'Order ID is required' });

    if (!isDbConnected()) {
      const idx = fallbackPendingOrders.findIndex(o => o.id === orderId && o.userId === req.user.id);
      if (idx === -1) return res.status(404).json({ error: 'Order not found' });
      fallbackPendingOrders.splice(idx, 1);
      return res.json({ success: true });
    }

    const result = await PendingOrder.deleteOne({ _id: orderId, userId: req.user.id });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Order not found' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/watchlist', authenticateToken, async (req, res) => {
  try {
    const watchlist = await getUserWatchlist(req.user.id);
    res.json(watchlist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/watchlist', authenticateToken, async (req, res) => {
  try {
    const { symbols } = req.body;
    if (!Array.isArray(symbols)) {
      return res.status(400).json({ error: 'Symbols must be an array' });
    }

    if (!isDbConnected()) {
      fallbackWatchlists[req.user.id] = symbols;
      return res.json(fallbackWatchlists[req.user.id]);
    }

    let w = await Watchlist.findOne({ userId: req.user.id });
    if (!w) {
      w = new Watchlist({ userId: req.user.id, symbols });
    } else {
      w.symbols = symbols;
    }
    await w.save();
    res.json(w.symbols);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/portfolio/reset', authenticateToken, async (req, res) => {
  try {
    if (!isDbConnected()) {
      fallbackPortfolios[req.user.id] = { balance: 1000000, holdings: [] };
      fallbackTransactions[req.user.id] = [];
      return res.json(fallbackPortfolios[req.user.id]);
    }
    
    let p = await Portfolio.findOne({ userId: req.user.id });
    if (p) {
      p.balance = 1000000;
      p.holdings = [];
      await p.save();
    }
    await Transaction.deleteMany({ userId: req.user.id });
    res.json(p);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/trade', authenticateToken, async (req, res) => {
  try {
    const { symbol, quantity, type, price, orderType, takeProfitPercent, stopLossPercent } = req.body;
    const qty = Number(quantity);
    const executionPrice = Number(price);
    const ordType = orderType || 'MARKET';
    const tpPercent = Number(takeProfitPercent) || 0;
    const slPercent = Number(stopLossPercent) || 0;

    if (!symbol || !qty || qty <= 0 || !type || !executionPrice) {
      return res.status(400).json({ error: 'Invalid trade details' });
    }

    const stockMeta = STOCKS_METADATA[symbol] || { name: `${symbol.toUpperCase()} Industries Ltd.` };
    const name = stockMeta.name;

    if (ordType === 'LIMIT') {
      const newOrder = {
        userId: req.user.id,
        symbol,
        name,
        quantity: qty,
        price: executionPrice, // limit price
        type,
        takeProfitPercent: tpPercent,
        stopLossPercent: slPercent,
        timestamp: new Date()
      };

      if (!isDbConnected()) {
        newOrder.id = Math.random().toString(36).substring(7);
        fallbackPendingOrders.push(newOrder);
      } else {
        const orderRecord = new PendingOrder(newOrder);
        await orderRecord.save();
        newOrder._id = orderRecord._id;
      }

      return res.json({
        success: true,
        isLimitOrder: true,
        order: newOrder
      });
    }

    const portfolio = await getUserPortfolio(req.user.id);
    const totalCost = qty * executionPrice;

    if (type === 'BUY') {
      if (portfolio.balance < totalCost) {
        return res.status(400).json({ error: 'Insufficient virtual cash balance for this trade' });
      }

      portfolio.balance -= totalCost;

      const existingHolding = portfolio.holdings.find(h => h.symbol === symbol);
      if (existingHolding) {
        const currentQty = existingHolding.quantity;
        const currentAvg = existingHolding.avgPrice;
        existingHolding.avgPrice = ((currentQty * currentAvg) + (qty * executionPrice)) / (currentQty + qty);
        existingHolding.quantity += qty;
        if (tpPercent > 0) existingHolding.takeProfitPercent = tpPercent;
        if (slPercent > 0) existingHolding.stopLossPercent = slPercent;
      } else {
        portfolio.holdings.push({
          symbol,
          name,
          quantity: qty,
          avgPrice: executionPrice,
          takeProfitPercent: tpPercent,
          stopLossPercent: slPercent
        });
      }
    } else if (type === 'SELL') {
      const holdingIndex = portfolio.holdings.findIndex(h => h.symbol === symbol);
      if (holdingIndex === -1 || portfolio.holdings[holdingIndex].quantity < qty) {
        return res.status(400).json({ error: 'Insufficient quantity in holdings' });
      }

      portfolio.balance += totalCost;

      const holding = portfolio.holdings[holdingIndex];
      holding.quantity -= qty;
      if (holding.quantity === 0) {
        portfolio.holdings.splice(holdingIndex, 1);
      }
    } else {
      return res.status(400).json({ error: 'Trade type must be BUY or SELL' });
    }

    const newTx = {
      userId: req.user.id,
      symbol,
      name,
      quantity: qty,
      price: executionPrice,
      type,
      timestamp: new Date()
    };

    if (!isDbConnected()) {
      if (!fallbackTransactions[req.user.id]) {
        fallbackTransactions[req.user.id] = [];
      }
      fallbackTransactions[req.user.id].unshift(newTx);
      if (fallbackTransactions[req.user.id].length > 50) fallbackTransactions[req.user.id].pop();
    } else {
      const transactionRecord = new Transaction(newTx);
      await transactionRecord.save();
      await portfolio.save();
    }

    res.json({
      success: true,
      portfolio,
      transaction: newTx
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI Chatbot NLP Endpoint
app.post('/api/chatbot', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message content is required' });

    const portfolio = await getUserPortfolio(req.user.id);
    const liveStocks = simulator.getFullState();

    // 1. If Gemini API Key is configured, query Gemini 2.5 Flash
    if (process.env.GEMINI_API_KEY) {
      try {
        const holdingsSummary = (portfolio.holdings || []).map(h => 
          `- ${h.quantity} shares of ${h.symbol} (Avg: ₹${h.avgPrice.toFixed(2)}, TP: ${h.takeProfitPercent}%, SL: ${h.stopLossPercent}%)`
        ).join('\n') || 'No active positions';

        const sensex = liveStocks['SENSEX'] || { price: 75000, changePercent: 0 };

        const systemPrompt = `You are SENSEX AI, a professional real-time financial advisor chatbot integrated inside the SENSEX Live Trader app. 
You assist the user with paper trading stock research, explaining indicators, and optimizing their portfolio. 
Provide concise, highly professional responses in clean GitHub Markdown format. 
Remind the user of risk management tools like Stop Loss and Take Profit when appropriate.

Current App State Context:
- User Virtual Balance: ₹${portfolio.balance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
- User Portfolio Holdings:
${holdingsSummary}
- Current BSE SENSEX Index: ₹${sensex.price.toFixed(2)} (${sensex.changePercent >= 0 ? '+' : ''}${sensex.changePercent.toFixed(2)}% today)
`;

        const requestBody = {
          contents: [{
            parts: [{
              text: `${systemPrompt}\n\nUser Question: ${message}`
            }]
          }]
        };

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
        const response = await fetch(geminiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });

        const data = await response.json();
        if (data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
          const reply = data.candidates[0].content.parts[0].text;
          return res.json({ response: reply });
        }
      } catch (geminiError) {
        console.warn('[ChatBot] Gemini API request failed. Falling back to local NLP rules:', geminiError.message);
      }
    }

    const cleanMsg = message.toLowerCase();
    let responseText = '';

    if (cleanMsg.includes('portfolio') || cleanMsg.includes('holding') || cleanMsg.includes('balance') || cleanMsg.includes('cash') || cleanMsg.includes('p&l') || cleanMsg.includes('profit')) {
      const totalCash = portfolio.balance;
      const holdings = portfolio.holdings || [];
      const totalCost = holdings.reduce((sum, h) => sum + (h.quantity * h.avgPrice), 0);
      const currentValue = holdings.reduce((sum, h) => {
        const livePrice = liveStocks[h.symbol]?.price || h.avgPrice;
        return sum + (h.quantity * livePrice);
      }, 0);
      const totalPnL = currentValue - totalCost;

      let holdingDesc = holdings.map(h => `${h.quantity} shares of ${h.symbol} (Avg: ₹${h.avgPrice.toFixed(2)})`).join(', ');
      if (holdings.length === 0) holdingDesc = 'no active positions';

      responseText = `📊 **Portfolio Report:**\n- **Virtual Cash Balance:** ₹${totalCash.toLocaleString('en-IN', { maximumFractionDigits: 2 })}\n- **Holdings Value:** ₹${currentValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}\n- **Unrealized P&L:** ₹${totalPnL.toFixed(2)} (${totalCost > 0 ? ((totalPnL / totalCost) * 100).toFixed(2) : 0}%)\n- **Active Holdings:** ${holdingDesc}.\n\n*Suggestion:* If your P&L is positive, consider setting a Take Profit target in the Order Placement panel to protect your virtual gains!`;
    } 
    else if (Object.keys(STOCKS_METADATA).some(symbol => cleanMsg.includes(symbol.toLowerCase())) || Object.keys(liveStocks).some(symbol => cleanMsg.includes(symbol.toLowerCase()))) {
      // Find matching stock key in active list or metadata
      const matchedSymbol = Object.keys(liveStocks).find(symbol => cleanMsg.includes(symbol.toLowerCase())) || 
                            Object.keys(STOCKS_METADATA).find(symbol => cleanMsg.includes(symbol.toLowerCase()));
      
      let stock = liveStocks[matchedSymbol];
      if (!stock) {
        stock = simulator.addDynamicStock(matchedSymbol);
      }
      
      if (stock) {
        const isUp = stock.changePercent >= 0;
        const signal = stock.indicators?.signal || 'NEUTRAL';
        const reasons = stock.indicators?.reasons?.join(', ') || 'No strong technical bias';
        
        responseText = `📈 **Stock Alert: ${matchedSymbol}** (${stock.name})\n- **Live Price:** ₹${stock.price.toFixed(2)} (${isUp ? '+' : ''}${stock.changePercent.toFixed(2)}% today)\n- **High/Low:** ₹${stock.high.toFixed(2)} / ₹${stock.low.toFixed(2)}\n- **AI Signal:** **${signal}**\n- **Rationale:** ${reasons}.\n\n*Chatbot Recommendation:* ${
          signal === 'BUY' 
            ? `Our calculations suggest building a long position on ${matchedSymbol} due to strong bullish momentum.` 
            : signal === 'SELL' 
              ? `Technical metrics favor trimming positions on ${matchedSymbol}.` 
              : `Consolidation range detected for ${matchedSymbol}. It is recommended to HOLD.`
        }`;
      } else {
        responseText = `I couldn't fetch live ticks for ${matchedSymbol} right now.`;
      }
    } 
    else if (cleanMsg.includes('market') || cleanMsg.includes('sensex') || cleanMsg.includes('index') || cleanMsg.includes('bse')) {
      const sensex = liveStocks['SENSEX'];
      const isUp = sensex ? sensex.changePercent >= 0 : true;
      responseText = `🏛️ **BSE SENSEX Market Update:**\n- **Index Value:** ₹${sensex?.price.toFixed(2) || '75,000'}\n- **Daily Change:** ${isUp ? '+' : ''}${sensex?.changePercent.toFixed(2) || '0.00'}%\n- **Volume:** ${sensex?.volume.toLocaleString('en-IN') || '0'} shares traded.\n- **Market Bias:** ${isUp ? '📈 Bullish momentum.' : '📉 Bearish pressure.'}`;
    }
    else if (cleanMsg.includes('rsi') || cleanMsg.includes('relative strength')) {
      responseText = `💡 **Educational Note - RSI (Relative Strength Index):**\n- RSI measures price speed and change on a scale of 0 to 100.\n- **Oversold (< 30):** Represents buying interest. Leads to BUY signals.\n- **Overbought (> 70):** Represents profit-booking zones. Leads to SELL signals.`;
    }
    else if (cleanMsg.includes('macd')) {
      responseText = `💡 **Educational Note - MACD (Moving Average Convergence Divergence):**\n- MACD shows the relationship between two moving averages of a stock's price.\n- A crossover of the MACD line *above* the Signal Line triggers bullish momentum (BUY indicator). Crossover *below* triggers bearish signals (SELL indicator).`;
    }
    else if (cleanMsg.includes('stop loss') || cleanMsg.includes('risk')) {
      responseText = `🛡️ **Risk Management Advice:**\n- Always trade with a predefined **Stop Loss** to protect your balance from unexpected downturns.\n- In paper trading, test setting target **Take Profit points** (+5%, +10%) using the slider in the Order panel to secure virtual profits.`;
    }
    else {
      responseText = `Hello! 👋 I am your SENSEX AI Assistant.\n\nHere are some things you can ask me:\n- *"How is my portfolio doing?"* to review your holdings and cash.\n- *"Should I buy TCS?"* or *"What is the signal for RELIANCE?"* to analyze specific technical details.\n- *"What is the current market index?"* for live BSE SENSEX rates.\n- *"Explain RSI / MACD"* for trading education support.`;
    }

    res.json({ response: responseText });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// WebSocket Server Connections
io.on('connection', (socket) => {
  console.log('Client connected to real-time stock feed');
  socket.emit('initial-stocks', simulator.getFullState());
  socket.emit('initial-news', simulator.getNews());

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Periodic price movement tick (every 1.5 seconds)
setInterval(async () => {
  const stockTicks = simulator.tick();

  // If in LIVE mode, overlay live prices for stocks
  if (process.env.MARKET_MODE === 'LIVE') {
    const symbols = Object.keys(stockTicks);
    for (const symbol of symbols) {
      const liveData = await getStockPrice(symbol);
      if (liveData) {
        stockTicks[symbol].price = liveData.price;
        stockTicks[symbol].change = liveData.change;
        stockTicks[symbol].changePercent = liveData.changePercent;
        stockTicks[symbol].high = liveData.high;
        stockTicks[symbol].low = liveData.low;
        stockTicks[symbol].open = liveData.open;
        stockTicks[symbol].volume = liveData.volume;
      }
    }
  }

  io.emit('stock-ticks', stockTicks);
  await checkInteractiveTriggers(stockTicks);
}, 1500);

// Background Checking Engine for Limit and Trigger Orders
const checkInteractiveTriggers = async (liveStocks) => {
  try {
    // 1. Process Pending Limit Orders
    if (!isDbConnected()) {
      // In-Memory Fallback mode limit orders execution
      for (let i = fallbackPendingOrders.length - 1; i >= 0; i--) {
        const order = fallbackPendingOrders[i];
        const stock = liveStocks[order.symbol];
        if (!stock) continue;

        const livePrice = stock.price;
        let shouldExecute = false;

        if (order.type === 'BUY' && livePrice <= order.price) {
          shouldExecute = true;
        } else if (order.type === 'SELL' && livePrice >= order.price) {
          shouldExecute = true;
        }

        if (shouldExecute) {
          const portfolio = fallbackPortfolios[order.userId] || { balance: 1000000, holdings: [] };
          const totalCost = order.quantity * livePrice;

          if (order.type === 'BUY') {
            if (portfolio.balance >= totalCost) {
              portfolio.balance -= totalCost;
              const existing = portfolio.holdings.find(h => h.symbol === order.symbol);
              if (existing) {
                existing.avgPrice = ((existing.quantity * existing.avgPrice) + (order.quantity * livePrice)) / (existing.quantity + order.quantity);
                existing.quantity += order.quantity;
                if (order.takeProfitPercent > 0) existing.takeProfitPercent = order.takeProfitPercent;
                if (order.stopLossPercent > 0) existing.stopLossPercent = order.stopLossPercent;
              } else {
                portfolio.holdings.push({
                  symbol: order.symbol,
                  name: order.name,
                  quantity: order.quantity,
                  avgPrice: livePrice,
                  takeProfitPercent: order.takeProfitPercent,
                  stopLossPercent: order.stopLossPercent
                });
              }
              executeInMemTx(order.userId, order.symbol, order.name, order.quantity, livePrice, 'BUY');
              io.emit('order-executed', { userId: order.userId, message: `Limit BUY for ${order.quantity} shares of ${order.symbol} executed at ₹${livePrice.toFixed(2)}` });
            }
          } else {
            const holdingIdx = portfolio.holdings.findIndex(h => h.symbol === order.symbol);
            if (holdingIdx !== -1 && portfolio.holdings[holdingIdx].quantity >= order.quantity) {
              portfolio.balance += totalCost;
              portfolio.holdings[holdingIdx].quantity -= order.quantity;
              if (portfolio.holdings[holdingIdx].quantity === 0) {
                portfolio.holdings.splice(holdingIdx, 1);
              }
              executeInMemTx(order.userId, order.symbol, order.name, order.quantity, livePrice, 'SELL');
              io.emit('order-executed', { userId: order.userId, message: `Limit SELL for ${order.quantity} shares of ${order.symbol} executed at ₹${livePrice.toFixed(2)}` });
            }
          }
          fallbackPendingOrders.splice(i, 1);
        }
      }

      // Process In-Memory TP/SL Triggers
      Object.keys(fallbackPortfolios).forEach(userId => {
        const portfolio = fallbackPortfolios[userId];
        for (let i = portfolio.holdings.length - 1; i >= 0; i--) {
          const holding = portfolio.holdings[i];
          const stock = liveStocks[holding.symbol];
          if (!stock) continue;

          const livePrice = stock.price;
          const tpPrice = holding.avgPrice * (1 + holding.takeProfitPercent / 100);
          const slPrice = holding.avgPrice * (1 - holding.stopLossPercent / 100);

          let triggerType = null;
          if (holding.takeProfitPercent > 0 && livePrice >= tpPrice) {
            triggerType = 'TAKE_PROFIT';
          } else if (holding.stopLossPercent > 0 && livePrice <= slPrice) {
            triggerType = 'STOP_LOSS';
          }

          if (triggerType) {
            const sellValue = holding.quantity * livePrice;
            portfolio.balance += sellValue;
            executeInMemTx(userId, holding.symbol, holding.name, holding.quantity, livePrice, 'SELL');
            io.emit('holding-triggered', {
              userId,
              message: `🚨 Auto ${triggerType} Triggered! Sold ${holding.quantity} shares of ${holding.symbol} at ₹${livePrice.toFixed(2)}`
            });
            portfolio.holdings.splice(i, 1);
          }
        }
      });

    } else {
      // MongoDB Mode
      const pendingOrders = await PendingOrder.find({});
      for (const order of pendingOrders) {
        const stock = liveStocks[order.symbol];
        if (!stock) continue;

        const livePrice = stock.price;
        let shouldExecute = false;

        if (order.type === 'BUY' && livePrice <= order.price) {
          shouldExecute = true;
        } else if (order.type === 'SELL' && livePrice >= order.price) {
          shouldExecute = true;
        }

        if (shouldExecute) {
          const portfolio = await Portfolio.findOne({ userId: order.userId });
          if (!portfolio) continue;

          const totalCost = order.quantity * livePrice;

          if (order.type === 'BUY') {
            if (portfolio.balance >= totalCost) {
              portfolio.balance -= totalCost;
              const existing = portfolio.holdings.find(h => h.symbol === order.symbol);
              if (existing) {
                existing.avgPrice = ((existing.quantity * existing.avgPrice) + (order.quantity * livePrice)) / (existing.quantity + order.quantity);
                existing.quantity += order.quantity;
                if (order.takeProfitPercent > 0) existing.takeProfitPercent = order.takeProfitPercent;
                if (order.stopLossPercent > 0) existing.stopLossPercent = order.stopLossPercent;
              } else {
                portfolio.holdings.push({
                  symbol: order.symbol,
                  name: order.name,
                  quantity: order.quantity,
                  avgPrice: livePrice,
                  takeProfitPercent: order.takeProfitPercent,
                  stopLossPercent: order.stopLossPercent
                });
              }
              await portfolio.save();
              await new Transaction({
                userId: order.userId,
                symbol: order.symbol,
                name: order.name,
                quantity: order.quantity,
                price: livePrice,
                type: 'BUY'
              }).save();
              io.emit('order-executed', { userId: order.userId.toString(), message: `Limit BUY for ${order.quantity} shares of ${order.symbol} executed at ₹${livePrice.toFixed(2)}` });
            }
          } else {
            const holdingIdx = portfolio.holdings.findIndex(h => h.symbol === order.symbol);
            if (holdingIdx !== -1 && portfolio.holdings[holdingIdx].quantity >= order.quantity) {
              portfolio.balance += totalCost;
              portfolio.holdings[holdingIdx].quantity -= order.quantity;
              if (portfolio.holdings[holdingIdx].quantity === 0) {
                portfolio.holdings.splice(holdingIdx, 1);
              }
              await portfolio.save();
              await new Transaction({
                userId: order.userId,
                symbol: order.symbol,
                name: order.name,
                quantity: order.quantity,
                price: livePrice,
                type: 'SELL'
              }).save();
              io.emit('order-executed', { userId: order.userId.toString(), message: `Limit SELL for ${order.quantity} shares of ${order.symbol} executed at ₹${livePrice.toFixed(2)}` });
            }
          }
          await PendingOrder.deleteOne({ _id: order._id });
        }
      }

      // Process MongoDB TP/SL Triggers
      const portfolios = await Portfolio.find({});
      for (const portfolio of portfolios) {
        let holdingChanged = false;
        const holdingsCopy = [...portfolio.holdings];
        
        for (let i = holdingsCopy.length - 1; i >= 0; i--) {
          const holding = holdingsCopy[i];
          const stock = liveStocks[holding.symbol];
          if (!stock) continue;

          const livePrice = stock.price;
          const tpPrice = holding.avgPrice * (1 + holding.takeProfitPercent / 100);
          const slPrice = holding.avgPrice * (1 - holding.stopLossPercent / 100);

          let triggerType = null;
          if (holding.takeProfitPercent > 0 && livePrice >= tpPrice) {
            triggerType = 'TAKE_PROFIT';
          } else if (holding.stopLossPercent > 0 && livePrice <= slPrice) {
            triggerType = 'STOP_LOSS';
          }

          if (triggerType) {
            const sellValue = holding.quantity * livePrice;
            portfolio.balance += sellValue;
            portfolio.holdings.splice(i, 1);
            holdingChanged = true;

            await new Transaction({
              userId: portfolio.userId,
              symbol: holding.symbol,
              name: holding.name,
              quantity: holding.quantity,
              price: livePrice,
              type: 'SELL'
            }).save();

            io.emit('holding-triggered', {
              userId: portfolio.userId.toString(),
              message: `🚨 Auto ${triggerType} Triggered! Sold ${holding.quantity} shares of ${holding.symbol} at ₹${livePrice.toFixed(2)}`
            });
          }
        }

        if (holdingChanged) {
          await portfolio.save();
        }
      }
    }
  } catch (error) {
    console.error('Trigger execution error:', error.message);
  }
};

const executeInMemTx = (userId, symbol, name, quantity, price, type) => {
  if (!fallbackTransactions[userId]) fallbackTransactions[userId] = [];
  fallbackTransactions[userId].unshift({
    userId,
    symbol,
    name,
    quantity,
    price,
    type,
    timestamp: new Date()
  });
  if (fallbackTransactions[userId].length > 50) fallbackTransactions[userId].pop();
};

// Periodic news generation (every 18 seconds)
setInterval(() => {
  const { newsEvent, stockAffected } = simulator.generateNews();
  io.emit('news-update', { newsEvent, stockAffected });
}, 18000);

server.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
