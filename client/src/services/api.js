const API_BASE = '/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const api = {
  // Auth
  login: async (email, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST', headers: getHeaders(), body: JSON.stringify({ email, password })
    });
    return res.json();
  },
  register: async (username, email, password) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST', headers: getHeaders(), body: JSON.stringify({ username, email, password })
    });
    return res.json();
  },
  getUser: async () => {
    const res = await fetch(`${API_BASE}/auth/me`, { headers: getHeaders() });
    return res.json();
  },
  // Stocks
  getStocks: async () => {
    const res = await fetch(`${API_BASE}/stocks`, { headers: getHeaders() });
    return res.json();
  },
  getStock: async (symbol) => {
    const res = await fetch(`${API_BASE}/stocks/${symbol}`, { headers: getHeaders() });
    return res.json();
  },
  getHistory: async (symbol, timeframe = '1D') => {
    const res = await fetch(`${API_BASE}/stocks/${symbol}/history?timeframe=${timeframe}`, { headers: getHeaders() });
    return res.json();
  },
  getIndicators: async (symbol) => {
    const res = await fetch(`${API_BASE}/stocks/${symbol}/indicators`, { headers: getHeaders() });
    return res.json();
  },
  // Signals
  getSignals: async () => {
    const res = await fetch(`${API_BASE}/signals`, { headers: getHeaders() });
    return res.json();
  },
  getSignal: async (symbol) => {
    const res = await fetch(`${API_BASE}/signals/${symbol}`, { headers: getHeaders() });
    return res.json();
  },
  // Portfolio
  getPortfolio: async () => {
    const res = await fetch(`${API_BASE}/portfolio`, { headers: getHeaders() });
    return res.json();
  },
  executeTrade: async (symbol, type, quantity) => {
    const res = await fetch(`${API_BASE}/portfolio/trade`, {
      method: 'POST', headers: getHeaders(), body: JSON.stringify({ symbol, type, quantity })
    });
    return res.json();
  },
  getTradeHistory: async () => {
    const res = await fetch(`${API_BASE}/portfolio/history`, { headers: getHeaders() });
    return res.json();
  },
  getPortfolioSummary: async () => {
    const res = await fetch(`${API_BASE}/portfolio/summary`, { headers: getHeaders() });
    return res.json();
  },
  // Market
  getSensex: async () => {
    const res = await fetch(`${API_BASE}/market/sensex`, { headers: getHeaders() });
    return res.json();
  },
  getGainers: async () => {
    const res = await fetch(`${API_BASE}/market/gainers`, { headers: getHeaders() });
    return res.json();
  },
  getLosers: async () => {
    const res = await fetch(`${API_BASE}/market/losers`, { headers: getHeaders() });
    return res.json();
  },
  getSectors: async () => {
    const res = await fetch(`${API_BASE}/market/sectors`, { headers: getHeaders() });
    return res.json();
  }
};
