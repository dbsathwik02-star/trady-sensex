import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import { socket } from '../../services/socket';
import Header from './Header';
import TickerStrip from './TickerStrip';
import Watchlist from '../watchlist/Watchlist';
import TradingChart from '../charts/TradingChart';
import OrderPanel from './OrderPanel';
import SignalPanel from '../signals/SignalPanel';
import PortfolioPanel from '../portfolio/PortfolioPanel';
import MarketOverview from '../market/MarketOverview';
import Toast from '../common/Toast';

export default function Dashboard() {
  const [stocks, setStocks] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [sensex, setSensex] = useState(null);
  const [signals, setSignals] = useState([]);
  const [portfolio, setPortfolio] = useState(null);
  const [bottomTab, setBottomTab] = useState('signals');

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stocksData, sensexData, signalsData, portfolioData] = await Promise.all([
          api.getStocks(),
          api.getSensex(),
          api.getSignals(),
          api.getPortfolio(),
        ]);
        if (Array.isArray(stocksData)) {
          setStocks(stocksData);
          if (stocksData.length > 0 && !selectedStock) {
            setSelectedStock(stocksData[0]);
          }
        }
        if (sensexData) setSensex(sensexData);
        if (Array.isArray(signalsData)) setSignals(signalsData);
        if (portfolioData) setPortfolio(portfolioData);
      } catch (err) {
        console.error('Failed to fetch initial data:', err);
      }
    };
    fetchData();
  }, []);

  // Socket.IO connection
  useEffect(() => {
    socket.connect();

    socket.on('priceUpdate', (data) => {
      setStocks(prev =>
        prev.map(s => s.symbol === data.symbol ? { ...s, ...data } : s)
      );
      setSelectedStock(prev => {
        if (prev && prev.symbol === data.symbol) return { ...prev, ...data };
        return prev;
      });
    });

    socket.on('sensexUpdate', (data) => {
      setSensex(data);
    });

    socket.on('signalUpdate', (data) => {
      setSignals(prev => {
        const idx = prev.findIndex(s => s.symbol === data.symbol);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = data;
          return updated;
        }
        return [...prev, data];
      });
    });

    return () => {
      socket.off('priceUpdate');
      socket.off('sensexUpdate');
      socket.off('signalUpdate');
      socket.disconnect();
    };
  }, []);

  const handleSelectStock = useCallback((stock) => {
    setSelectedStock(stock);
  }, []);

  const refreshPortfolio = useCallback(async () => {
    try {
      const data = await api.getPortfolio();
      if (data) setPortfolio(data);
    } catch (err) {
      console.error('Failed to refresh portfolio:', err);
    }
  }, []);

  const bottomTabs = [
    { key: 'signals', label: '📡 Signals', icon: '📡' },
    { key: 'portfolio', label: '💼 Portfolio', icon: '💼' },
    { key: 'market', label: '🌐 Market', icon: '🌐' },
  ];

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      <Toast />

      {/* Header */}
      <Header sensex={sensex} stocks={stocks} onSelectStock={handleSelectStock} />

      {/* Ticker Strip */}
      <TickerStrip stocks={stocks} onSelectStock={handleSelectStock} />

      {/* Main Content Grid */}
      <div className="flex-1 grid grid-cols-12 gap-2 p-2 overflow-hidden" style={{ minHeight: 0 }}>
        {/* Left Sidebar - Watchlist */}
        <div className="col-span-2 overflow-hidden flex flex-col">
          <Watchlist
            stocks={stocks}
            selectedStock={selectedStock}
            onSelectStock={handleSelectStock}
          />
        </div>

        {/* Center - Chart Area */}
        <div className="col-span-7 flex flex-col gap-2 overflow-hidden">
          <div className="flex-1 min-h-0">
            <TradingChart stock={selectedStock} />
          </div>
        </div>

        {/* Right Sidebar - Order Panel */}
        <div className="col-span-3 overflow-hidden">
          <OrderPanel
            stock={selectedStock}
            portfolio={portfolio}
            onTradeExecuted={refreshPortfolio}
          />
        </div>
      </div>

      {/* Bottom Panel with Tabs */}
      <div className="h-72 flex flex-col" style={{ borderTop: '1px solid var(--border-color)' }}>
        {/* Tab Navigation */}
        <div className="flex items-center px-4 gap-1 pt-1" style={{ background: 'var(--bg-secondary)' }}>
          {bottomTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setBottomTab(tab.key)}
              className="px-4 py-2 text-sm font-medium rounded-t-lg transition-all duration-200"
              style={{
                background: bottomTab === tab.key ? 'var(--bg-card)' : 'transparent',
                color: bottomTab === tab.key ? 'var(--accent-blue)' : 'var(--text-muted)',
                borderBottom: bottomTab === tab.key ? '2px solid var(--accent-blue)' : '2px solid transparent',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-auto" style={{ background: 'var(--bg-card)' }}>
          {bottomTab === 'signals' && (
            <SignalPanel stock={selectedStock} signals={signals} />
          )}
          {bottomTab === 'portfolio' && (
            <PortfolioPanel portfolio={portfolio} onRefresh={refreshPortfolio} />
          )}
          {bottomTab === 'market' && (
            <MarketOverview sensex={sensex} stocks={stocks} />
          )}
        </div>
      </div>
    </div>
  );
}
