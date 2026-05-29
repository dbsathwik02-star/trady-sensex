import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

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

export default function Header({ sensex, stocks, onSelectStock }) {
  const { user, logout } = useAuth();
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showUser, setShowUser] = useState(false);

  const filteredStocks = search.length > 0
    ? stocks.filter(s =>
        s.symbol?.toLowerCase().includes(search.toLowerCase()) ||
        s.name?.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 8)
    : [];

  const sensexChange = sensex?.change ?? 0;
  const sensexPct = sensex?.changePercent ?? 0;
  const isUp = sensexChange >= 0;

  return (
    <header
      className="flex items-center justify-between px-4 py-2 relative z-50"
      style={{
        background: 'linear-gradient(180deg, var(--bg-secondary), var(--bg-primary))',
        borderBottom: '1px solid var(--border-color)',
      }}
    >
      {/* Left: Logo */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg"
          style={{ background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))' }}>
          📈
        </div>
        <h1 className="text-lg font-bold gradient-text hidden sm:block">SENSEX Trader Pro</h1>
      </div>

      {/* Center: SENSEX Value */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>SENSEX</span>
          <span className="text-lg font-bold" style={{ fontFamily: 'JetBrains Mono', color: 'var(--text-primary)' }}>
            {sensex?.value ? formatIndian(sensex.value) : '—'}
          </span>
          <span
            className="flex items-center gap-1 text-sm font-semibold px-2 py-0.5 rounded"
            style={{
              fontFamily: 'JetBrains Mono',
              color: isUp ? 'var(--accent-green)' : 'var(--accent-red)',
              background: isUp ? 'rgba(0,230,118,0.1)' : 'rgba(255,82,82,0.1)',
            }}
          >
            {isUp ? '▲' : '▼'} {Math.abs(sensexChange).toFixed(2)} ({Math.abs(sensexPct).toFixed(2)}%)
          </span>
        </div>
      </div>

      {/* Right: Search, User */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setShowSearch(true); }}
              onFocus={() => setShowSearch(true)}
              onBlur={() => setTimeout(() => setShowSearch(false), 200)}
              placeholder="Search stocks..."
              className="input-dark text-sm w-48"
              style={{ padding: '6px 12px', fontSize: '13px' }}
            />
          </div>
          {showSearch && filteredStocks.length > 0 && (
            <div
              className="absolute top-full left-0 w-72 mt-1 rounded-xl overflow-hidden shadow-2xl z-50"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
            >
              {filteredStocks.map(s => (
                <button
                  key={s.symbol}
                  onMouseDown={() => { onSelectStock(s); setSearch(''); setShowSearch(false); }}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors"
                  style={{ borderBottom: '1px solid var(--border-color)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div className="text-left">
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{s.symbol}</span>
                    <span className="ml-2 text-xs" style={{ color: 'var(--text-muted)' }}>{s.name}</span>
                  </div>
                  <span
                    className="font-mono text-sm"
                    style={{ color: (s.change ?? 0) >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}
                  >
                    ₹{formatIndian(s.price)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notification bell */}
        <button
          className="relative p-2 rounded-lg transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          🔔
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ background: 'var(--accent-red)' }} />
        </button>

        {/* User dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUser(!showUser)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors"
            style={{ border: '1px solid var(--border-color)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))', color: 'white' }}>
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <span className="text-sm font-medium hidden md:block" style={{ color: 'var(--text-primary)' }}>
              {user?.username || 'User'}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>▼</span>
          </button>

          {showUser && (
            <div
              className="absolute top-full right-0 mt-1 w-48 rounded-xl overflow-hidden shadow-2xl z-50"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
            >
              <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {user?.username || 'User'}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{user?.email || ''}</p>
              </div>
              <button
                onClick={logout}
                className="w-full text-left px-4 py-2.5 text-sm transition-colors"
                style={{ color: 'var(--accent-red)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                🚪 Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
