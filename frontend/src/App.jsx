import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { Activity, User, LogOut, LayoutDashboard, UserSquare2, RefreshCcw, Search, X } from 'lucide-react';
import ChartSection from './components/ChartSection';
import OrderForm from './components/OrderForm';
import Portfolio from './components/Portfolio';
import Watchlist from './components/Watchlist';
import NewsFeed from './components/NewsFeed';
import AuthModal from './components/AuthModal';
import ProfileSection from './components/ProfileSection';
import ChatBot from './components/ChatBot';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('sensex_token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('sensex_user')));
  const [view, setView] = useState('dashboard'); // 'dashboard' or 'profile'
  
  const [stocks, setStocks] = useState({});
  const [watchlist, setWatchlist] = useState([]);
  const [news, setNews] = useState([]);
  const [selectedSymbol, setSelectedSymbol] = useState('RELIANCE');
  const [portfolio, setPortfolio] = useState({ balance: 1000000, holdings: [] });
  const [transactions, setTransactions] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [flashStates, setFlashStates] = useState({});
  const [notifications, setNotifications] = useState([]);

  // Trigger floating notifications
  const showToastNotification = (message, type = 'info') => {
    const id = Math.random().toString(36).substring(7);
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  // Shared refresh portfolio function
  const fetchUpdatedPortfolio = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const [portfolioRes, transactionsRes, ordersRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/portfolio`, { headers }).then(res => res.json()),
        fetch(`${BACKEND_URL}/api/transactions`, { headers }).then(res => res.json()),
        fetch(`${BACKEND_URL}/api/orders`, { headers }).then(res => res.json())
      ]);
      setPortfolio(portfolioRes);
      setTransactions(transactionsRes);
      setPendingOrders(ordersRes || []);
    } catch (err) {
      console.error('Failed to fetch updated portfolio:', err);
    }
  };

  // Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Triggered when user successfully registers or logs in
  const handleAuthSuccess = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    setView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('sensex_token');
    localStorage.removeItem('sensex_user');
    setToken(null);
    setUser(null);
    setPortfolio({ balance: 1000000, holdings: [] });
    setTransactions([]);
  };

  useEffect(() => {
    if (!token) return;

    const fetchInitialData = async () => {
      try {
        const headers = { 'Authorization': `Bearer ${token}` };
        
        const [portfolioRes, transactionsRes, watchlistRes, ordersRes] = await Promise.all([
          fetch(`${BACKEND_URL}/api/portfolio`, { headers }).then(res => res.json()),
          fetch(`${BACKEND_URL}/api/transactions`, { headers }).then(res => res.json()),
          fetch(`${BACKEND_URL}/api/watchlist`, { headers }).then(res => res.json()),
          fetch(`${BACKEND_URL}/api/orders`, { headers }).then(res => res.json())
        ]);
        
        if (portfolioRes.error === 'Token expired or invalid') {
          handleLogout();
          return;
        }

        setPortfolio(portfolioRes);
        setTransactions(transactionsRes);
        setWatchlist(watchlistRes);
        setPendingOrders(ordersRes || []);
      } catch (err) {
        console.error('REST API initialization error:', err);
      }
    };
    
    fetchInitialData();

    const socket = io(BACKEND_URL);

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('order-executed', (data) => {
      if (data.userId === user?.id || data.userId === 'default_guest_user') {
        showToastNotification(data.message, 'success');
        fetchUpdatedPortfolio();
      }
    });

    socket.on('holding-triggered', (data) => {
      if (data.userId === user?.id || data.userId === 'default_guest_user') {
        showToastNotification(data.message, 'warning');
        fetchUpdatedPortfolio();
      }
    });

    socket.on('initial-stocks', (initialStocks) => {
      setStocks(initialStocks);
    });

    socket.on('initial-news', (initialNews) => {
      setNews(initialNews);
    });

    socket.on('stock-ticks', (ticks) => {
      setStocks((prevStocks) => {
        const updatedStocks = { ...prevStocks };
        const newFlashStates = {};

        Object.keys(ticks).forEach((symbol) => {
          if (prevStocks[symbol]) {
            const prevPrice = prevStocks[symbol].price;
            const newPrice = ticks[symbol].price;
            
            if (newPrice > prevPrice) {
              newFlashStates[symbol] = 'flash-up';
            } else if (newPrice < prevPrice) {
              newFlashStates[symbol] = 'flash-down';
            }

            const history = [...(prevStocks[symbol].history || [])];
            history.push(newPrice);
            if (history.length > 120) history.shift();

            updatedStocks[symbol] = {
              ...ticks[symbol],
              history
            };
          } else {
            updatedStocks[symbol] = ticks[symbol];
          }
        });

        setFlashStates((prev) => ({ ...prev, ...newFlashStates }));
        setTimeout(() => {
          setFlashStates((prev) => {
            const next = { ...prev };
            Object.keys(newFlashStates).forEach((s) => delete next[s]);
            return next;
          });
        }, 800);

        return updatedStocks;
      });
    });

    socket.on('news-update', ({ newsEvent, stockAffected }) => {
      setNews((prevNews) => [newsEvent, ...prevNews].slice(0, 30));
    });

    return () => {
      socket.disconnect();
    };
  }, [token]);

  // Search input change handler
  const handleSearchChange = async (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (!val.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/stocks/search?q=${val}`);
      const data = await response.json();
      setSearchResults(data);
    } catch (err) {
      console.error('Failed to search stocks:', err);
    }
  };

  // Select a searched stock
  const handleSelectSearchedStock = (stock) => {
    setStocks((prev) => {
      if (prev[stock.symbol]) return prev;
      return {
        ...prev,
        [stock.symbol]: stock
      };
    });
    setSelectedSymbol(stock.symbol);
    setView('dashboard');
    setSearchQuery('');
    setSearchResults([]);
  };

  // Search submit on Enter press
  const handleSearchKeyDown = async (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      try {
        const response = await fetch(`${BACKEND_URL}/api/stocks/search?q=${searchQuery}`);
        const data = await response.json();
        if (data.length > 0) {
          handleSelectSearchedStock(data[0]);
        }
      } catch (err) {
        console.error('Search submit error:', err);
      }
    }
  };

  // Update watchlist CRUD with Auth Header
  const handleUpdateWatchlist = async (newWatchlist) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/watchlist`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ symbols: newWatchlist })
      });
      const data = await response.json();
      setWatchlist(data);
    } catch (error) {
      console.error('Failed to update watchlist:', error);
    }
  };

  // Execute trade with Auth Header
  const handleExecuteTrade = async ({ symbol, quantity, type, price, orderType, takeProfitPercent, stopLossPercent }) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/trade`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ symbol, quantity, type, price, orderType, takeProfitPercent, stopLossPercent })
      });
      const result = await response.json();
      if (result.success) {
        if (result.isLimitOrder) {
          setPendingOrders(prev => [result.order, ...prev]);
          showToastNotification(`Limit ${type} order placed for ${quantity} shares of ${symbol} at ₹${price.toFixed(2)}.`, 'success');
        } else {
          setPortfolio(result.portfolio);
          setTransactions((prev) => [result.transaction, ...prev]);
          showToastNotification(`Executed Market ${type} order for ${quantity} shares of ${symbol}.`, 'success');
        }
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      return { success: false, error: 'Server connection failed.' };
    }
  };

  // Cancel pending order
  const handleCancelOrder = async (orderId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/orders/cancel`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ orderId })
      });
      const data = await response.json();
      if (data.success) {
        setPendingOrders(prev => prev.filter(o => (o._id || o.id) !== orderId));
        showToastNotification('Limit order cancelled successfully.', 'info');
      }
    } catch (err) {
      console.error('Failed to cancel order:', err);
    }
  };

  // Reset virtual cash portfolio
  const handleResetPortfolio = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/portfolio/reset`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setPortfolio(data);
      setTransactions([]);
      setPendingOrders([]);
      showToastNotification('Virtual portfolio successfully reset.', 'info');
    } catch (error) {
      console.error('Failed to reset portfolio:', error);
    }
  };

  // If token is missing, force login modal overlay
  if (!token) {
    return <AuthModal onAuthSuccess={handleAuthSuccess} />;
  }

  const sensexStock = stocks['SENSEX'];
  const isSensexUp = sensexStock ? sensexStock.changePercent >= 0 : true;

  const getHeaderAvatarClass = (color) => {
    switch (color) {
      case 'emerald': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'purple': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'orange': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-[#070b13] pb-10 text-slate-100 flex flex-col selection:bg-blue-500/30 selection:text-blue-200">
      
      {/* Ticker Bar Marquee */}
      <div className="bg-[#0b0f19]/80 border-b border-slate-900/60 backdrop-blur-md h-9 overflow-hidden flex items-center z-10">
        <div className="animate-marquee whitespace-nowrap flex gap-8 select-none">
          {Object.keys(stocks).map((symbol) => {
            const s = stocks[symbol];
            if (symbol === 'SENSEX') return null;
            const isUp = s.changePercent >= 0;
            return (
              <span 
                key={symbol} 
                onClick={() => { setSelectedSymbol(symbol); setView('dashboard'); }}
                className={`inline-flex items-center gap-1.5 cursor-pointer text-xs font-semibold px-2 py-0.5 rounded transition-all hover:bg-slate-800/40 ${flashStates[symbol] || ''}`}
              >
                <span className="text-slate-400 font-bold">{symbol}</span>
                <span className="text-white">₹{s.price.toFixed(2)}</span>
                <span className={`text-[10px] ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isUp ? '▲' : '▼'}{Math.abs(s.changePercent).toFixed(2)}%
                </span>
              </span>
            );
          })}
        </div>
      </div>

      {/* Main Header */}
      <header className="glass-panel border-t-0 border-x-0 py-4 px-6 sticky top-0 z-20 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-6 flex-1">
          
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('dashboard')}>
            <div className="h-9 w-9 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Activity className="h-5 w-5 text-white animate-pulse" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-base font-extrabold tracking-tight bg-gradient-to-r from-slate-50 via-slate-100 to-slate-300 bg-clip-text text-transparent leading-none">
                SENSEX LIVE TRADER
              </h1>
              <p className="text-[9px] text-slate-500 font-bold tracking-wider uppercase mt-1">BSE Simulated Exchange</p>
            </div>
          </div>

          {/* New Search Input */}
          <div className="relative w-48 sm:w-64 lg:w-80 z-30">
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800/75 focus-within:border-blue-500 transition-colors">
              <Search className="h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search stocks (Tata, SBI, Zomato)..."
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyDown}
                className="bg-transparent border-none outline-none text-[10px] sm:text-xs text-slate-200 w-full placeholder-slate-600 font-semibold"
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(''); setSearchResults([]); }} className="text-slate-500 hover:text-white cursor-pointer">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Dropdown Results Overlay */}
            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 p-2 text-[10px] sm:text-xs max-h-60 overflow-y-auto">
                {searchResults.map((stock) => (
                  <button
                    key={stock.symbol}
                    onClick={() => handleSelectSearchedStock(stock)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-800 text-left transition-colors cursor-pointer group"
                  >
                    <div>
                      <span className="font-extrabold text-white group-hover:text-blue-400 transition-colors">{stock.symbol}</span>
                      <span className="text-[9px] sm:text-[10px] text-slate-500 ml-2">{stock.name}</span>
                    </div>
                    <span className="font-bold text-slate-300">₹{stock.price.toFixed(2)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Navigation links */}
          <div className="hidden md:flex items-center gap-2 bg-slate-900/60 p-1 rounded-xl border border-slate-800/80 text-xs">
            <button
              onClick={() => setView('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                view === 'dashboard' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span>Dashboard</span>
            </button>
            
            <button
              onClick={() => setView('profile')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                view === 'profile' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserSquare2 className="h-3.5 w-3.5" />
              <span>My Profile Stats</span>
            </button>
          </div>
        </div>

        {/* User Card, Index update & Sign Out */}
        <div className="flex items-center gap-4 sm:gap-6 ml-3">
          {sensexStock && (
            <div className="hidden lg:flex flex-col items-end">
              <span className="text-[10px] text-slate-500 font-semibold uppercase">BSE SENSEX</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-sm font-black text-white">₹{sensexStock.price.toFixed(2)}</span>
                <span className={`text-xs font-bold ${isSensexUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isSensexUp ? '+' : ''}{sensexStock.changePercent.toFixed(2)}%
                </span>
              </div>
            </div>
          )}

          {/* User badge and Log Out */}
          <div className="flex items-center gap-3 border-l border-slate-800/85 pl-4 sm:pl-6">
            <button 
              onClick={() => setView('profile')}
              className="flex items-center gap-2 group text-left cursor-pointer"
            >
              <div className={`h-8 w-8 rounded-full border flex items-center justify-center transition-colors group-hover:bg-slate-800 ${getHeaderAvatarClass(user?.avatar)}`}>
                <User className="h-4 w-4" />
              </div>
              <div className="hidden sm:block">
                <div className="text-xs font-extrabold text-white leading-none group-hover:text-blue-400 transition-colors">{user?.name}</div>
                <div className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">{user?.tradingLevel}</div>
              </div>
            </button>

            <button
              onClick={handleLogout}
              className="text-slate-500 hover:text-rose-400 p-1.5 hover:bg-slate-800/40 rounded-xl transition-all cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid Content */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 mt-6">
        
        {/* Navigation tabs for smaller devices */}
        <div className="md:hidden flex bg-slate-900/60 p-1 rounded-xl border border-slate-800/85 mb-6 text-xs">
          <button
            onClick={() => setView('dashboard')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg font-bold transition-all ${
              view === 'dashboard' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400'
            }`}
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            <span>Dashboard</span>
          </button>
          
          <button
            onClick={() => setView('profile')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg font-bold transition-all ${
              view === 'profile' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400'
            }`}
          >
            <UserSquare2 className="h-3.5 w-3.5" />
            <span>My Profile</span>
          </button>
        </div>

        {view === 'dashboard' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Side: Chart & Portfolio */}
            <div className="lg:col-span-8 space-y-6">
              <ChartSection 
                stock={stocks[selectedSymbol]} 
                history={stocks[selectedSymbol]?.history || []} 
              />
              
              <Portfolio 
                portfolio={portfolio} 
                stocks={stocks} 
                transactions={transactions} 
                pendingOrders={pendingOrders}
                onCancelOrder={handleCancelOrder}
                onReset={handleResetPortfolio} 
                onSelectStock={setSelectedSymbol}
              />
            </div>

            {/* Right Side: Order form, Watchlist, News */}
            <div className="lg:col-span-4 space-y-6">
              
              <OrderForm 
                stock={stocks[selectedSymbol]} 
                portfolio={portfolio} 
                onExecuteTrade={handleExecuteTrade} 
              />
              
              <Watchlist 
                watchlist={watchlist} 
                stocks={stocks} 
                onUpdateWatchlist={handleUpdateWatchlist} 
                selectedSymbol={selectedSymbol} 
                onSelectStock={setSelectedSymbol} 
              />

              <NewsFeed 
                news={news} 
                onSelectStock={setSelectedSymbol} 
              />
            </div>
          </div>
        ) : (
          // Profile statistics section view
          <ProfileSection
            user={user}
            portfolio={portfolio}
            transactions={transactions}
            onUpdateProfile={setUser}
          />
        )}
      </div>

      {/* Floating AI Chatbot Assistant */}
      <ChatBot />

      {/* Floating Toast Notifications */}
      <div className="fixed bottom-6 right-6 space-y-2 z-50 max-w-sm pointer-events-none">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`pointer-events-auto p-4 rounded-2xl border shadow-2xl flex items-center justify-between gap-3 text-xs font-bold backdrop-blur-md animate-fade-in ${
              n.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-400 border-emerald-500/30 shadow-emerald-500/10'
                : n.type === 'warning'
                ? 'bg-rose-950/90 text-rose-400 border-rose-500/30 shadow-rose-500/10'
                : 'bg-slate-900/90 text-blue-400 border-slate-700/50 shadow-blue-500/10'
            }`}
          >
            <span>{n.message}</span>
            <button
              onClick={() => setNotifications(prev => prev.filter(item => item.id !== n.id))}
              className="text-slate-500 hover:text-white cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
