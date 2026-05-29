import React from 'react';
import { Newspaper, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function NewsFeed({ news, onSelectStock }) {
  return (
    <div className="glass-panel rounded-2xl p-5 flex flex-col h-[350px]">
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-3">
        <Newspaper className="h-4 w-4 text-blue-400" />
        <h3 className="text-sm font-bold text-white">Live Company Updates & Sentiment</h3>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {news.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-xs">
            Waiting for live news updates... (updates automatically every 18s)
          </div>
        ) : (
          news.map((item) => {
            const isBullish = item.sentiment === 'bullish';
            
            return (
              <div 
                key={item.id} 
                className={`p-3 rounded-xl border text-xs space-y-2 transition-all ${
                  isBullish 
                    ? 'bg-emerald-500/5 border-emerald-500/10 hover:border-emerald-500/20' 
                    : 'bg-rose-500/5 border-rose-500/10 hover:border-rose-500/20'
                }`}
              >
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => onSelectStock(item.symbol)}
                    className="px-1.5 py-0.5 rounded-[4px] font-bold text-[9px] bg-slate-800 text-slate-300 hover:text-white border border-slate-700/50 hover:bg-slate-700 transition-colors"
                  >
                    {item.symbol}
                  </button>
                  
                  <span className={`flex items-center gap-0.5 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-[4px] border ${
                    isBullish 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  }`}>
                    {isBullish ? <ArrowUpRight className="h-2.5 w-2.5" /> : <ArrowDownRight className="h-2.5 w-2.5" />}
                    <span>{item.sentiment}</span>
                  </span>
                </div>

                <p className="text-slate-200 font-medium leading-relaxed">{item.text}</p>
                
                <div className="text-[9px] text-slate-500 font-semibold text-right">
                  {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
