import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getPortfolio, executeTrade, getTradeHistory, getPortfolioSummary } from '../services/portfolioService.js';

const router = Router();

// All portfolio routes require authentication
router.use(authMiddleware);

// GET /api/portfolio — get user portfolio
router.get('/', (req, res) => {
  try {
    const portfolio = getPortfolio(req.user.id);
    res.json(portfolio);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/portfolio/trade — execute a trade
router.post('/trade', (req, res) => {
  try {
    const { symbol, type, quantity } = req.body;

    if (!symbol || !type || !quantity) {
      return res.status(400).json({ error: 'symbol, type (BUY/SELL), and quantity are required' });
    }

    const result = executeTrade(req.user.id, {
      symbol: symbol.toUpperCase(),
      type: type.toUpperCase(),
      quantity,
    });

    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/portfolio/history — trade history
router.get('/history', (req, res) => {
  try {
    const trades = getTradeHistory(req.user.id);
    res.json({ trades });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/portfolio/summary — portfolio summary
router.get('/summary', (req, res) => {
  try {
    const summary = getPortfolioSummary(req.user.id);
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
