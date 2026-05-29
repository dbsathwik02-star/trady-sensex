import dotenv from 'dotenv';
dotenv.config();

const MARKET_MODE = process.env.MARKET_MODE || 'SIMULATOR';
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const ALPHAVANTAGE_API_KEY = process.env.ALPHAVANTAGE_API_KEY;

// Short term memory cache (10 seconds) to avoid rate limits
const cache = {};
const CACHE_DURATION_MS = 10000;

/**
 * Normalizes symbol for live global APIs.
 * For free keys, if they search BSE Indian stocks, we can map them to popular tech stocks 
 * or check global tickers (e.g. RELIANCE -> RELIANCE.BOM or AAPL fallback).
 */
const getMappedSymbol = (symbol) => {
  const s = symbol.toUpperCase().trim();
  const maps = {
    'SENSEX': 'SPY', // map SENSEX index to SPY ETF for mock live feeds
    'RELIANCE': 'AAPL',
    'TCS': 'MSFT',
    'HDFCBANK': 'IBN', // ICICI Bank ADR
    'INFY': 'INFY', // Infosys ADR
    'ICICIBANK': 'IBN',
    'SBIN': 'SBIN.NS',
  };
  return maps[s] || s;
};

/**
 * Fetch a quote from Finnhub API
 */
const fetchFinnhubQuote = async (symbol) => {
  const mapped = getMappedSymbol(symbol);
  const url = `https://finnhub.io/api/v1/quote?symbol=${mapped}&token=${FINNHUB_API_KEY}`;
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    
    // Finnhub response fields: 
    // c: Current price, d: Change, dp: Percent change, h: High, l: Low, o: Open, pc: Previous close
    if (data && data.c) {
      return {
        price: Number(data.c),
        change: Number(data.d || 0),
        changePercent: Number(data.dp || 0),
        high: Number(data.h || data.c),
        low: Number(data.l || data.c),
        open: Number(data.o || data.c),
        volume: Math.floor(Math.random() * 100000) + 50000,
        source: 'Finnhub API'
      };
    }
  } catch (err) {
    console.warn(`[MarketProvider] Finnhub fetch failed for ${symbol}:`, err.message);
  }
  return null;
};

/**
 * Fetch a quote from AlphaVantage API
 */
const fetchAlphaVantageQuote = async (symbol) => {
  const mapped = getMappedSymbol(symbol);
  // AlphaVantage supports BOM (BSE) suffixes, e.g. RELIANCE.BOM
  const cleanSymbol = mapped.includes('.') ? mapped : `${mapped}.BOM`;
  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${cleanSymbol}&apikey=${ALPHAVANTAGE_API_KEY}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    const quote = data['Global Quote'];
    
    if (quote && quote['05. price']) {
      const price = Number(quote['05. price']);
      const open = Number(quote['02. open'] || price);
      return {
        price: price,
        change: Number(quote['09. change'] || 0),
        changePercent: Number((quote['10. change percent'] || '0').replace('%', '')),
        high: Number(quote['03. high'] || price),
        low: Number(quote['04. low'] || price),
        open: open,
        volume: Number(quote['06. volume'] || 10000),
        source: 'AlphaVantage API'
      };
    }
  } catch (err) {
    console.warn(`[MarketProvider] AlphaVantage fetch failed for ${symbol}:`, err.message);
  }
  return null;
};

/**
 * Gets the live price & metadata for a stock symbol, with caching and fallback.
 */
export const getStockPrice = async (symbol, simulatorFallback) => {
  const s = symbol.toUpperCase().trim();
  const now = Date.now();

  // 1. Check cache
  if (cache[s] && (now - cache[s].timestamp < CACHE_DURATION_MS)) {
    return cache[s].data;
  }

  // 2. If Simulator mode, use the simulator values directly
  if (MARKET_MODE !== 'LIVE') {
    return null; // Signals server.js to use simulator data
  }

  let result = null;

  // 3. Attempt API fetches based on keys
  if (FINNHUB_API_KEY) {
    result = await fetchFinnhubQuote(s);
  } else if (ALPHAVANTAGE_API_KEY) {
    result = await fetchAlphaVantageQuote(s);
  }

  // 4. Cache and return (graceful fallback if API fails)
  if (result) {
    console.log(`[MarketProvider] Live data fetched for ${s}: ₹${result.price.toFixed(2)} (${result.source})`);
    cache[s] = {
      timestamp: now,
      data: result
    };
    return result;
  }

  // Gracefully fallback to simulator ticks if API keys are missing or limits reached
  return null; 
};
