import { SENSEX_STOCKS } from '../data/stocks.js';

// ── Per-sector volatility multipliers ──────────────────────────────────────
const SECTOR_VOLATILITY = {
  Banking: 1.0,
  IT: 1.1,
  Energy: 1.2,
  FMCG: 0.7,
  Auto: 1.05,
  Pharma: 0.9,
  Finance: 1.15,
  Infrastructure: 0.95,
  Telecom: 0.85,
  Consumer: 0.8,
  Cement: 0.9,
  Power: 0.75,
  Metals: 1.3,
};

// ── State ──────────────────────────────────────────────────────────────────
const historicalDaily = new Map();   // symbol -> candle[]
const historicalMinute = new Map();  // symbol -> candle[]
const currentPrices = new Map();     // symbol -> { price, open, high, low, close, change, changePercent, volume, prevClose }
let tickCount = 0;
let currentCandles = new Map();      // symbol -> current 1-min candle being built
let sensexPrevClose = 0;

// ── Helpers ────────────────────────────────────────────────────────────────
function rand(min, max) {
  return min + Math.random() * (max - min);
}

function gaussianRandom() {
  // Box-Muller transform
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function roundPrice(p) {
  return Math.round(p * 100) / 100;
}

// ── Historical candle generators ───────────────────────────────────────────

function generateDailyCandles(stock, days = 180) {
  const candles = [];
  const vol = (SECTOR_VOLATILITY[stock.sector] || 1) * 0.015; // daily vol ~1.5%
  let price = stock.basePrice * rand(0.85, 1.0); // start somewhere near base
  const now = Date.now();
  const msPerDay = 86400000;
  let startTime = now - days * msPerDay;
  let volatilityState = 1; // volatility clustering

  for (let i = 0; i < days; i++) {
    // Volatility clustering: slowly drift the volatility state
    volatilityState += (1 - volatilityState) * 0.05 + gaussianRandom() * 0.1;
    volatilityState = Math.max(0.4, Math.min(2.5, volatilityState));

    const dayVol = vol * volatilityState;
    const drift = gaussianRandom() * dayVol;

    // Mean reversion toward base price (very gentle)
    const reversion = (stock.basePrice - price) / stock.basePrice * 0.01;

    const open = roundPrice(price);
    const closeRaw = price * (1 + drift + reversion);
    const close = roundPrice(Math.max(closeRaw, price * 0.9)); // floor at -10%

    const intraHigh = Math.max(open, close) * (1 + Math.abs(gaussianRandom()) * dayVol * 0.4);
    const intraLow = Math.min(open, close) * (1 - Math.abs(gaussianRandom()) * dayVol * 0.4);

    const high = roundPrice(intraHigh);
    const low = roundPrice(Math.max(intraLow, 1));

    // Volume: base volume proportional to inverse of price, with some randomness
    const baseVol = Math.floor(500000 / (stock.basePrice / 100));
    const volume = Math.floor(baseVol * rand(0.6, 1.8) * volatilityState);

    candles.push({
      time: Math.floor(startTime / 1000),
      open,
      high,
      low,
      close,
      volume,
    });

    price = close;
    startTime += msPerDay;
  }

  return candles;
}

function generateMinuteCandles(stock, minutes = 375 * 5) {
  // 375 minutes per trading day × 5 days
  const candles = [];
  const dailyData = historicalDaily.get(stock.symbol);
  if (!dailyData || dailyData.length === 0) return candles;

  // Start from the close of 5 days ago
  const startIdx = Math.max(0, dailyData.length - 6);
  let price = dailyData[startIdx].close;
  const vol = (SECTOR_VOLATILITY[stock.sector] || 1) * 0.002; // minute vol

  const now = Date.now();
  const msPerMin = 60000;
  let startTime = now - minutes * msPerMin;
  let volatilityState = 1;

  for (let i = 0; i < minutes; i++) {
    // Simulate time-of-day volume pattern (U-shape)
    const minuteInDay = i % 375;
    let volumeMultiplier = 1;
    if (minuteInDay < 30) volumeMultiplier = 2.5 - (minuteInDay / 30) * 1.5; // high at open
    else if (minuteInDay > 345) volumeMultiplier = 1 + ((minuteInDay - 345) / 30) * 1.5; // high at close
    else volumeMultiplier = rand(0.5, 1.2);

    volatilityState += (1 - volatilityState) * 0.02 + gaussianRandom() * 0.05;
    volatilityState = Math.max(0.3, Math.min(2.0, volatilityState));

    const minuteVol = vol * volatilityState;
    const drift = gaussianRandom() * minuteVol;
    const reversion = (stock.basePrice - price) / stock.basePrice * 0.0005;

    const open = roundPrice(price);
    const closeRaw = price * (1 + drift + reversion);
    const close = roundPrice(Math.max(closeRaw, 1));

    const high = roundPrice(Math.max(open, close) * (1 + Math.abs(gaussianRandom()) * minuteVol * 0.3));
    const low = roundPrice(Math.max(Math.min(open, close) * (1 - Math.abs(gaussianRandom()) * minuteVol * 0.3), 1));

    const baseVol = Math.floor(10000 / (stock.basePrice / 100));
    const volume = Math.floor(baseVol * volumeMultiplier * rand(0.5, 1.5));

    candles.push({
      time: Math.floor(startTime / 1000),
      open,
      high,
      low,
      close,
      volume,
    });

    price = close;
    startTime += msPerMin;
  }

  return candles;
}

// ── Aggregate to higher timeframes ─────────────────────────────────────────

function aggregateCandles(candles, periodMinutes) {
  if (!candles || candles.length === 0) return [];
  const periodSec = periodMinutes * 60;
  const result = [];
  let bucket = null;

  for (const c of candles) {
    const bucketStart = Math.floor(c.time / periodSec) * periodSec;
    if (!bucket || bucket.time !== bucketStart) {
      if (bucket) result.push(bucket);
      bucket = { time: bucketStart, open: c.open, high: c.high, low: c.low, close: c.close, volume: c.volume };
    } else {
      bucket.high = Math.max(bucket.high, c.high);
      bucket.low = Math.min(bucket.low, c.low);
      bucket.close = c.close;
      bucket.volume += c.volume;
    }
  }
  if (bucket) result.push(bucket);
  return result;
}

// ── Public API ─────────────────────────────────────────────────────────────

export function initializeSimulator() {
  console.log('[Simulator] Generating historical data for 30 SENSEX stocks…');

  for (const stock of SENSEX_STOCKS) {
    // Daily candles (6 months)
    const daily = generateDailyCandles(stock, 180);
    historicalDaily.set(stock.symbol, daily);

    // Minute candles (last 5 trading days)
    const minute = generateMinuteCandles(stock, 375 * 5);
    historicalMinute.set(stock.symbol, minute);

    // Initialise current price from last minute candle
    const lastCandle = minute[minute.length - 1];
    const prevDailyClose = daily[daily.length - 2]?.close ?? daily[daily.length - 1].open;
    const currentPrice = lastCandle.close;
    const change = roundPrice(currentPrice - prevDailyClose);
    const changePercent = roundPrice((change / prevDailyClose) * 100);

    currentPrices.set(stock.symbol, {
      symbol: stock.symbol,
      name: stock.name,
      sector: stock.sector,
      price: currentPrice,
      open: daily[daily.length - 1].open,
      high: daily[daily.length - 1].high,
      low: daily[daily.length - 1].low,
      close: currentPrice,
      prevClose: prevDailyClose,
      change,
      changePercent,
      volume: lastCandle.volume,
      dayVolume: daily[daily.length - 1].volume,
    });

    // Seed current candle for real-time ticking
    currentCandles.set(stock.symbol, {
      time: Math.floor(Date.now() / 1000),
      open: currentPrice,
      high: currentPrice,
      low: currentPrice,
      close: currentPrice,
      volume: 0,
      ticksInCandle: 0,
    });
  }

  sensexPrevClose = calculateSensexFromPrev();
  console.log('[Simulator] Initialisation complete. SENSEX ~', getSensexValue().value);
}

function calculateSensexFromPrev() {
  let val = 0;
  for (const stock of SENSEX_STOCKS) {
    const p = currentPrices.get(stock.symbol);
    val += (p?.prevClose ?? stock.basePrice) * stock.weight;
  }
  return roundPrice(val);
}

export function getSensexValue() {
  let val = 0;
  for (const stock of SENSEX_STOCKS) {
    const p = currentPrices.get(stock.symbol);
    val += (p?.price ?? stock.basePrice) * stock.weight;
  }
  const value = roundPrice(val);
  const change = roundPrice(value - sensexPrevClose);
  const changePercent = roundPrice((change / sensexPrevClose) * 100);
  return { value, change, changePercent, prevClose: sensexPrevClose };
}

export function getCurrentPrices() {
  const result = {};
  for (const [symbol, data] of currentPrices) {
    result[symbol] = { ...data };
  }
  return result;
}

export function getStockPrice(symbol) {
  return currentPrices.get(symbol) ?? null;
}

export function getHistoricalData(symbol, timeframe = '1D') {
  switch (timeframe) {
    case '1m': {
      return historicalMinute.get(symbol) ?? [];
    }
    case '5m': {
      const mins = historicalMinute.get(symbol) ?? [];
      return aggregateCandles(mins, 5);
    }
    case '15m': {
      const mins = historicalMinute.get(symbol) ?? [];
      return aggregateCandles(mins, 15);
    }
    case '1H': {
      const mins = historicalMinute.get(symbol) ?? [];
      return aggregateCandles(mins, 60);
    }
    case '1D':
    default: {
      return historicalDaily.get(symbol) ?? [];
    }
  }
}

export function tick() {
  tickCount++;
  const updates = {};

  for (const stock of SENSEX_STOCKS) {
    const state = currentPrices.get(stock.symbol);
    const candle = currentCandles.get(stock.symbol);
    if (!state || !candle) continue;

    const vol = (SECTOR_VOLATILITY[stock.sector] || 1) * 0.0008;
    const drift = gaussianRandom() * vol;
    const reversion = (stock.basePrice - state.price) / stock.basePrice * 0.0002;
    const newPrice = roundPrice(Math.max(state.price * (1 + drift + reversion), 1));

    const tickVolume = Math.floor(rand(100, 2000));

    // Update current candle
    candle.close = newPrice;
    candle.high = Math.max(candle.high, newPrice);
    candle.low = Math.min(candle.low, newPrice);
    candle.volume += tickVolume;
    candle.ticksInCandle++;

    // Every 60 ticks → new 1-min candle
    if (candle.ticksInCandle >= 60) {
      // Finalise & push to history
      const finalisedCandle = {
        time: candle.time,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume,
      };
      const mins = historicalMinute.get(stock.symbol);
      if (mins) mins.push(finalisedCandle);

      // Start new candle
      currentCandles.set(stock.symbol, {
        time: Math.floor(Date.now() / 1000),
        open: newPrice,
        high: newPrice,
        low: newPrice,
        close: newPrice,
        volume: 0,
        ticksInCandle: 0,
      });
    }

    // Update current price state
    const change = roundPrice(newPrice - state.prevClose);
    const changePercent = roundPrice((change / state.prevClose) * 100);

    state.price = newPrice;
    state.close = newPrice;
    state.high = Math.max(state.high, newPrice);
    state.low = Math.min(state.low, newPrice);
    state.change = change;
    state.changePercent = changePercent;
    state.volume = candle.volume;

    updates[stock.symbol] = { ...state };
  }

  return updates;
}
