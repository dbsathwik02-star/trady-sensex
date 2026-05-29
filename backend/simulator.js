import { generateSignal } from './indicators.js';

// Expanded BSE & Upstox major constituent stock list (60+ companies)
export const STOCKS_METADATA = {
  SENSEX: { name: 'BSE SENSEX Index', basePrice: 75000, volatility: 0.0008 },
  
  // Banking & Financials
  RELIANCE: { name: 'Reliance Industries Ltd.', basePrice: 2850, volatility: 0.0015 },
  TCS: { name: 'Tata Consultancy Services Ltd.', basePrice: 3820, volatility: 0.0012 },
  HDFCBANK: { name: 'HDFC Bank Ltd.', basePrice: 1540, volatility: 0.0014 },
  INFY: { name: 'Infosys Ltd.', basePrice: 1450, volatility: 0.0016 },
  ICICIBANK: { name: 'ICICI Bank Ltd.', basePrice: 1120, volatility: 0.0013 },
  SBIN: { name: 'State Bank of India', basePrice: 830, volatility: 0.0018 },
  KOTAKBANK: { name: 'Kotak Mahindra Bank Ltd.', basePrice: 1720, volatility: 0.0015 },
  AXISBANK: { name: 'Axis Bank Ltd.', basePrice: 1050, volatility: 0.0016 },
  INDUSINDBK: { name: 'IndusInd Bank Ltd.', basePrice: 1420, volatility: 0.0018 },
  PNB: { name: 'Punjab National Bank', basePrice: 125, volatility: 0.0025 },
  BOB: { name: 'Bank of Baroda', basePrice: 260, volatility: 0.0022 },
  FEDERALBNK: { name: 'The Federal Bank Ltd.', basePrice: 160, volatility: 0.0020 },
  BAJFINANCE: { name: 'Bajaj Finance Ltd.', basePrice: 6850, volatility: 0.0018 },
  BAJAJFINSV: { name: 'Bajaj Finserv Ltd.', basePrice: 1580, volatility: 0.0017 },
  HDFC: { name: 'HDFC Asset Management Co. Ltd.', basePrice: 3750, volatility: 0.0016 },
  LICHSGFIN: { name: 'LIC Housing Finance Ltd.', basePrice: 640, volatility: 0.0022 },
  
  // Information Technology (IT)
  WIPRO: { name: 'Wipro Ltd.', basePrice: 460, volatility: 0.0016 },
  HCLTECH: { name: 'HCL Technologies Ltd.', basePrice: 1320, volatility: 0.0014 },
  TECHM: { name: 'Tech Mahindra Ltd.', basePrice: 1240, volatility: 0.0018 },
  LTIM: { name: 'LTIMindtree Ltd.', basePrice: 4780, volatility: 0.0020 },
  COFORGE: { name: 'Coforge Ltd.', basePrice: 5120, volatility: 0.0022 },
  PERSISTENT: { name: 'Persistent Systems Ltd.', basePrice: 3450, volatility: 0.0021 },
  
  // Oil, Gas, Energy & Power
  ONGC: { name: 'Oil & Natural Gas Corporation Ltd.', basePrice: 275, volatility: 0.0019 },
  COALINDIA: { name: 'Coal India Ltd.', basePrice: 450, volatility: 0.0018 },
  NTPC: { name: 'NTPC Ltd.', basePrice: 360, volatility: 0.0017 },
  POWERGRID: { name: 'Power Grid Corporation of India Ltd.', basePrice: 285, volatility: 0.0014 },
  BPCL: { name: 'Bharat Petroleum Corporation Ltd.', basePrice: 620, volatility: 0.0022 },
  IOC: { name: 'Indian Oil Corporation Ltd.', basePrice: 165, volatility: 0.0020 },
  GAIL: { name: 'GAIL (India) Ltd.', basePrice: 200, volatility: 0.0018 },
  TATAPOWER: { name: 'Tata Power Co. Ltd.', basePrice: 430, volatility: 0.0021 },
  ADANIPOWER: { name: 'Adani Power Ltd.', basePrice: 580, volatility: 0.0028 },
  JSWENERGY: { name: 'JSW Energy Ltd.', basePrice: 610, volatility: 0.0024 },
  
  // Automotive (Auto)
  TATAMOTORS: { name: 'Tata Motors Ltd.', basePrice: 940, volatility: 0.0022 },
  MARUTI: { name: 'Maruti Suzuki India Ltd.', basePrice: 12200, volatility: 0.0013 },
  'M&M': { name: 'Mahindra & Mahindra Ltd.', basePrice: 2550, volatility: 0.0016 },
  HEROMOTOCO: { name: 'Hero MotoCorp Ltd.', basePrice: 5100, volatility: 0.0015 },
  EICHERMOT: { name: 'Eicher Motors Ltd.', basePrice: 4650, volatility: 0.0017 },
  BAJAJ_AUTO: { name: 'Bajaj Auto Ltd.', basePrice: 8900, volatility: 0.0015 },
  ASHOKLEY: { name: 'Ashok Leyland Ltd.', basePrice: 215, volatility: 0.0022 },
  
  // FMCG & Consumer Durables
  ITC: { name: 'ITC Ltd.', basePrice: 435, volatility: 0.0011 },
  HUL: { name: 'Hindustan Unilever Ltd.', basePrice: 2350, volatility: 0.0012 },
  NESTLEIND: { name: 'Nestle India Ltd.', basePrice: 2480, volatility: 0.0010 },
  BRITANNIA: { name: 'Britannia Industries Ltd.', basePrice: 5180, volatility: 0.0013 },
  TATACONSUM: { name: 'Tata Consumer Products Ltd.', basePrice: 1120, volatility: 0.0016 },
  VBL: { name: 'Varun Beverages Ltd.', basePrice: 1450, volatility: 0.0021 },
  MARICO: { name: 'Marico Ltd.', basePrice: 610, volatility: 0.0014 },
  TITAN: { name: 'Titan Company Ltd.', basePrice: 3250, volatility: 0.0015 },
  ASIANPAINT: { name: 'Asian Paints Ltd.', basePrice: 2850, volatility: 0.0013 },
  
  // Metals & Mining
  TATASTEEL: { name: 'Tata Steel Ltd.', basePrice: 165, volatility: 0.0020 },
  JSWSTEEL: { name: 'JSW Steel Ltd.', basePrice: 880, volatility: 0.0017 },
  HINDALCO: { name: 'Hindalco Industries Ltd.', basePrice: 650, volatility: 0.0021 },
  VEDL: { name: 'Vedanta Ltd.', basePrice: 430, volatility: 0.0025 },
  NMDC: { name: 'NMDC Ltd.', basePrice: 240, volatility: 0.0024 },
  
  // Pharmaceuticals & Health
  SUNPHARMA: { name: 'Sun Pharmaceutical Industries Ltd.', basePrice: 1480, volatility: 0.0013 },
  CIPLA: { name: 'Cipla Ltd.', basePrice: 1420, volatility: 0.0014 },
  DRREDDY: { name: 'Dr. Reddys Laboratories Ltd.', basePrice: 5800, volatility: 0.0015 },
  APOLLOHOSP: { name: 'Apollo Hospitals Enterprise Ltd.', basePrice: 5950, volatility: 0.0018 },
  DIVISLAB: { name: 'Divis Laboratories Ltd.', basePrice: 3820, volatility: 0.0019 },
  
  // Telecom, Infrastructure & Conglomerates
  BHARTIARTL: { name: 'Bharti Airtel Ltd.', basePrice: 1350, volatility: 0.0014 },
  LT: { name: 'Larsen & Toubro Ltd.', basePrice: 3550, volatility: 0.0014 },
  ADANIPORTS: { name: 'Adani Ports & Special Economic Zone Ltd.', basePrice: 1320, volatility: 0.0024 },
  ADANIENT: { name: 'Adani Enterprises Ltd.', basePrice: 3120, volatility: 0.0028 },
  GRASIM: { name: 'Grasim Industries Ltd.', basePrice: 2350, volatility: 0.0016 },
  ULTRACEMCO: { name: 'UltraTech Cement Ltd.', basePrice: 9800, volatility: 0.0013 },
  DLF: { name: 'DLF Ltd.', basePrice: 820, volatility: 0.0022 },
  IDEA: { name: 'Vodafone Idea Ltd.', basePrice: 13, volatility: 0.0035 }
};

// Initial news templates
const NEWS_TEMPLATES = [
  { symbol: 'TCS', text: 'TCS signs multi-million dollar cloud migration deal with European retail giant.', impact: 0.015 },
  { symbol: 'RELIANCE', text: 'Reliance Retail expands operations, opening 50 new smart stores across tier-2 cities.', impact: 0.012 },
  { symbol: 'HDFCBANK', text: 'HDFC Bank launches state-of-the-art mobile banking app to capture rural markets.', impact: 0.008 },
  { symbol: 'INFY', text: 'Infosys announces collaboration with global chipmaker for next-gen AI platforms.', impact: 0.014 },
  { symbol: 'SBIN', text: 'RBI announces policy rates unchanged; banking sector shows positive sentiment.', impact: 0.005, global: true },
  { symbol: 'ITC', text: 'ITC Q4 net profit beats street estimates by 6.2%; board proposes high dividend.', impact: 0.018 },
  { symbol: 'ICICIBANK', text: 'ICICI Bank reports strong deposit growth of 18% YoY in quarterly update.', impact: 0.011 },
  { symbol: 'BHARTIARTL', text: 'Bharti Airtel expands 5G coverage to 200 additional towns, boosting ARPU.', impact: 0.009 },
  { symbol: 'LTIM', text: 'LTIMindtree named a leader in digital engineering services by top research firm.', impact: 0.013 },
  { symbol: 'SENSEX', text: 'FIIs pump in over ₹3,000 crores in Indian equities today, propelling index higher.', impact: 0.006, global: true },
  
  // Negative updates
  { symbol: 'INFY', text: 'Infosys shares dip as corporate client delays major IT outsourcing spend.', impact: -0.012 },
  { symbol: 'RELIANCE', text: 'Global crude oil price surge sparks concerns over refining margins for Reliance.', impact: -0.008 },
  { symbol: 'HDFCBANK', text: 'HDFC Bank faces minor technical glitch in net banking; service restored.', impact: -0.004 },
  { symbol: 'SBIN', text: 'SBI reports slight increase in gross NPAs; management reassures asset quality.', impact: -0.010 },
  { symbol: 'ITC', text: 'GST Council discusses proposal to revise cess on luxury tobacco products.', impact: -0.015 },
  { symbol: 'LTIM', text: 'LTIMindtree reports higher-than-expected attrition rate for the last quarter.', impact: -0.011 }
];

export class MarketSimulator {
  constructor() {
    this.stocks = {};
    this.newsHistory = [];
    this.init();
  }

  init() {
    // Generate initial stocks state (Simulate all stocks defined in metadata)
    Object.keys(STOCKS_METADATA).forEach(symbol => {
      this.initStock(symbol);
    });

    // Populate initial global news
    for (let i = 0; i < 5; i++) {
      const t = NEWS_TEMPLATES[Math.floor(Math.random() * NEWS_TEMPLATES.length)];
      this.newsHistory.push({
        id: Math.random().toString(36).substring(7),
        symbol: t.symbol,
        text: t.text,
        sentiment: t.impact > 0 ? 'bullish' : 'bearish',
        timestamp: new Date(Date.now() - (5 - i) * 60000)
      });
    }
  }

  // Initialize a stock and seed history
  initStock(symbol, customName = null, customBase = null, customVolatility = null) {
    const isSensex = symbol === 'SENSEX';
    let meta = STOCKS_METADATA[symbol];
    
    // Fallback configurations for custom searched stocks
    if (!meta) {
      const sym = symbol.toUpperCase();
      let hash = 0;
      for (let i = 0; i < sym.length; i++) {
        hash = sym.charCodeAt(i) + ((hash << 5) - hash);
      }
      
      const basePrice = customBase || Math.abs(hash % 2000) + 150; // deterministically seed ₹150 - ₹2150
      const volatility = customVolatility || 0.001 + (Math.abs(hash % 100) / 10000); // 0.001 - 0.002
      const name = customName || `${sym} Industries Ltd.`;
      
      meta = { name, basePrice, volatility };
    }

    const history = [];
    let currentPrice = meta.basePrice;
    
    // Seed 100 historical prices
    for (let i = 0; i < 100; i++) {
      const change = (Math.random() - 0.49) * 2 * meta.volatility * currentPrice;
      currentPrice += change;
      history.push(currentPrice);
    }

    const openPrice = history[0];
    const high = Math.max(...history);
    const low = Math.min(...history);

    this.stocks[symbol] = {
      symbol,
      name: meta.name,
      price: currentPrice,
      open: openPrice,
      high: high,
      low: low,
      history: history,
      volume: isSensex ? 120000000 : Math.floor(Math.random() * 5000000) + 1000000,
      change: currentPrice - openPrice,
      changePercent: ((currentPrice - openPrice) / openPrice) * 100,
      indicators: generateSignal(history)
    };
  }

  // Dynamically configure and add a stock searched by user
  addDynamicStock(symbol, name = null) {
    const sym = symbol.toUpperCase().trim();
    
    if (this.stocks[sym]) {
      return this.stocks[sym];
    }
    
    this.initStock(sym, name);
    console.log(`[Simulator] Dynamically initialized search stock: ${sym}`);
    return this.stocks[sym];
  }

  // Generate next tick for all active stocks
  tick() {
    const changes = {};
    const sensexImpacts = [];

    // Tick individual stocks
    Object.keys(this.stocks).forEach(symbol => {
      if (symbol === 'SENSEX') return;

      const stock = this.stocks[symbol];
      // Lookup volatility from metadata or calculate deterministically
      let volatility = STOCKS_METADATA[symbol]?.volatility;
      if (!volatility) {
        let hash = 0;
        for (let i = 0; i < symbol.length; i++) {
          hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
        }
        volatility = 0.001 + (Math.abs(hash % 100) / 10000);
      }
      
      const changePercent = (Math.random() - 0.493) * 2 * volatility;
      const priceChange = stock.price * changePercent;
      
      stock.price += priceChange;
      stock.history.push(stock.price);
      if (stock.history.length > 120) stock.history.shift();

      if (stock.price > stock.high) stock.high = stock.price;
      if (stock.price < stock.low) stock.low = stock.price;
      stock.volume += Math.floor(Math.random() * 15000);
      stock.change = stock.price - stock.open;
      stock.changePercent = (stock.change / stock.open) * 100;
      
      stock.indicators = generateSignal(stock.history);

      sensexImpacts.push(changePercent);
      changes[symbol] = { ...stock, history: undefined };
    });

    // Calculate SENSEX index movement
    const sensex = this.stocks['SENSEX'];
    if (sensex) {
      const avgComponentChange = sensexImpacts.reduce((sum, val) => sum + val, 0) / sensexImpacts.length;
      const sensexChange = sensex.price * avgComponentChange;
      
      sensex.price += sensexChange;
      sensex.history.push(sensex.price);
      if (sensex.history.length > 120) sensex.history.shift();

      if (sensex.price > sensex.high) sensex.high = sensex.price;
      if (sensex.price < sensex.low) sensex.low = sensex.price;
      sensex.volume += Math.floor(Math.random() * 500000);
      sensex.change = sensex.price - sensex.open;
      sensex.changePercent = (sensex.change / sensex.open) * 100;
      sensex.indicators = generateSignal(sensex.history);

      changes['SENSEX'] = { ...sensex, history: undefined };
    }

    return changes;
  }

  // Generate news event
  generateNews() {
    const activeSymbols = Object.keys(this.stocks).filter(s => s !== 'SENSEX');
    // Draw from news templates, but dynamically adapt to custom symbols if template matches
    const template = NEWS_TEMPLATES[Math.floor(Math.random() * NEWS_TEMPLATES.length)];
    
    // Choose stock affected. 80% chance it is the template stock, 20% it's another active stock
    let targetSymbol = template.symbol;
    if (Math.random() > 0.8 || !this.stocks[targetSymbol]) {
      targetSymbol = activeSymbols[Math.floor(Math.random() * activeSymbols.length)];
    }

    const id = Math.random().toString(36).substring(7);
    const isBullish = template.impact > 0;
    
    const text = template.symbol === targetSymbol 
      ? template.text 
      : template.text.replace(new RegExp(template.symbol, 'g'), targetSymbol);

    const newsEvent = {
      id,
      symbol: targetSymbol,
      text,
      sentiment: isBullish ? 'bullish' : 'bearish',
      timestamp: new Date()
    };

    this.newsHistory.unshift(newsEvent);
    if (this.newsHistory.length > 30) this.newsHistory.pop();

    const stock = this.stocks[targetSymbol];
    if (stock) {
      const impactPrice = stock.price * template.impact;
      stock.price += impactPrice;
      stock.history.push(stock.price);
      if (stock.history.length > 120) stock.history.shift();
      
      if (stock.price > stock.high) stock.high = stock.price;
      if (stock.price < stock.low) stock.low = stock.price;
      stock.change = stock.price - stock.open;
      stock.changePercent = (stock.change / stock.open) * 100;
      stock.indicators = generateSignal(stock.history);
    }

    return { newsEvent, stockAffected: targetSymbol };
  }

  getFullState() {
    return this.stocks;
  }

  getNews() {
    return this.newsHistory;
  }
}
