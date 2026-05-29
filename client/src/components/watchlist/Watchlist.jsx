import React, { useState, useMemo } from 'react';

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

const SORT_OPTIONS = [
  { key: 'symbol', label: 'Name' },
  { key: 'price', label: 'Price' },
  { key: 'changePercent', label: 'Change' },
];

export default function Watchlist({ stocks, selectedStock, onSelectStock }) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('symbol');
  const [sortAsc, setSortAsc] = useState(true);

  const handleSort = (key) => {
    if (sortBy === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(key);
      setSortAsc(key === 'symbol');
    }
  };

  const filtered = useMemo(() => {
    let list = stocks.filter(s =>
      !search ||
      s.symbol?.toLowerCase().includes(search.toLowerCase()) ||
      s.name?.toLowerCase().includes(search.toLowerCase())
    );

    list.sort((a, b) => {
      let aVal = a[sortBy] ?? '';
      let bVal = b[sortBy] ?? '';
      if (typeof aVal === 'string') {
        return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortAsc ? aVal - bVal : bVal - aVal;
    });

    return list;
  }, [stocks, search, sortBy, sortAsc]);

  return (
    <div className="glass-card h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2.5" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          📋 Watchlist
          <span className="ml-2 text-xs font-normal" style={{ color: 'var(--text-muted)' }}>
            {stocks.length} stocks
          </span>
        </h3>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Filter stocks..."
          className="input-dark w-full text-xs"
          style={{ padding: '5px 10px' }}
        />
      </div>

      {/* Sort Buttons */}
      <div className="flex px-3 py-1.5 gap-1" style={{ borderBottom: '1px solid var(--border-color)' }}>
        {SORT_OPTIONS.map(opt => (
          <button
            key={opt.key}
            onClick={() => handleSort(opt.key)}
            className="text-xs px-2 py-0.5 rounded transition-colors"
            style={{
              color: sortBy === opt.key ? 'var(--accent-blue)' : 'var(--text-muted)',
              background: sortBy === opt.key ? 'rgba(68,138,255,0.1)' : 'transparent',
            }}
          >
            {opt.label} {sortBy === opt.key ? (sortAsc ? '↑' : '↓') : ''}
          </button>
        ))}
      </div>

      {/* Stock List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.map(stock => {
          const isSelected = selectedStock?.symbol === stock.symbol;
          const change = stock.changePercent ?? stock.change ?? 0;
          const isUp = change >= 0;

          return (
            <button
              key={stock.symbol}
              onClick={() => onSelectStock(stock)}
              className="w-full flex items-center justify-between px-3 py-2 transition-all duration-150"
              style={{
                background: isSelected ? 'rgba(68,138,255,0.08)' : 'transparent',
                borderLeft: isSelected ? '3px solid var(--accent-blue)' : '3px solid transparent',
                borderBottom: '1px solid rgba(30,42,90,0.3)',
              }}
              onMouseEnter={e => {
                if (!isSelected) e.currentTarget.style.background = 'var(--bg-hover)';
              }}
              onMouseLeave={e => {
                if (!isSelected) e.currentTarget.style.background = 'transparent';
              }}
            >
              <div className="text-left min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className="text-xs font-bold"
                    style={{ color: isSelected ? 'var(--accent-blue)' : 'var(--text-primary)' }}
                  >
                    {stock.symbol}
                  </span>
                  <span
                    className="text-xs"
                    style={{ color: isUp ? 'var(--accent-green)' : 'var(--accent-red)' }}
                  >
                    {isUp ? '▲' : '▼'}
                  </span>
                </div>
                <p className="text-xs truncate" style={{ color: 'var(--text-muted)', maxWidth: '100px' }}>
                  {stock.name || stock.symbol}
                </p>
              </div>

              <div className="text-right flex-shrink-0">
                <p className="text-xs font-semibold font-mono" style={{ color: 'var(--text-primary)' }}>
                  ₹{formatIndian(stock.price)}
                </p>
                <span
                  className="text-xs font-mono inline-block px-1.5 py-0.5 rounded"
                  style={{
                    color: isUp ? 'var(--accent-green)' : 'var(--accent-red)',
                    background: isUp ? 'rgba(0,230,118,0.1)' : 'rgba(255,82,82,0.1)',
                    fontSize: '10px',
                  }}
                >
                  {isUp ? '+' : ''}{Number(change).toFixed(2)}%
                </span>
              </div>
            </button>
          );
        })}

        {filtered.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No stocks found</p>
          </div>
        )}
      </div>
    </div>
  );
}
