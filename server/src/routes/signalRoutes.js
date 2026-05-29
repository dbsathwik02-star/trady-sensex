import { Router } from 'express';
import { generateSignal, generateAllSignals } from '../services/signalEngine.js';
import { SENSEX_STOCKS } from '../data/stocks.js';

const router = Router();

// GET /api/signals — signals for all stocks
router.get('/', (req, res) => {
  const signals = generateAllSignals();
  res.json({ signals });
});

// GET /api/signals/:symbol — signal for one stock
router.get('/:symbol', (req, res) => {
  const symbol = req.params.symbol.toUpperCase();

  const stockInfo = SENSEX_STOCKS.find((s) => s.symbol === symbol);
  if (!stockInfo) {
    return res.status(404).json({ error: `Stock ${symbol} not found` });
  }

  const signal = generateSignal(symbol);
  res.json(signal);
});

export default router;
