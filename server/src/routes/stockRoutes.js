import { Router } from 'express';
import { getCurrentPrices, getStockPrice, getHistoricalData } from '../services/stockSimulator.js';
import { getIndicators } from '../services/signalEngine.js';
import { SENSEX_STOCKS } from '../data/stocks.js';

const router = Router();

// GET /api/stocks — list all stocks with current prices
router.get('/', (req, res) => {
  const prices = getCurrentPrices();
  const stocks = SENSEX_STOCKS.map((s) => ({
    ...s,
    ...(prices[s.symbol] || {}),
  }));
  res.json({ stocks });
});

// GET /api/stocks/:symbol — single stock details
router.get('/:symbol', (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const stockInfo = SENSEX_STOCKS.find((s) => s.symbol === symbol);
  if (!stockInfo) {
    return res.status(404).json({ error: `Stock ${symbol} not found` });
  }

  const priceData = getStockPrice(symbol);
  res.json({
    ...stockInfo,
    ...(priceData || {}),
  });
});

// GET /api/stocks/:symbol/history?timeframe=1D
router.get('/:symbol/history', (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const timeframe = req.query.timeframe || '1D';

  const stockInfo = SENSEX_STOCKS.find((s) => s.symbol === symbol);
  if (!stockInfo) {
    return res.status(404).json({ error: `Stock ${symbol} not found` });
  }

  const validTimeframes = ['1m', '5m', '15m', '1H', '1D'];
  if (!validTimeframes.includes(timeframe)) {
    return res.status(400).json({ error: `Invalid timeframe. Use one of: ${validTimeframes.join(', ')}` });
  }

  const data = getHistoricalData(symbol, timeframe);
  res.json({ symbol, timeframe, candles: data });
});

// GET /api/stocks/:symbol/indicators — technical indicators
router.get('/:symbol/indicators', (req, res) => {
  const symbol = req.params.symbol.toUpperCase();

  const stockInfo = SENSEX_STOCKS.find((s) => s.symbol === symbol);
  if (!stockInfo) {
    return res.status(404).json({ error: `Stock ${symbol} not found` });
  }

  const indicators = getIndicators(symbol);
  if (!indicators) {
    return res.status(500).json({ error: 'Could not compute indicators' });
  }

  // Return only current values (not full arrays) for the REST response
  res.json({
    symbol,
    currentPrice: indicators.currentPrice,
    rsi: indicators.rsi.current,
    macd: {
      value: indicators.macd.currentMACD,
      signal: indicators.macd.currentSignal,
      histogram: indicators.macd.currentHistogram,
    },
    bollinger: {
      upper: indicators.bollinger.currentUpper,
      middle: indicators.bollinger.currentMiddle,
      lower: indicators.bollinger.currentLower,
    },
    movingAverages: indicators.movingAverages,
  });
});

export default router;
