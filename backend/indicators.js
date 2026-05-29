// Helper function to calculate Exponential Moving Average (EMA)
export const calculateEMA = (prices, period) => {
  if (prices.length < period) return null;
  
  const k = 2 / (period + 1);
  // Start with SMA as the initial EMA value
  let ema = prices.slice(0, period).reduce((sum, p) => sum + p, 0) / period;
  
  for (let i = period; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }
  return ema;
};

// Calculate Simple Moving Average (SMA)
export const calculateSMA = (prices, period) => {
  if (prices.length < period) return null;
  const slice = prices.slice(-period);
  return slice.reduce((sum, p) => sum + p, 0) / period;
};

// Calculate Relative Strength Index (RSI)
export const calculateRSI = (prices, period = 14) => {
  if (prices.length < period + 1) return 50; // Neutral default
  
  let gains = 0;
  let losses = 0;
  
  // First window
  for (let i = 1; i <= period; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff > 0) {
      gains += diff;
    } else {
      losses -= diff;
    }
  }
  
  let avgGain = gains / period;
  let avgLoss = losses / period;
  
  // Smooth the rest of the prices
  for (let i = period + 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff > 0) {
      avgGain = (avgGain * (period - 1) + diff) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) - diff) / period;
    }
  }
  
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
};

// Calculate MACD (Moving Average Convergence Divergence)
// Returns { macd, signal, histogram }
export const calculateMACD = (prices, shortPeriod = 12, longPeriod = 26, signalPeriod = 9) => {
  if (prices.length < longPeriod) {
    return { macd: 0, signal: 0, histogram: 0 };
  }
  
  // Calculate MACD line = EMA(12) - EMA(26) for the history
  const macdLineHistory = [];
  for (let i = longPeriod; i <= prices.length; i++) {
    const subset = prices.slice(0, i);
    const emaShort = calculateEMA(subset, shortPeriod);
    const emaLong = calculateEMA(subset, longPeriod);
    macdLineHistory.push(emaShort - emaLong);
  }
  
  // Calculate Signal line = EMA(9) of the MACD line history
  const macd = macdLineHistory[macdLineHistory.length - 1];
  const signal = calculateEMA(macdLineHistory, signalPeriod) || 0;
  const histogram = macd - signal;
  
  return { macd, signal, histogram };
};

// Generate trading signals based on RSI, MACD, and SMA indicators
export const generateSignal = (prices) => {
  if (prices.length < 30) {
    return { signal: 'NEUTRAL', reason: 'Insufficient data points (Need 30+ ticks)' };
  }
  
  const currentPrice = prices[prices.length - 1];
  const rsi = calculateRSI(prices, 14);
  const { macd, signal: macdSignal, histogram } = calculateMACD(prices, 12, 26, 9);
  const sma20 = calculateSMA(prices, 20);
  const sma50 = calculateSMA(prices, 50);
  
  // Determine buy/sell indicators
  let buyScore = 0;
  let sellScore = 0;
  const reasons = [];

  // RSI rules
  if (rsi < 35) {
    buyScore += 2;
    reasons.push(`RSI is oversold (${rsi.toFixed(1)})`);
  } else if (rsi > 65) {
    sellScore += 2;
    reasons.push(`RSI is overbought (${rsi.toFixed(1)})`);
  }

  // MACD rules
  if (macd > macdSignal && histogram > 0) {
    buyScore += 1;
    reasons.push('MACD crossed above signal line');
  } else if (macd < macdSignal && histogram < 0) {
    sellScore += 1;
    reasons.push('MACD crossed below signal line');
  }

  // Moving Average rules
  if (sma20 && currentPrice > sma20) {
    buyScore += 1;
  } else if (sma20 && currentPrice < sma20) {
    sellScore += 1;
  }
  
  if (sma20 && sma50) {
    if (sma20 > sma50) {
      buyScore += 1;
      reasons.push('Golden cross bias (SMA 20 > SMA 50)');
    } else {
      sellScore += 1;
      reasons.push('Death cross bias (SMA 20 < SMA 50)');
    }
  }

  let finalSignal = 'NEUTRAL';
  if (buyScore >= 3 && sellScore < 2) {
    finalSignal = 'BUY';
  } else if (sellScore >= 3 && buyScore < 2) {
    finalSignal = 'SELL';
  }

  return {
    signal: finalSignal,
    rsi,
    macd: { macd, signal: macdSignal, histogram },
    sma20,
    sma50,
    reasons: reasons.length > 0 ? reasons.slice(0, 2) : ['No strong trend detected']
  };
};
