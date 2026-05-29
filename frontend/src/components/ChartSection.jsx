import React, { useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine, LineChart, Line, Legend } from 'recharts';
import { Info, TrendingUp, TrendingDown, Layers } from 'lucide-react';

export default function ChartSection({ stock, history }) {
  const [activeTab, setActiveTab] = useState('price'); // 'price', 'rsi', 'macd'
  const [showSMA, setShowSMA] = useState(true);

  if (!stock || !history || history.length === 0) {
    return (
      <div className="glass-panel rounded-2xl h-[400px] flex items-center justify-center text-slate-400">
        <div className="text-center">
          <Layers className="mx-auto h-12 w-12 text-slate-500 animate-pulse mb-3" />
          <p className="text-sm">Select a stock to load live interactive chart</p>
        </div>
      </div>
    );
  }

  // Map history numbers into objects for Recharts
  const data = history.map((price, idx) => {
    // Generate simple SMA values for the chart if not already calculated
    let sma20Val = null;
    let sma50Val = null;

    if (idx >= 20) {
      const slice = history.slice(idx - 20, idx);
      sma20Val = slice.reduce((a, b) => a + b, 0) / 20;
    }
    if (idx >= 50) {
      const slice = history.slice(idx - 50, idx);
      sma50Val = slice.reduce((a, b) => a + b, 0) / 50;
    }

    return {
      index: idx,
      price: Number(price.toFixed(2)),
      sma20: sma20Val ? Number(sma20Val.toFixed(2)) : null,
      sma50: sma50Val ? Number(sma50Val.toFixed(2)) : null,
      time: new Date(Date.now() - (history.length - idx) * 1500).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
  });

  const isUp = stock.changePercent >= 0;
  const signal = stock.indicators?.signal || 'NEUTRAL';
  const signalReasons = stock.indicators?.reasons || [];
  const rsiValue = stock.indicators?.rsi || 50;
  const macdData = stock.indicators?.macd || { macd: 0, signal: 0, histogram: 0 };

  const getSignalColor = (sig) => {
    if (sig === 'BUY') return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (sig === 'SELL') return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
    return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  };

  const getSignalBadgeText = (sig) => {
    if (sig === 'BUY') return 'STRONG BUY';
    if (sig === 'SELL') return 'STRONG SELL';
    return 'NEUTRAL / HOLD';
  };

  // Custom tooltips
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/90 border border-slate-700/50 p-3 rounded-lg shadow-xl text-xs backdrop-blur-md">
          <p className="text-slate-400 font-semibold mb-1">{payload[0].payload.time}</p>
          <p className="text-slate-100 font-bold">Price: <span className="text-blue-400">₹{payload[0].value}</span></p>
          {showSMA && payload[1] && <p className="text-emerald-400">SMA 20: ₹{payload[1].value}</p>}
          {showSMA && payload[2] && <p className="text-orange-400">SMA 50: ₹{payload[2].value}</p>}
        </div>
      );
    };
    return null;
  };

  return (
    <div className="glass-panel rounded-2xl p-5 flex flex-col justify-between h-[450px]">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-white">{stock.symbol}</h2>
            <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded">{stock.name}</span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold text-slate-50">₹{stock.price.toFixed(2)}</span>
            <span className={`text-sm font-semibold flex items-center ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isUp ? <TrendingUp className="h-3 w-3 mr-0.5" /> : <TrendingDown className="h-3 w-3 mr-0.5" />}
              {isUp ? '+' : ''}{stock.changePercent.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Signal & Indicators info */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs text-slate-500 block">AI trading signal</span>
            <div className={`mt-1 text-xs font-bold px-2.5 py-1 rounded-full border ${getSignalColor(signal)}`}>
              {getSignalBadgeText(signal)}
            </div>
          </div>
          
          <div className="max-w-[180px] bg-slate-800/40 rounded-lg p-2 border border-slate-700/30 text-[10px] text-slate-400">
            <div className="flex items-center gap-1 font-semibold text-slate-300 mb-1">
              <Info className="h-3 w-3 text-blue-400" />
              <span>Signal Analysis</span>
            </div>
            <p className="line-clamp-2">{signalReasons.join(', ') || 'Indicators consolidated in range.'}</p>
          </div>
        </div>
      </div>

      {/* Chart Toggles */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex gap-1 bg-slate-900/60 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('price')}
            className={`text-xs px-3 py-1.5 rounded-md font-medium transition-all ${activeTab === 'price' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Price Chart
          </button>
          <button
            onClick={() => setActiveTab('rsi')}
            className={`text-xs px-3 py-1.5 rounded-md font-medium transition-all ${activeTab === 'rsi' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            RSI ({rsiValue.toFixed(1)})
          </button>
          <button
            onClick={() => setActiveTab('macd')}
            className={`text-xs px-3 py-1.5 rounded-md font-medium transition-all ${activeTab === 'macd' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            MACD Histogram
          </button>
        </div>

        {activeTab === 'price' && (
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showSMA}
              onChange={() => setShowSMA(!showSMA)}
              className="accent-blue-500 rounded h-3 w-3"
            />
            <span className="text-[10px] font-semibold text-slate-400">Show Moving Averages (20/50)</span>
          </label>
        )}
      </div>

      {/* Main Responsive Chart Container */}
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          {activeTab === 'price' ? (
            <AreaChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isUp ? '#10b981' : '#ef4444'} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={isUp ? '#10b981' : '#ef4444'} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" hide />
              <YAxis domain={['auto', 'auto']} tick={{ fill: '#64748b', fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="price"
                stroke={isUp ? '#10b981' : '#ef4444'}
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorPrice)"
                dot={false}
              />
              {showSMA && (
                <Line
                  type="monotone"
                  dataKey="sma20"
                  stroke="#34d399"
                  strokeWidth={1.2}
                  strokeDasharray="4 4"
                  dot={false}
                />
              )}
              {showSMA && (
                <Line
                  type="monotone"
                  dataKey="sma50"
                  stroke="#fb923c"
                  strokeWidth={1.2}
                  strokeDasharray="3 3"
                  dot={false}
                />
              )}
            </AreaChart>
          ) : activeTab === 'rsi' ? (
            <LineChart data={data.map((d, i) => ({ ...d, rsi: history.slice(0, i + 1).length >= 14 ? d.price : 50 }))} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
              {/* RSI Chart */}
              <XAxis dataKey="time" hide />
              <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
              <Tooltip />
              <ReferenceLine y={70} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: 'Overbought (70)', fill: '#f43f5e', fontSize: 8, position: 'insideTopLeft' }} />
              <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Oversold (30)', fill: '#10b981', fontSize: 8, position: 'insideBottomLeft' }} />
              <ReferenceLine y={50} stroke="#475569" strokeDasharray="5 5" />
              <Line
                type="monotone"
                data={data.map((d, idx) => ({ ...d, rsiValue: idx >= 14 ? rsiValue : 50 }))}
                dataKey="rsiValue"
                stroke="#a855f7"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          ) : (
            <AreaChart data={data.map((d) => ({ ...d, hist: macdData.histogram }))} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
              {/* MACD Chart */}
              <XAxis dataKey="time" hide />
              <YAxis domain={['auto', 'auto']} tick={{ fill: '#64748b', fontSize: 10 }} />
              <Tooltip />
              <ReferenceLine y={0} stroke="#475569" />
              <Area
                type="monotone"
                dataKey="hist"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.3}
                dot={false}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
