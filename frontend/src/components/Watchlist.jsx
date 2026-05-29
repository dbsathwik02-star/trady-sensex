import React, { useState } from 'react';
import { Star, Plus, X, Search, Activity } from 'lucide-react';

export default function Watchlist({ watchlist, stocks, onUpdateWatchlist, selectedSymbol, onSelectStock }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Filter stocks that are NOT in the watchlist currently
  const availableToAdd = Object.keys(stocks).filter(
    (symbol) => !watchlist.includes(symbol) && symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddToWatchlist = (symbol) => {
    const newWatchlist = [...watchlist, symbol];
    onUpdateWatchlist(newWatchlist);
    setIsDropdownOpen(false);
    setSearchTerm('');
  };

  const handleRemoveFromWatchlist = (e, symbol) => {
    e.stopPropagation(); // Avoid selecting stock
    const newWatchlist = watchlist.filter((s) => s !== symbol);
    onUpdateWatchlist(newWatchlist);
  };

  return (
    <div className="glass-panel rounded-2xl p-5 flex flex-col h-[350px]">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Star className="h-4 w-4 text-amber-400 fill-amber-400/20" />
          <span>My Watchlist</span>
        </h3>
        
        {/* Watchlist Search/Add Widget */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-1.5 text-[10px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded-md hover:bg-blue-500/25 transition-all"
          >
            <Plus className="h-3 w-3" />
            <span>Add Stock</span>
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 p-2 text-xs">
              <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-lg mb-2">
                <Search className="h-3.5 w-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search stock..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-transparent border-none outline-none text-slate-100 text-xs w-full"
                  autoFocus
                />
              </div>
              
              <div className="max-h-36 overflow-y-auto space-y-1">
                {availableToAdd.length === 0 ? (
                  <p className="text-center text-slate-500 py-2">No stocks found</p>
                ) : (
                  availableToAdd.map((symbol) => (
                    <button
                      key={symbol}
                      onClick={() => handleAddToWatchlist(symbol)}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white font-semibold transition-colors"
                    >
                      {symbol}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Watchlist Tickers */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {watchlist.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            No stocks watchlisted yet. Click "Add Stock" to add symbols.
          </div>
        ) : (
          watchlist.map((symbol) => {
            const stock = stocks[symbol];
            if (!stock) return null;
            
            const isSelected = selectedSymbol === symbol;
            const isUp = stock.changePercent >= 0;

            return (
              <div
                key={symbol}
                onClick={() => onSelectStock(symbol)}
                className={`flex justify-between items-center p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected 
                    ? 'bg-blue-500/10 border-blue-500/30' 
                    : 'bg-slate-900/40 border-slate-800/40 hover:bg-slate-800/20 hover:border-slate-800/80'
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-white text-xs">{stock.symbol}</span>
                    {symbol === 'SENSEX' && (
                      <span className="px-1 text-[8px] font-extrabold uppercase bg-red-500/20 text-red-400 border border-red-500/30 rounded">
                        Index
                      </span>
                    )}
                  </div>
                  <div className="text-[9px] text-slate-500 max-w-[100px] truncate">{stock.name}</div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="font-bold text-white text-xs">₹{stock.price.toFixed(2)}</div>
                    <div className={`text-[10px] font-semibold mt-0.5 ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isUp ? '+' : ''}{stock.changePercent.toFixed(2)}%
                    </div>
                  </div>
                  
                  {symbol !== 'SENSEX' && (
                    <button
                      onClick={(e) => handleRemoveFromWatchlist(e, symbol)}
                      className="text-slate-500 hover:text-slate-200 p-1 transition-colors"
                      title="Remove from watchlist"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
