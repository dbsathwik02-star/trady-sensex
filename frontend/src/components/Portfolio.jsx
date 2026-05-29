import React from 'react';
import { Briefcase, RotateCcw, TrendingUp, TrendingDown, History, ShoppingBag, Clock, X } from 'lucide-react';

export default function Portfolio({ portfolio, stocks, transactions, pendingOrders = [], onCancelOrder, onReset, onSelectStock }) {
  const holdings = portfolio?.holdings || [];
  const balance = portfolio?.balance || 1000000;

  // Calculate current value of holdings based on live stock prices
  const totalCost = holdings.reduce((sum, h) => sum + (h.quantity * h.avgPrice), 0);
  const currentValue = holdings.reduce((sum, h) => {
    const livePrice = stocks[h.symbol]?.price || h.avgPrice;
    return sum + (h.quantity * livePrice);
  }, 0);

  const totalPnL = currentValue - totalCost;
  const pnlPercent = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;
  const netWorth = balance + currentValue;
  const totalGainLoss = netWorth - 1000000; // Relative to starting 10 Lakhs
  const overallReturnPercent = (totalGainLoss / 1000000) * 100;

  return (
    <div className="space-y-6">
      {/* Portfolio Summary Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Net Worth */}
        <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Net Worth (Equity + Cash)</span>
            <Briefcase className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-2">
            <span className="text-xl font-black text-slate-50">₹{netWorth.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
            <span className={`text-xs font-semibold block mt-1 ${totalGainLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {totalGainLoss >= 0 ? '+' : ''}{totalGainLoss.toLocaleString('en-IN', { maximumFractionDigits: 2 })} ({overallReturnPercent.toFixed(2)}%)
            </span>
          </div>
        </div>

        {/* Free Cash Balance */}
        <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Virtual Cash Balance</span>
            <RotateCcw
              className="h-4 w-4 text-slate-400 hover:text-white cursor-pointer transition-colors" 
              onClick={() => {
                if (window.confirm('Reset virtual trading account to starting balance of ₹10,00,000 and clear order history?')) {
                  onReset();
                }
              }}
              title="Reset portfolio"
            />
          </div>
          <div className="mt-2">
            <span className="text-xl font-black text-slate-50">₹{balance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
            <span className="text-xs text-slate-500 block mt-1">Available to trade</span>
          </div>
        </div>

        {/* Active Holdings P&L */}
        <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Unrealized P&L</span>
            {totalPnL >= 0 ? (
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            ) : (
              <TrendingDown className="h-4 w-4 text-rose-400" />
            )}
          </div>
          <div className="mt-2">
            <span className={`text-xl font-black ${totalPnL >= 0 ? 'text-emerald-400 glow-green' : 'text-rose-400 glow-red'}`}>
              ₹{totalPnL.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </span>
            <span className={`text-xs font-semibold block mt-1 ${totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {totalPnL >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="glass-panel rounded-2xl p-5">
        <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2">
          <ShoppingBag className="h-4 w-4 text-emerald-400" />
          <span>Active Positions ({holdings.length})</span>
        </h3>
        
        {holdings.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            You do not own any stocks yet. Place a BUY order to start paper trading.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-slate-500 border-b border-slate-800 pb-2">
                  <th className="pb-2 font-semibold uppercase">Stock</th>
                  <th className="pb-2 font-semibold uppercase text-right">Qty</th>
                  <th className="pb-2 font-semibold uppercase text-right">Avg Price</th>
                  <th className="pb-2 font-semibold uppercase text-right">Live Price</th>
                  <th className="pb-2 font-semibold uppercase text-right">Current Value</th>
                  <th className="pb-2 font-semibold uppercase text-right">Gain / Loss</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {holdings.map((h) => {
                  const liveStock = stocks[h.symbol];
                  const livePrice = liveStock?.price || h.avgPrice;
                  const itemCost = h.quantity * h.avgPrice;
                  const itemValue = h.quantity * livePrice;
                  const itemPnL = itemValue - itemCost;
                  const itemReturn = (itemPnL / itemCost) * 100;
                  
                  return (
                    <tr key={h.symbol} className="hover:bg-slate-800/20 cursor-pointer" onClick={() => onSelectStock(h.symbol)}>
                      <td className="py-3 pr-2">
                        <div className="font-bold text-white">{h.symbol}</div>
                        <div className="text-[10px] text-slate-500 max-w-[120px] truncate">{h.name}</div>
                      </td>
                      <td className="py-3 text-right font-medium text-slate-200">{h.quantity}</td>
                      <td className="py-3 text-right text-slate-300">
                        <div>₹{h.avgPrice.toFixed(2)}</div>
                        {(h.takeProfitPercent > 0 || h.stopLossPercent > 0) && (
                          <div className="text-[9px] font-semibold mt-0.5">
                            {h.takeProfitPercent > 0 && <span className="text-emerald-400 mr-1.5">TP: +{h.takeProfitPercent}%</span>}
                            {h.stopLossPercent > 0 && <span className="text-rose-400">SL: -{h.stopLossPercent}%</span>}
                          </div>
                        )}
                      </td>
                      <td className="py-3 text-right font-bold text-white">₹{livePrice.toFixed(2)}</td>
                      <td className="py-3 text-right font-semibold text-slate-100">₹{itemValue.toFixed(2)}</td>
                      <td className={`py-3 text-right font-bold ${itemPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        <div>₹{itemPnL.toFixed(2)}</div>
                        <div className="text-[10px] font-normal">{itemPnL >= 0 ? '+' : ''}{itemReturn.toFixed(2)}%</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pending Limit Orders */}
      <div className="glass-panel rounded-2xl p-5">
        <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-400" />
          <span>Pending Limit Orders ({pendingOrders.length})</span>
        </h3>
        
        {pendingOrders.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-sm">
            No pending limit orders. Place a LIMIT order in the panel to schedule automatic triggers.
          </div>
        ) : (
          <div className="space-y-2">
            {pendingOrders.map((ord) => (
              <div key={ord._id || ord.id} className="flex justify-between items-center text-xs bg-slate-900/40 p-3 rounded-xl border border-slate-800/40">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className={`px-1.5 py-0.5 rounded-[4px] font-bold text-[9px] ${ord.type === 'BUY' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      LIMIT {ord.type}
                    </span>
                    <span className="font-bold text-white">{ord.symbol}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Target Trigger: <span className="text-slate-300 font-semibold">₹{ord.price.toFixed(2)}</span>
                    {ord.takeProfitPercent > 0 && <span className="text-emerald-400/80 ml-2">TP: +{ord.takeProfitPercent}%</span>}
                    {ord.stopLossPercent > 0 && <span className="text-rose-400/80 ml-2">SL: -{ord.stopLossPercent}%</span>}
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-bold text-slate-200">{ord.quantity} Shares</div>
                    <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Est. Value: ₹{(ord.quantity * ord.price).toFixed(2)}</div>
                  </div>
                  
                  <button
                    onClick={() => onCancelOrder(ord._id || ord.id)}
                    className="p-1.5 hover:bg-slate-800 text-slate-500 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                    title="Cancel Order"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transaction History Logs */}
      <div className="glass-panel rounded-2xl p-5">
        <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2">
          <History className="h-4 w-4 text-purple-400" />
          <span>Recent Activity</span>
        </h3>
        
        {transactions.length === 0 ? (
          <div className="text-center py-4 text-slate-500 text-sm">
            No transactions executed yet.
          </div>
        ) : (
          <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
            {transactions.map((tx, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/40">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className={`px-1.5 py-0.5 rounded-[4px] font-bold text-[9px] ${tx.type === 'BUY' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      {tx.type}
                    </span>
                    <span className="font-bold text-white">{tx.symbol}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {new Date(tx.timestamp).toLocaleString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-bold text-slate-200">{tx.quantity} Shares @ ₹{tx.price.toFixed(2)}</div>
                  <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Total: ₹{(tx.quantity * tx.price).toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
