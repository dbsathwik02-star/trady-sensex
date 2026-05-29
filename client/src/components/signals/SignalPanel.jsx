import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';

export default function SignalPanel({ stock, signals }) {
  const [stockSignal, setStockSignal] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!stock?.symbol) return;

    // First check if we have it in the signals array
    const existing = signals?.find(s => s.symbol === stock.symbol);
    if (existing) {
      setStockSignal(existing);
      return;
    }

    // Otherwise fetch it
    const fetchSignal = async () => {
      setLoading(true);
      try {
        const data = await api.getSignal(stock.symbol);
        if (data && !data.error) setStockSignal(data);
      } catch (err) {
        console.error('Failed to fetch signal:', err);
      }
      setLoading(false);
    };
    fetchSignal();
  }, [stock?.symbol, signals]);

  const getSignalClass = (signal) => {
    if (!signal) return '';
    const s = signal.toUpperCase();
    if (s === 'BUY' || s === 'STRONG BUY') return 'signal-buy';
    if (s === 'SELL' || s === 'STRONG SELL') return 'signal-sell';
    return 'signal-hold';
  };

  const getSignalColor = (signal) => {
    if (!signal) return 'var(--text-muted)';
    const s = signal.toUpperCase();
    if (s === 'BUY' || s === 'STRONG BUY') return 'var(--accent-green)';
    if (s === 'SELL' || s === 'STRONG SELL') return 'var(--accent-red)';
    return 'var(--accent-yellow)';
  };

  const indicators = stockSignal?.indicators || {};
  const rsi = indicators.rsi || {};
  const macd = indicators.macd || {};
  const bollinger = indicators.bollinger || {};
  const ma = indicators.movingAverage || indicators.ma || {};

  const getRsiStatus = (val) => {
    if (val == null) return { text: 'N/A', color: 'var(--text-muted)' };
    if (val <= 30) return { text: 'Oversold', color: 'var(--accent-green)' };
    if (val >= 70) return { text: 'Overbought', color: 'var(--accent-red)' };
    return { text: 'Normal', color: 'var(--accent-yellow)' };
  };

  const rsiStatus = getRsiStatus(rsi.value);

  // Top signals (sorted by strength)
  const topSignals = [...(signals || [])]
    .sort((a, b) => (b.strength ?? 0) - (a.strength ?? 0))
    .slice(0, 10);

  return (
    <div className="flex h-full gap-2 p-3">
      {/* Selected Stock Signal Details */}
      <div className="flex-1 flex gap-2">
        {/* Main Signal Card */}
        <div className={`rounded-xl p-4 flex flex-col items-center justify-center min-w-[160px] ${getSignalClass(stockSignal?.signal)}`}>
          {loading ? (
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                {stock?.symbol || 'N/A'} Signal
              </p>
              <p className="text-3xl font-bold mb-1" style={{ color: getSignalColor(stockSignal?.signal) }}>
                {stockSignal?.signal?.toUpperCase() || '—'}
              </p>
              {/* Strength Meter */}
              <div className="w-full mt-2">
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: 'var(--text-muted)' }}>Strength</span>
                  <span style={{ color: getSignalColor(stockSignal?.signal) }}>
                    {stockSignal?.strength ?? 0}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${stockSignal?.strength ?? 0}%`,
                      background: getSignalColor(stockSignal?.signal),
                    }}
                  />
                </div>
              </div>
              {stockSignal?.reasoning && (
                <p className="text-xs mt-2 text-center" style={{ color: 'var(--text-muted)' }}>
                  {stockSignal.reasoning}
                </p>
              )}
            </>
          )}
        </div>

        {/* Indicator Cards */}
        <div className="grid grid-cols-2 gap-2 flex-1">
          {/* RSI */}
          <div className="rounded-lg p-3" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>RSI (14)</span>
              <span className="text-xs px-1.5 py-0.5 rounded" style={{
                color: rsiStatus.color,
                background: `${rsiStatus.color}15`,
              }}>
                {rsiStatus.text}
              </span>
            </div>
            <p className="text-xl font-bold font-mono" style={{ color: rsiStatus.color }}>
              {rsi.value != null ? Number(rsi.value).toFixed(1) : '—'}
            </p>
            <div className="w-full h-1 rounded mt-1" style={{ background: 'var(--bg-hover)' }}>
              <div className="h-full rounded" style={{
                width: `${Math.min(100, rsi.value ?? 0)}%`,
                background: `linear-gradient(90deg, var(--accent-green), var(--accent-yellow), var(--accent-red))`,
              }} />
            </div>
          </div>

          {/* MACD */}
          <div className="rounded-lg p-3" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>MACD</span>
              <span className="text-xs" style={{
                color: (macd.histogram ?? 0) >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'
              }}>
                {(macd.histogram ?? 0) >= 0 ? '↑ Bullish' : '↓ Bearish'}
              </span>
            </div>
            <p className="text-xl font-bold font-mono" style={{
              color: (macd.value ?? 0) >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'
            }}>
              {macd.value != null ? Number(macd.value).toFixed(2) : '—'}
            </p>
            <p className="text-xs mt-0.5 font-mono" style={{ color: 'var(--text-muted)' }}>
              Signal: {macd.signal != null ? Number(macd.signal).toFixed(2) : '—'}
            </p>
          </div>

          {/* Bollinger Bands */}
          <div className="rounded-lg p-3" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Bollinger</span>
            </div>
            <div className="space-y-0.5">
              <div className="flex justify-between text-xs">
                <span style={{ color: 'var(--text-muted)' }}>Upper</span>
                <span className="font-mono" style={{ color: 'var(--accent-red)' }}>
                  {bollinger.upper != null ? Number(bollinger.upper).toFixed(2) : '—'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: 'var(--text-muted)' }}>Middle</span>
                <span className="font-mono" style={{ color: 'var(--accent-yellow)' }}>
                  {bollinger.middle != null ? Number(bollinger.middle).toFixed(2) : '—'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: 'var(--text-muted)' }}>Lower</span>
                <span className="font-mono" style={{ color: 'var(--accent-green)' }}>
                  {bollinger.lower != null ? Number(bollinger.lower).toFixed(2) : '—'}
                </span>
              </div>
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Position: {bollinger.position || '—'}
            </p>
          </div>

          {/* Moving Averages */}
          <div className="rounded-lg p-3" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Moving Avg</span>
              <span className="text-xs" style={{
                color: ma.trend === 'up' || ma.trend === 'bullish' ? 'var(--accent-green)' : 'var(--accent-red)'
              }}>
                {ma.trend === 'up' || ma.trend === 'bullish' ? '↑ Bullish' : '↓ Bearish'}
              </span>
            </div>
            <div className="space-y-0.5">
              <div className="flex justify-between text-xs">
                <span style={{ color: 'var(--text-muted)' }}>SMA 20</span>
                <span className="font-mono" style={{ color: 'var(--accent-yellow)' }}>
                  {ma.sma20 != null ? Number(ma.sma20).toFixed(2) : '—'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: 'var(--text-muted)' }}>SMA 50</span>
                <span className="font-mono" style={{ color: 'var(--accent-blue)' }}>
                  {ma.sma50 != null ? Number(ma.sma50).toFixed(2) : '—'}
                </span>
              </div>
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Crossover: {ma.crossover || '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Top Signals List */}
      <div className="w-64 rounded-xl overflow-hidden flex flex-col"
        style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
        <div className="px-3 py-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <h4 className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>📡 Top Signals</h4>
        </div>
        <div className="flex-1 overflow-y-auto">
          {topSignals.map((sig, i) => (
            <div
              key={sig.symbol || i}
              className="flex items-center justify-between px-3 py-1.5"
              style={{ borderBottom: '1px solid rgba(30,42,90,0.3)' }}
            >
              <div>
                <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {sig.symbol}
                </span>
                <span className="text-xs ml-1" style={{ color: 'var(--text-muted)' }}>
                  {sig.strength ?? 0}%
                </span>
              </div>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded"
                style={{
                  color: getSignalColor(sig.signal),
                  background: `${getSignalColor(sig.signal)}15`,
                }}
              >
                {sig.signal?.toUpperCase() || '—'}
              </span>
            </div>
          ))}
          {topSignals.length === 0 && (
            <div className="flex items-center justify-center py-4">
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No signals available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
