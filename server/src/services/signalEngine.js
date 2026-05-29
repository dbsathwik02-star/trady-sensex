import { getHistoricalData, getStockPrice } from './stockSimulator.js';
import { SENSEX_STOCKS } from '../data/stocks.js';

// ── Core Indicator Helpers ─────────────────────────────────────────────────

export function calculateSMA(data, period) {
  const result = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
      continue;
    }
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sum += data[j];
    }
    result.push(sum / period);
  }
  return result;
}

export function calculateEMA(data, period) {
  const result = [];
  const k = 2 / (period + 1);

  // Seed with SMA
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      sum += data[i];
      result.push(null);
      continue;
    }
    if (i === period - 1) {
      sum += data[i];
      result.push(sum / period);
      continue;
    }
    const prev = result[i - 1];
    result.push(data[i] * k + prev * (1 - k));
  }
  return result;
}

// ── RSI ────────────────────────────────────────────────────────────────────

export function calculateRSI(closePrices, period = 14) {
  const rsi = [];
  if (closePrices.length < period + 1) return rsi;

  const gains = [];
  const losses = [];

  for (let i = 1; i < closePrices.length; i++) {
    const diff = closePrices[i] - closePrices[i - 1];
    gains.push(diff > 0 ? diff : 0);
    losses.push(diff < 0 ? Math.abs(diff) : 0);
  }

  // First average gain/loss (SMA)
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 0; i < period; i++) {
    avgGain += gains[i];
    avgLoss += losses[i];
  }
  avgGain /= period;
  avgLoss /= period;

  // Pad with nulls for indices before we have enough data
  for (let i = 0; i < period; i++) {
    rsi.push(null);
  }

  if (avgLoss === 0) {
    rsi.push(100);
  } else {
    const rs = avgGain / avgLoss;
    rsi.push(100 - 100 / (1 + rs));
  }

  // Smoothed RSI (Wilder's method)
  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;

    if (avgLoss === 0) {
      rsi.push(100);
    } else {
      const rs = avgGain / avgLoss;
      rsi.push(100 - 100 / (1 + rs));
    }
  }

  return rsi;
}

// ── MACD ───────────────────────────────────────────────────────────────────

export function calculateMACD(closePrices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  const ema12 = calculateEMA(closePrices, fastPeriod);
  const ema26 = calculateEMA(closePrices, slowPeriod);

  const macdLine = [];
  for (let i = 0; i < closePrices.length; i++) {
    if (ema12[i] === null || ema26[i] === null) {
      macdLine.push(null);
    } else {
      macdLine.push(ema12[i] - ema26[i]);
    }
  }

  // Filter non-null values for signal EMA, keeping index alignment
  const nonNullMacd = macdLine.filter((v) => v !== null);
  const signalRaw = calculateEMA(nonNullMacd, signalPeriod);

  // Re-align signal line
  const signalLine = [];
  let si = 0;
  for (let i = 0; i < macdLine.length; i++) {
    if (macdLine[i] === null) {
      signalLine.push(null);
    } else {
      signalLine.push(signalRaw[si] ?? null);
      si++;
    }
  }

  const histogram = [];
  for (let i = 0; i < macdLine.length; i++) {
    if (macdLine[i] === null || signalLine[i] === null) {
      histogram.push(null);
    } else {
      histogram.push(macdLine[i] - signalLine[i]);
    }
  }

  return { macdLine, signalLine, histogram };
}

// ── Bollinger Bands ────────────────────────────────────────────────────────

export function calculateBollingerBands(closePrices, period = 20, multiplier = 2) {
  const middle = calculateSMA(closePrices, period);
  const upper = [];
  const lower = [];

  for (let i = 0; i < closePrices.length; i++) {
    if (middle[i] === null) {
      upper.push(null);
      lower.push(null);
      continue;
    }
    // Calculate standard deviation for the window
    let sumSq = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sumSq += (closePrices[j] - middle[i]) ** 2;
    }
    const stdDev = Math.sqrt(sumSq / period);
    upper.push(middle[i] + multiplier * stdDev);
    lower.push(middle[i] - multiplier * stdDev);
  }

  return { upper, middle, lower };
}

// ── Indicator bundle for a symbol ──────────────────────────────────────────

export function getIndicators(symbol) {
  const daily = getHistoricalData(symbol, '1D');
  if (!daily || daily.length < 30) {
    return null;
  }

  const closes = daily.map((c) => c.close);

  const rsi = calculateRSI(closes);
  const macd = calculateMACD(closes);
  const bollinger = calculateBollingerBands(closes);
  const sma20 = calculateSMA(closes, 20);
  const sma50 = calculateSMA(closes, 50);
  const sma200 = calculateSMA(closes, 200);
  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);

  const last = closes.length - 1;

  return {
    symbol,
    rsi: {
      values: rsi,
      current: rsi[rsi.length - 1],
    },
    macd: {
      macdLine: macd.macdLine,
      signalLine: macd.signalLine,
      histogram: macd.histogram,
      currentMACD: macd.macdLine[last],
      currentSignal: macd.signalLine[last],
      currentHistogram: macd.histogram[last],
    },
    bollinger: {
      upper: bollinger.upper,
      middle: bollinger.middle,
      lower: bollinger.lower,
      currentUpper: bollinger.upper[last],
      currentMiddle: bollinger.middle[last],
      currentLower: bollinger.lower[last],
    },
    movingAverages: {
      sma20: sma20[last],
      sma50: sma50[last],
      sma200: sma200[last],
      ema12: ema12[last],
      ema26: ema26[last],
    },
    currentPrice: closes[last],
  };
}

// ── Signal Generation ──────────────────────────────────────────────────────

export function generateSignal(symbol) {
  const indicators = getIndicators(symbol);
  if (!indicators) {
    return { symbol, signal: 'HOLD', strength: 50, indicators: null, reasoning: 'Insufficient data' };
  }

  const reasons = [];
  let score = 0; // ranges from -4 to +4

  // 1. RSI
  const rsiVal = indicators.rsi.current;
  let rsiSignal = 'NEUTRAL';
  if (rsiVal !== null) {
    if (rsiVal < 30) {
      score += 1;
      rsiSignal = 'BUY';
      reasons.push(`RSI oversold at ${rsiVal.toFixed(1)}`);
    } else if (rsiVal > 70) {
      score -= 1;
      rsiSignal = 'SELL';
      reasons.push(`RSI overbought at ${rsiVal.toFixed(1)}`);
    } else {
      reasons.push(`RSI neutral at ${rsiVal.toFixed(1)}`);
    }
  }

  // 2. MACD
  const macdVal = indicators.macd.currentMACD;
  const signalVal = indicators.macd.currentSignal;
  const histVal = indicators.macd.currentHistogram;
  let macdSignal = 'NEUTRAL';
  if (macdVal !== null && signalVal !== null) {
    // Check crossover using histogram direction
    const prevHist = indicators.macd.histogram[indicators.macd.histogram.length - 2];
    if (histVal !== null && prevHist !== null) {
      if (prevHist <= 0 && histVal > 0) {
        score += 1;
        macdSignal = 'BUY';
        reasons.push('MACD bullish crossover');
      } else if (prevHist >= 0 && histVal < 0) {
        score -= 1;
        macdSignal = 'SELL';
        reasons.push('MACD bearish crossover');
      } else if (histVal > 0) {
        score += 0.5;
        macdSignal = 'BUY';
        reasons.push('MACD histogram positive');
      } else {
        score -= 0.5;
        macdSignal = 'SELL';
        reasons.push('MACD histogram negative');
      }
    }
  }

  // 3. Bollinger Bands
  const price = indicators.currentPrice;
  const bbUpper = indicators.bollinger.currentUpper;
  const bbLower = indicators.bollinger.currentLower;
  let bbSignal = 'NEUTRAL';
  if (bbUpper !== null && bbLower !== null) {
    const bbWidth = bbUpper - bbLower;
    const positionInBand = (price - bbLower) / bbWidth;

    if (positionInBand <= 0.05) {
      score += 1;
      bbSignal = 'BUY';
      reasons.push('Price at lower Bollinger Band (potential bounce)');
    } else if (positionInBand >= 0.95) {
      score -= 1;
      bbSignal = 'SELL';
      reasons.push('Price at upper Bollinger Band (potential reversal)');
    } else if (positionInBand < 0.3) {
      score += 0.5;
      bbSignal = 'BUY';
      reasons.push('Price near lower Bollinger Band');
    } else if (positionInBand > 0.7) {
      score -= 0.5;
      bbSignal = 'SELL';
      reasons.push('Price near upper Bollinger Band');
    } else {
      reasons.push('Price within Bollinger Bands');
    }
  }

  // 4. Moving Averages
  const { sma20, sma50, sma200 } = indicators.movingAverages;
  let maSignal = 'NEUTRAL';
  if (sma20 !== null && sma50 !== null) {
    if (sma20 > sma50) {
      score += 0.5;
      reasons.push('SMA20 above SMA50 (short-term bullish)');
    } else {
      score -= 0.5;
      reasons.push('SMA20 below SMA50 (short-term bearish)');
    }
  }
  if (sma200 !== null) {
    if (price > sma200) {
      score += 0.5;
      maSignal = 'BUY';
      reasons.push('Price above SMA200 (long-term bullish)');
    } else {
      score -= 0.5;
      maSignal = 'SELL';
      reasons.push('Price below SMA200 (long-term bearish)');
    }
  }

  // Composite
  // score ranges roughly -4 to +4, normalise to 0-100 strength
  const normalisedScore = Math.max(-4, Math.min(4, score));
  const strength = Math.round(((normalisedScore + 4) / 8) * 100);

  let signal = 'HOLD';
  if (normalisedScore >= 1) signal = 'BUY';
  else if (normalisedScore <= -1) signal = 'SELL';

  return {
    symbol,
    signal,
    strength,
    indicators: {
      rsi: { value: rsiVal, signal: rsiSignal },
      macd: { value: macdVal, signal: macdSignal, histogram: histVal },
      bollinger: { upper: bbUpper, lower: bbLower, signal: bbSignal },
      ma: { sma20, sma50, sma200, signal: maSignal },
    },
    reasoning: reasons.join('. '),
  };
}

export function generateAllSignals() {
  return SENSEX_STOCKS.map((s) => generateSignal(s.symbol));
}
