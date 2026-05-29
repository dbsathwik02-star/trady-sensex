import { Router } from 'express';
import { getSensexValue, getCurrentPrices } from '../services/stockSimulator.js';
import { SENSEX_STOCKS, SECTORS } from '../data/stocks.js';

const router = Router();

// GET /api/market/sensex — current SENSEX value
router.get('/sensex', (req, res) => {
  const sensex = getSensexValue();
  res.json(sensex);
});

// GET /api/market/gainers — top 5 gainers
router.get('/gainers', (req, res) => {
  const prices = getCurrentPrices();
  const sorted = Object.values(prices)
    .filter((s) => s.changePercent !== undefined)
    .sort((a, b) => b.changePercent - a.changePercent)
    .slice(0, 5);
  res.json({ gainers: sorted });
});

// GET /api/market/losers — top 5 losers
router.get('/losers', (req, res) => {
  const prices = getCurrentPrices();
  const sorted = Object.values(prices)
    .filter((s) => s.changePercent !== undefined)
    .sort((a, b) => a.changePercent - b.changePercent)
    .slice(0, 5);
  res.json({ losers: sorted });
});

// GET /api/market/sectors — sector performance
router.get('/sectors', (req, res) => {
  const prices = getCurrentPrices();

  const sectorData = {};
  for (const sector of SECTORS) {
    sectorData[sector] = { totalChange: 0, count: 0, stocks: [] };
  }

  for (const stock of SENSEX_STOCKS) {
    const p = prices[stock.symbol];
    if (p && sectorData[stock.sector]) {
      sectorData[stock.sector].totalChange += p.changePercent || 0;
      sectorData[stock.sector].count += 1;
      sectorData[stock.sector].stocks.push({
        symbol: stock.symbol,
        name: stock.name,
        price: p.price,
        change: p.change,
        changePercent: p.changePercent,
      });
    }
  }

  const sectors = SECTORS.map((sector) => {
    const d = sectorData[sector];
    return {
      sector,
      avgChangePercent: d.count > 0 ? Math.round((d.totalChange / d.count) * 100) / 100 : 0,
      stockCount: d.count,
      stocks: d.stocks,
    };
  }).sort((a, b) => b.avgChangePercent - a.avgChangePercent);

  res.json({ sectors });
});

export default router;
