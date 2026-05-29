import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

import { initializeSimulator, tick, getCurrentPrices, getStockPrice, getSensexValue } from './services/stockSimulator.js';

import authRoutes from './routes/authRoutes.js';
import stockRoutes from './routes/stockRoutes.js';
import portfolioRoutes from './routes/portfolioRoutes.js';
import signalRoutes from './routes/signalRoutes.js';
import marketRoutes from './routes/marketRoutes.js';

// ── Express setup ──────────────────────────────────────────────────────────
const app = express();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// ── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/stocks', stockRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/signals', signalRoutes);
app.use('/api/market', marketRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// ── HTTP + Socket.IO ───────────────────────────────────────────────────────
const httpServer = createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// ── Socket.IO connection handler ───────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[WS] Client connected: ${socket.id}`);

  // Track which symbols this client is subscribed to
  const subscribedSymbols = new Set();

  socket.on('subscribe', (symbol) => {
    if (typeof symbol === 'string') {
      const sym = symbol.toUpperCase();
      subscribedSymbols.add(sym);
      console.log(`[WS] ${socket.id} subscribed to ${sym}`);

      // Send immediate snapshot
      const price = getStockPrice(sym);
      if (price) {
        socket.emit('priceUpdate', { [sym]: price });
      }
    }
  });

  socket.on('unsubscribe', (symbol) => {
    if (typeof symbol === 'string') {
      const sym = symbol.toUpperCase();
      subscribedSymbols.delete(sym);
      console.log(`[WS] ${socket.id} unsubscribed from ${sym}`);
    }
  });

  // Send personalised price updates every 2 seconds
  const priceInterval = setInterval(() => {
    if (subscribedSymbols.size === 0) return;

    const updates = {};
    for (const sym of subscribedSymbols) {
      const price = getStockPrice(sym);
      if (price) updates[sym] = price;
    }

    if (Object.keys(updates).length > 0) {
      socket.emit('priceUpdate', updates);
    }
  }, 2000);

  socket.on('disconnect', () => {
    clearInterval(priceInterval);
    subscribedSymbols.clear();
    console.log(`[WS] Client disconnected: ${socket.id}`);
  });
});

// Broadcast SENSEX index to ALL clients every 3 seconds
setInterval(() => {
  const sensex = getSensexValue();
  io.emit('sensexUpdate', sensex);
}, 3000);

// ── Initialise simulator & start ticking ───────────────────────────────────
initializeSimulator();

// Tick the simulator every 2 seconds (creates new price movement)
setInterval(() => {
  tick();
}, 2000);

// ── Start server ───────────────────────────────────────────────────────────
const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log(`\n🚀 Sensex Trader Server running on http://localhost:${PORT}`);
  console.log(`   REST API:   http://localhost:${PORT}/api`);
  console.log(`   WebSocket:  ws://localhost:${PORT}`);
  console.log(`   Health:     http://localhost:${PORT}/api/health\n`);
});
