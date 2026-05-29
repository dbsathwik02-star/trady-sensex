import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { showToast } from '../common/Toast';

function formatIndian(num) {
  if (num == null) return '—';
  const parts = Number(num).toFixed(2).split('.');
  let intPart = parts[0];
  const decPart = parts[1];
  const isNeg = intPart.startsWith('-');
  if (isNeg) intPart = intPart.slice(1);
  let result = '';
  if (intPart.length <= 3) {
    result = intPart;
  } else {
    result = intPart.slice(-3);
    intPart = intPart.slice(0, -3);
    while (intPart.length > 2) {
      result = intPart.slice(-2) + ',' + result;
      intPart = intPart.slice(0, -2);
    }
    if (intPart) result = intPart + ',' + result;
  }
  return (isNeg ? '-' : '') + result + '.' + decPart;
}

export default function PortfolioPanel({ portfolio, onRefresh }) {
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('holdings');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await api.getTradeHistory();
        if (Array.isArray(data)) setHistory(data);
      } catch (err) {
        console.error('Failed to fetch trade history:', err);
      }
    };
    fetchHistory();
  }, [portfolio]);

  const holdings = portfolio?.holdings || [];
  const summary = portfolio?.summary || portfolio || {};
  const totalInvested = summary.totalInvested ?? summary.invested ?? 0;
  const currentValue = summary.currentValue ?? summary.value ?? 0;
  const totalPnl = summary.totalPnl ?? summary.pnl ?? (currentValue - totalInvested);
  const totalPnlPct = totalInvested > 0 ? ((totalPnl / totalInvested) * 100) : 0;
  const cash = summary.cash ?? summary.availableCash ?? 0;
  const isPnlUp = totalPnl >= 0;

  const handleSell = async (symbol) => {
    const holding = holdings.find(h => h.symbol === symbol);
    if (!holding) return;
    try {
      const result = await api.executeTrade(symbol, 'SELL', holding.quantity);
      if (result.error) {
        showToast(result.error, 'error');
      } else {
        showToast(`Sold ${holding.quantity} × ${symbol}`, 'success');
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      showToast('Sell failed. Please try again.', 'error');
    }
  };

  return (
    <div className="flex h-full gap-2 p-3">
      {/* Summary Cards */}
      <div className="flex flex-col gap-2 w-60 flex-shrink-0">
        <div className="rounded-xl p-3" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total Invested</p>
          <p className="text-lg font-bold font-mono" style={{ color: 'var(--text-primary)' }}>
            ₹{formatIndian(totalInvested)}
          </p>
        </div>
        <div className="rounded-xl p-3" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Current Value</p>
          <p className="text-lg font-bold font-mono" style={{ color: 'var(--accent-cyan)' }}>
            ₹{formatIndian(currentValue)}
          </p>
        </div>
        <div className="rounded-xl p-3" style={{
          background: isPnlUp ? 'rgba(0,230,118,0.05)' : 'rgba(255,82,82,0.05)',
          border: `1px solid ${isPnlUp ? 'rgba(0,230,118,0.2)' : 'rgba(255,82,82,0.2)'}`,
        }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total P&L</p>
          <p className="text-lg font-bold font-mono" style={{
            color: isPnlUp ? 'var(--accent-green)' : 'var(--accent-red)',
          }}>
            {isPnlUp ? '+' : ''}₹{formatIndian(totalPnl)}
          </p>
          <p className="text-xs font-mono" style={{
            color: isPnlUp ? 'var(--accent-green)' : 'var(--accent-red)',
          }}>
            {isPnlUp ? '+' : ''}{totalPnlPct.toFixed(2)}%
          </p>
        </div>
        <div className="rounded-xl p-3" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Available Cash</p>
          <p className="text-lg font-bold font-mono" style={{ color: 'var(--accent-cyan)' }}>
            ₹{formatIndian(cash)}
          </p>
        </div>
      </div>

      {/* Holdings & History */}
      <div className="flex-1 flex flex-col rounded-xl overflow-hidden"
        style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>

        {/* Tabs */}
        <div className="flex gap-1 px-3 pt-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setActiveTab('holdings')}
            className="px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-colors"
            style={{
              background: activeTab === 'holdings' ? 'var(--bg-card)' : 'transparent',
              color: activeTab === 'holdings' ? 'var(--accent-blue)' : 'var(--text-muted)',
            }}
          >
            📦 Holdings ({holdings.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className="px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-colors"
            style={{
              background: activeTab === 'history' ? 'var(--bg-card)' : 'transparent',
              color: activeTab === 'history' ? 'var(--accent-blue)' : 'var(--text-muted)',
            }}
          >
            📜 Trade History
          </button>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto">
          {activeTab === 'holdings' ? (
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  {['Symbol', 'Qty', 'Avg Price', 'Current', 'P&L', 'P&L%', 'Action'].map(h => (
                    <th key={h} className="text-left px-3 py-2 font-semibold"
                      style={{ color: 'var(--text-muted)', position: 'sticky', top: 0, background: 'var(--bg-primary)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {holdings.map((h, i) => {
                  const pnl = ((h.currentPrice ?? h.price ?? 0) - (h.avgPrice ?? h.buyPrice ?? 0)) * (h.quantity ?? 0);
                  const pnlPct = (h.avgPrice ?? h.buyPrice ?? 0) > 0
                    ? (((h.currentPrice ?? h.price ?? 0) - (h.avgPrice ?? h.buyPrice ?? 0)) / (h.avgPrice ?? h.buyPrice ?? 0) * 100)
                    : 0;
                  const isUp = pnl >= 0;

                  return (
                    <tr key={h.symbol || i} style={{ borderBottom: '1px solid rgba(30,42,90,0.3)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td className="px-3 py-2 font-semibold" style={{ color: 'var(--text-primary)' }}>{h.symbol}</td>
                      <td className="px-3 py-2 font-mono" style={{ color: 'var(--text-primary)' }}>{h.quantity}</td>
                      <td className="px-3 py-2 font-mono" style={{ color: 'var(--text-secondary)' }}>
                        ₹{formatIndian(h.avgPrice ?? h.buyPrice)}
                      </td>
                      <td className="px-3 py-2 font-mono" style={{ color: 'var(--text-primary)' }}>
                        ₹{formatIndian(h.currentPrice ?? h.price)}
                      </td>
                      <td className="px-3 py-2 font-mono font-semibold" style={{
                        color: isUp ? 'var(--accent-green)' : 'var(--accent-red)',
                      }}>
                        {isUp ? '+' : ''}₹{formatIndian(pnl)}
                      </td>
                      <td className="px-3 py-2 font-mono" style={{
                        color: isUp ? 'var(--accent-green)' : 'var(--accent-red)',
                      }}>
                        {isUp ? '+' : ''}{pnlPct.toFixed(2)}%
                      </td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => handleSell(h.symbol)}
                          className="px-2 py-1 text-xs rounded font-semibold transition-all"
                          style={{
                            background: 'rgba(255,82,82,0.1)',
                            color: 'var(--accent-red)',
                            border: '1px solid rgba(255,82,82,0.3)',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,82,82,0.2)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,82,82,0.1)'}
                        >
                          SELL
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {holdings.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                      No holdings yet. Start trading!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  {['Date', 'Type', 'Symbol', 'Qty', 'Price', 'Total'].map(h => (
                    <th key={h} className="text-left px-3 py-2 font-semibold"
                      style={{ color: 'var(--text-muted)', position: 'sticky', top: 0, background: 'var(--bg-primary)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.slice(0, 20).map((t, i) => {
                  const isBuy = t.type?.toUpperCase() === 'BUY';
                  return (
                    <tr key={t.id || i} style={{ borderBottom: '1px solid rgba(30,42,90,0.3)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td className="px-3 py-2" style={{ color: 'var(--text-muted)' }}>
                        {t.date ? new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-bold px-1.5 py-0.5 rounded text-xs"
                          style={{
                            color: isBuy ? 'var(--accent-green)' : 'var(--accent-red)',
                            background: isBuy ? 'rgba(0,230,118,0.1)' : 'rgba(255,82,82,0.1)',
                          }}>
                          {t.type?.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-semibold" style={{ color: 'var(--text-primary)' }}>{t.symbol}</td>
                      <td className="px-3 py-2 font-mono" style={{ color: 'var(--text-primary)' }}>{t.quantity}</td>
                      <td className="px-3 py-2 font-mono" style={{ color: 'var(--text-secondary)' }}>
                        ₹{formatIndian(t.price)}
                      </td>
                      <td className="px-3 py-2 font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>
                        ₹{formatIndian((t.price ?? 0) * (t.quantity ?? 0))}
                      </td>
                    </tr>
                  );
                })}
                {history.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                      No trade history yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
