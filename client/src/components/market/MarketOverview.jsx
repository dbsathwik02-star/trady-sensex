import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../../services/api';

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

export default function MarketOverview({ sensex, stocks }) {
  const [gainers, setGainers] = useState([]);
  const [losers, setLosers] = useState([]);
  const [sectors, setSectors] = useState([]);

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const [g, l, s] = await Promise.all([
          api.getGainers(),
          api.getLosers(),
          api.getSectors(),
        ]);
        if (Array.isArray(g)) setGainers(g.slice(0, 5));
        if (Array.isArray(l)) setLosers(l.slice(0, 5));
        if (Array.isArray(s)) setSectors(s);
      } catch (err) {
        console.error('Failed to fetch market data:', err);
      }
    };
    fetchMarketData();
  }, []);

  // If we don't have API data, derive from stocks
  const derivedGainers = useMemo(() => {
    if (gainers.length > 0) return gainers;
    return [...stocks]
      .sort((a, b) => (b.changePercent ?? 0) - (a.changePercent ?? 0))
      .slice(0, 5);
  }, [stocks, gainers]);

  const derivedLosers = useMemo(() => {
    if (losers.length > 0) return losers;
    return [...stocks]
      .sort((a, b) => (a.changePercent ?? 0) - (b.changePercent ?? 0))
      .slice(0, 5);
  }, [stocks, losers]);

  // Market breadth
  const advances = stocks.filter(s => (s.changePercent ?? s.change ?? 0) >= 0).length;
  const declines = stocks.length - advances;
  const breadthPct = stocks.length > 0 ? (advances / stocks.length * 100) : 50;

  const sensexChange = sensex?.change ?? 0;
  const sensexPct = sensex?.changePercent ?? 0;
  const isUp = sensexChange >= 0;

  return (
    <div className="flex h-full gap-3 p-3">
      {/* SENSEX Index Card */}
      <div className="flex flex-col gap-2 w-56 flex-shrink-0">
        <div
          className="rounded-xl p-4 flex flex-col items-center justify-center"
          style={{
            background: isUp ? 'rgba(0,230,118,0.05)' : 'rgba(255,82,82,0.05)',
            border: `1px solid ${isUp ? 'rgba(0,230,118,0.2)' : 'rgba(255,82,82,0.2)'}`,
          }}
        >
          <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>BSE SENSEX</p>
          <p className="text-3xl font-bold font-mono" style={{ color: 'var(--text-primary)' }}>
            {sensex?.value ? formatIndian(sensex.value) : '72,568.45'}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm font-mono font-semibold" style={{
              color: isUp ? 'var(--accent-green)' : 'var(--accent-red)',
            }}>
              {isUp ? '▲' : '▼'} {Math.abs(sensexChange).toFixed(2)}
            </span>
            <span className="text-sm font-mono px-1.5 py-0.5 rounded" style={{
              color: isUp ? 'var(--accent-green)' : 'var(--accent-red)',
              background: isUp ? 'rgba(0,230,118,0.1)' : 'rgba(255,82,82,0.1)',
            }}>
              {isUp ? '+' : ''}{sensexPct.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Market Breadth */}
        <div className="rounded-xl p-3" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
            Market Breadth
          </p>
          <div className="flex justify-between text-xs mb-1">
            <span style={{ color: 'var(--accent-green)' }}>Advances: {advances}</span>
            <span style={{ color: 'var(--accent-red)' }}>Declines: {declines}</span>
          </div>
          <div className="w-full h-3 rounded-full overflow-hidden flex" style={{ background: 'var(--bg-hover)' }}>
            <div
              className="h-full transition-all duration-500"
              style={{ width: `${breadthPct}%`, background: 'var(--accent-green)' }}
            />
            <div
              className="h-full transition-all duration-500"
              style={{ width: `${100 - breadthPct}%`, background: 'var(--accent-red)' }}
            />
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span style={{ color: 'var(--text-muted)' }}>{breadthPct.toFixed(0)}%</span>
            <span style={{ color: 'var(--text-muted)' }}>{(100 - breadthPct).toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {/* Gainers */}
      <div className="flex-1 rounded-xl overflow-hidden flex flex-col"
        style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
        <div className="px-3 py-2 flex items-center gap-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <span className="text-sm">🟢</span>
          <h4 className="text-xs font-bold" style={{ color: 'var(--accent-green)' }}>Top 5 Gainers</h4>
        </div>
        <div className="flex-1 overflow-y-auto">
          {derivedGainers.map((s, i) => (
            <div key={s.symbol || i}
              className="flex items-center justify-between px-3 py-2 transition-colors"
              style={{ borderBottom: '1px solid rgba(30,42,90,0.3)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold w-4" style={{ color: 'var(--text-muted)' }}>#{i + 1}</span>
                <div>
                  <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{s.symbol}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{s.name || ''}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-mono" style={{ color: 'var(--text-primary)' }}>₹{formatIndian(s.price)}</p>
                <p className="text-xs font-mono font-semibold" style={{ color: 'var(--accent-green)' }}>
                  +{(s.changePercent ?? 0).toFixed(2)}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Losers */}
      <div className="flex-1 rounded-xl overflow-hidden flex flex-col"
        style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
        <div className="px-3 py-2 flex items-center gap-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <span className="text-sm">🔴</span>
          <h4 className="text-xs font-bold" style={{ color: 'var(--accent-red)' }}>Top 5 Losers</h4>
        </div>
        <div className="flex-1 overflow-y-auto">
          {derivedLosers.map((s, i) => (
            <div key={s.symbol || i}
              className="flex items-center justify-between px-3 py-2 transition-colors"
              style={{ borderBottom: '1px solid rgba(30,42,90,0.3)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold w-4" style={{ color: 'var(--text-muted)' }}>#{i + 1}</span>
                <div>
                  <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{s.symbol}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{s.name || ''}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-mono" style={{ color: 'var(--text-primary)' }}>₹{formatIndian(s.price)}</p>
                <p className="text-xs font-mono font-semibold" style={{ color: 'var(--accent-red)' }}>
                  {(s.changePercent ?? 0).toFixed(2)}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sector Performance */}
      <div className="w-56 rounded-xl overflow-hidden flex flex-col flex-shrink-0"
        style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
        <div className="px-3 py-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <h4 className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>📊 Sectors</h4>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
          {sectors.length > 0 ? (
            [...sectors]
              .sort((a, b) => Math.abs(b.change ?? 0) - Math.abs(a.change ?? 0))
              .map((sector, i) => {
                const sUp = (sector.change ?? 0) >= 0;
                const barWidth = Math.min(100, Math.abs(sector.change ?? 0) * 10);
                return (
                  <div key={sector.name || i}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span style={{ color: 'var(--text-secondary)' }}>{sector.name}</span>
                      <span className="font-mono" style={{
                        color: sUp ? 'var(--accent-green)' : 'var(--accent-red)',
                      }}>
                        {sUp ? '+' : ''}{(sector.change ?? 0).toFixed(2)}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-hover)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${barWidth}%`,
                          background: sUp ? 'var(--accent-green)' : 'var(--accent-red)',
                        }}
                      />
                    </div>
                  </div>
                );
              })
          ) : (
            <div className="flex flex-col gap-2">
              {['IT', 'Banking', 'Pharma', 'Auto', 'FMCG', 'Energy', 'Metal', 'Realty'].map(name => {
                const change = (Math.random() - 0.4) * 5;
                const sUp = change >= 0;
                return (
                  <div key={name}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span style={{ color: 'var(--text-secondary)' }}>{name}</span>
                      <span className="font-mono" style={{
                        color: sUp ? 'var(--accent-green)' : 'var(--accent-red)',
                      }}>
                        {sUp ? '+' : ''}{change.toFixed(2)}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-hover)' }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, Math.abs(change) * 15)}%`,
                          background: sUp ? 'var(--accent-green)' : 'var(--accent-red)',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
