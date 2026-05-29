import React from 'react';

export default function TickerStrip({ stocks, onSelectStock }) {
  if (!stocks || stocks.length === 0) return null;

  // Duplicate stocks for seamless infinite scroll
  const items = [...stocks, ...stocks];

  return (
    <div
      className="ticker-strip py-1.5"
      style={{
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
      }}
    >
      <div className="ticker-strip-inner">
        {items.map((stock, i) => {
          const change = stock.changePercent ?? stock.change ?? 0;
          const isUp = change >= 0;
          return (
            <button
              key={`${stock.symbol}-${i}`}
              onClick={() => onSelectStock(stock)}
              className="inline-flex items-center gap-2 px-4 py-0.5 transition-opacity hover:opacity-80 cursor-pointer flex-shrink-0"
              style={{ borderRight: '1px solid var(--border-color)' }}
            >
              <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                {stock.symbol}
              </span>
              <span
                className="text-xs font-mono font-medium"
                style={{ color: isUp ? 'var(--accent-green)' : 'var(--accent-red)' }}
              >
                ₹{Number(stock.price ?? 0).toFixed(2)}
              </span>
              <span
                className="text-xs font-mono"
                style={{ color: isUp ? 'var(--accent-green)' : 'var(--accent-red)' }}
              >
                {isUp ? '▲' : '▼'}{Math.abs(change).toFixed(2)}%
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
