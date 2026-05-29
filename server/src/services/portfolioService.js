import { v4 as uuidv4 } from 'uuid';
import { getStockPrice } from './stockSimulator.js';
import { SENSEX_STOCKS } from '../data/stocks.js';

// ── In-memory portfolio store ──────────────────────────────────────────────
// userId -> { holdings: Map<symbol, holding>, trades: trade[], cash: number }

const portfolios = new Map();

const INITIAL_CASH = 1000000; // ₹10,00,000

function ensurePortfolio(userId) {
  if (!portfolios.has(userId)) {
    portfolios.set(userId, {
      holdings: new Map(), // symbol -> { symbol, quantity, avgBuyPrice, investedAmount }
      trades: [],
      cash: INITIAL_CASH,
    });
  }
  return portfolios.get(userId);
}

// ── Public API ─────────────────────────────────────────────────────────────

export function getPortfolio(userId) {
  const pf = ensurePortfolio(userId);

  const holdings = [];
  for (const [symbol, holding] of pf.holdings) {
    const priceData = getStockPrice(symbol);
    const currentPrice = priceData?.price ?? holding.avgBuyPrice;
    const currentValue = currentPrice * holding.quantity;
    const investedValue = holding.avgBuyPrice * holding.quantity;
    const pnl = currentValue - investedValue;
    const pnlPercent = investedValue > 0 ? (pnl / investedValue) * 100 : 0;

    holdings.push({
      symbol,
      name: priceData?.name ?? symbol,
      sector: priceData?.sector ?? '',
      quantity: holding.quantity,
      avgBuyPrice: round2(holding.avgBuyPrice),
      currentPrice: round2(currentPrice),
      investedValue: round2(investedValue),
      currentValue: round2(currentValue),
      pnl: round2(pnl),
      pnlPercent: round2(pnlPercent),
    });
  }

  return {
    holdings,
    cash: round2(pf.cash),
    totalInvested: round2(holdings.reduce((s, h) => s + h.investedValue, 0)),
    totalCurrentValue: round2(holdings.reduce((s, h) => s + h.currentValue, 0)),
  };
}

export function executeTrade(userId, { symbol, type, quantity, price }) {
  const pf = ensurePortfolio(userId);

  // Validate stock
  const stockInfo = SENSEX_STOCKS.find((s) => s.symbol === symbol);
  if (!stockInfo) {
    throw new Error(`Invalid stock symbol: ${symbol}`);
  }

  // Get live price if not supplied
  const priceData = getStockPrice(symbol);
  const tradePrice = price ?? priceData?.price;
  if (!tradePrice) {
    throw new Error(`Cannot determine price for ${symbol}`);
  }

  quantity = parseInt(quantity, 10);
  if (!quantity || quantity <= 0) {
    throw new Error('Quantity must be a positive integer');
  }

  const totalCost = tradePrice * quantity;

  if (type === 'BUY') {
    if (pf.cash < totalCost) {
      throw new Error(`Insufficient cash. Available: ₹${round2(pf.cash)}, Required: ₹${round2(totalCost)}`);
    }

    pf.cash -= totalCost;

    const existing = pf.holdings.get(symbol);
    if (existing) {
      const totalQty = existing.quantity + quantity;
      const totalInvested = existing.avgBuyPrice * existing.quantity + totalCost;
      existing.avgBuyPrice = totalInvested / totalQty;
      existing.quantity = totalQty;
      existing.investedAmount = totalInvested;
    } else {
      pf.holdings.set(symbol, {
        symbol,
        quantity,
        avgBuyPrice: tradePrice,
        investedAmount: totalCost,
      });
    }
  } else if (type === 'SELL') {
    const existing = pf.holdings.get(symbol);
    if (!existing || existing.quantity < quantity) {
      throw new Error(`Insufficient holdings. You have ${existing?.quantity ?? 0} shares of ${symbol}`);
    }

    pf.cash += totalCost;
    existing.quantity -= quantity;
    existing.investedAmount = existing.avgBuyPrice * existing.quantity;

    if (existing.quantity === 0) {
      pf.holdings.delete(symbol);
    }
  } else {
    throw new Error('Trade type must be BUY or SELL');
  }

  const trade = {
    id: uuidv4(),
    symbol,
    name: stockInfo.name,
    type,
    quantity,
    price: round2(tradePrice),
    total: round2(totalCost),
    timestamp: new Date().toISOString(),
  };

  pf.trades.push(trade);

  return {
    trade,
    cashRemaining: round2(pf.cash),
  };
}

export function getTradeHistory(userId) {
  const pf = ensurePortfolio(userId);
  return [...pf.trades].reverse(); // most recent first
}

export function getPortfolioSummary(userId) {
  const portfolio = getPortfolio(userId);

  const totalPortfolioValue = portfolio.cash + portfolio.totalCurrentValue;
  const totalPnl = portfolio.totalCurrentValue - portfolio.totalInvested;
  const totalPnlPercent = portfolio.totalInvested > 0 ? (totalPnl / portfolio.totalInvested) * 100 : 0;

  // Realized P&L from sell trades
  const pf = ensurePortfolio(userId);
  let realizedPnl = 0;
  // Simplified: track by computing sell proceeds vs avg cost at time of sale
  // For a more accurate method we'd need to track cost basis per lot
  // Here we approximate from trade history
  const sellTrades = pf.trades.filter((t) => t.type === 'SELL');
  // (realizedPnl is complex to compute accurately with avg cost changing; we'll report unrealized + total)

  // Sector allocation
  const sectorAllocation = {};
  for (const h of portfolio.holdings) {
    const sector = h.sector || 'Other';
    sectorAllocation[sector] = (sectorAllocation[sector] || 0) + h.currentValue;
  }

  // Convert to percentages
  const totalHoldingValue = portfolio.totalCurrentValue || 1;
  const sectorAllocationPercent = {};
  for (const [sector, value] of Object.entries(sectorAllocation)) {
    sectorAllocationPercent[sector] = round2((value / totalHoldingValue) * 100);
  }

  return {
    totalValue: round2(totalPortfolioValue),
    cash: portfolio.cash,
    investedValue: portfolio.totalInvested,
    currentHoldingsValue: portfolio.totalCurrentValue,
    unrealizedPnl: round2(totalPnl),
    unrealizedPnlPercent: round2(totalPnlPercent),
    holdingsCount: portfolio.holdings.length,
    tradesCount: pf.trades.length,
    sectorAllocation: sectorAllocationPercent,
    topHoldings: portfolio.holdings
      .sort((a, b) => b.currentValue - a.currentValue)
      .slice(0, 5),
  };
}

// ── Utility ────────────────────────────────────────────────────────────────

function round2(n) {
  return Math.round(n * 100) / 100;
}
