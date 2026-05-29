import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, ColorType, CandlestickSeries, LineSeries, HistogramSeries } from 'lightweight-charts';
import { api } from '../../services/api';
import { socket } from '../../services/socket';

const TIMEFRAMES = ['1m', '5m', '15m', '1H', '1D'];

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

export default function TradingChart({ stock }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const sma20Ref = useRef(null);
  const sma50Ref = useRef(null);
  const sma200Ref = useRef(null);
  const [timeframe, setTimeframe] = useState('1D');
  const [loading, setLoading] = useState(false);
  const prevSymbolRef = useRef(null);

  // Initialize chart
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0f1332' },
        textColor: '#8892b0',
        fontFamily: 'Inter',
      },
      grid: {
        vertLines: { color: '#1a2044' },
        horzLines: { color: '#1a2044' },
      },
      rightPriceScale: {
        borderColor: '#1e2a5a',
        scaleMargins: { top: 0.1, bottom: 0.25 },
      },
      timeScale: {
        borderColor: '#1e2a5a',
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: 0,
        vertLine: { color: 'rgba(68, 138, 255, 0.3)', width: 1, style: 2 },
        horzLine: { color: 'rgba(68, 138, 255, 0.3)', width: 1, style: 2 },
      },
      autoSize: true,
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#00e676',
      downColor: '#ff5252',
      borderUpColor: '#00e676',
      borderDownColor: '#ff5252',
      wickUpColor: '#00e676',
      wickDownColor: '#ff5252',
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });

    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    const sma20 = chart.addSeries(LineSeries, {
      color: '#ffd740',
      lineWidth: 1,
      title: 'SMA 20',
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });

    const sma50 = chart.addSeries(LineSeries, {
      color: '#448aff',
      lineWidth: 1,
      title: 'SMA 50',
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });

    const sma200 = chart.addSeries(LineSeries, {
      color: '#7c4dff',
      lineWidth: 1,
      title: 'SMA 200',
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;
    sma20Ref.current = sma20;
    sma50Ref.current = sma50;
    sma200Ref.current = sma200;

    return () => {
      chart.remove();
      chartRef.current = null;
    };
  }, []);

  // Calculate SMA
  const calculateSMA = useCallback((data, period) => {
    const result = [];
    for (let i = period - 1; i < data.length; i++) {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += data[i - j].close;
      }
      result.push({ time: data[i].time, value: sum / period });
    }
    return result;
  }, []);

  // Fetch and set data when stock or timeframe changes
  useEffect(() => {
    if (!stock?.symbol || !candleSeriesRef.current) return;

    const fetchHistory = async () => {
      setLoading(true);
      try {
        const data = await api.getHistory(stock.symbol, timeframe);
        if (Array.isArray(data) && data.length > 0) {
          // Sort by time
          const sorted = data.sort((a, b) => a.time - b.time);

          candleSeriesRef.current.setData(sorted);

          // Volume data
          const volData = sorted.map(d => ({
            time: d.time,
            value: d.volume ?? 0,
            color: d.close >= d.open ? 'rgba(0, 230, 118, 0.3)' : 'rgba(255, 82, 82, 0.3)',
          }));
          volumeSeriesRef.current.setData(volData);

          // SMA overlays
          if (sorted.length >= 20) sma20Ref.current.setData(calculateSMA(sorted, 20));
          if (sorted.length >= 50) sma50Ref.current.setData(calculateSMA(sorted, 50));
          if (sorted.length >= 200) sma200Ref.current.setData(calculateSMA(sorted, 200));

          // Fit content
          chartRef.current?.timeScale().fitContent();
        }
      } catch (err) {
        console.error('Failed to fetch history:', err);
      }
      setLoading(false);
    };

    fetchHistory();
    prevSymbolRef.current = stock.symbol;
  }, [stock?.symbol, timeframe, calculateSMA]);

  // Real-time candle updates via socket
  useEffect(() => {
    if (!stock?.symbol) return;

    const handler = (data) => {
      if (data.symbol !== stock.symbol) return;
      if (candleSeriesRef.current && data.candle) {
        candleSeriesRef.current.update(data.candle);
      }
      if (volumeSeriesRef.current && data.candle) {
        volumeSeriesRef.current.update({
          time: data.candle.time,
          value: data.candle.volume ?? 0,
          color: data.candle.close >= data.candle.open
            ? 'rgba(0, 230, 118, 0.3)' : 'rgba(255, 82, 82, 0.3)',
        });
      }
    };

    socket.on('candleUpdate', handler);
    return () => socket.off('candleUpdate', handler);
  }, [stock?.symbol]);

  const change = stock?.change ?? 0;
  const changePct = stock?.changePercent ?? 0;
  const isUp = change >= 0;

  return (
    <div className="glass-card h-full flex flex-col overflow-hidden">
      {/* Chart Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              {stock?.symbol || 'Select a stock'}
            </h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {stock?.name || ''}
            </p>
          </div>
          {stock && (
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold" style={{ fontFamily: 'JetBrains Mono', color: 'var(--text-primary)' }}>
                ₹{formatIndian(stock.price)}
              </span>
              <span
                className="text-sm font-semibold px-2 py-0.5 rounded font-mono"
                style={{
                  color: isUp ? 'var(--accent-green)' : 'var(--accent-red)',
                  background: isUp ? 'rgba(0,230,118,0.1)' : 'rgba(255,82,82,0.1)',
                }}
              >
                {isUp ? '+' : ''}{change.toFixed(2)} ({isUp ? '+' : ''}{changePct.toFixed(2)}%)
              </span>
            </div>
          )}
        </div>

        {/* Timeframe Buttons */}
        <div className="flex items-center gap-1">
          {TIMEFRAMES.map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200"
              style={{
                background: timeframe === tf
                  ? 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))'
                  : 'var(--bg-primary)',
                color: timeframe === tf ? 'white' : 'var(--text-muted)',
                border: `1px solid ${timeframe === tf ? 'transparent' : 'var(--border-color)'}`,
              }}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* SMA Legend */}
        <div className="hidden lg:flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 inline-block rounded" style={{ background: '#ffd740' }} /> SMA 20
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 inline-block rounded" style={{ background: '#448aff' }} /> SMA 50
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 inline-block rounded" style={{ background: '#7c4dff' }} /> SMA 200
          </span>
        </div>
      </div>

      {/* Chart Container */}
      <div className="flex-1 relative" style={{ minHeight: 0 }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10"
            style={{ background: 'rgba(10, 14, 39, 0.8)' }}>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading chart data...</span>
            </div>
          </div>
        )}
        <div ref={containerRef} className="w-full h-full" />
      </div>
    </div>
  );
}
