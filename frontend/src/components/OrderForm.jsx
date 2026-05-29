import React, { useState, useEffect } from 'react';
import { ShoppingBag, ArrowUpRight, ArrowDownRight, DollarSign, Wallet } from 'lucide-react';

export default function OrderForm({ stock, portfolio, onExecuteTrade }) {
  const [tradeType, setTradeType] = useState('BUY'); // BUY or SELL
  const [orderType, setOrderType] = useState('MARKET'); // MARKET or LIMIT
  const [quantity, setQuantity] = useState(10);
  const [limitPrice, setLimitPrice] = useState(0);
  const [takeProfitPercent, setTakeProfitPercent] = useState(0); // 0 means disabled, e.g. 5%, 10%
  const [stopLossPercent, setStopLossPercent] = useState(0); // 0 means disabled
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Update limit price default when stock changes
  useEffect(() => {
    if (stock) {
      setLimitPrice(Number(stock.price.toFixed(2)));
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [stock]);

  if (!stock || stock.symbol === 'SENSEX') {
    return (
      <div className="glass-panel rounded-2xl p-5 text-center text-slate-400 text-sm">
        Select an individual stock (non-index) to execute paper trading orders.
      </div>
    );
  }

  const livePrice = stock.price;
  const executionPrice = orderType === 'LIMIT' ? Number(limitPrice) : Number(livePrice);
  const estTotal = quantity * executionPrice;
  const balance = portfolio?.balance || 1000000;
  
  // Find currently owned shares
  const holding = portfolio?.holdings?.find(h => h.symbol === stock.symbol);
  const ownedQty = holding ? holding.quantity : 0;

  // Calculate profit points (Target Profit Price)
  const targetProfitPrice = takeProfitPercent > 0 
    ? executionPrice * (1 + takeProfitPercent / 100) 
    : 0;
  const expectedProfit = takeProfitPercent > 0 
    ? (targetProfitPrice - executionPrice) * quantity 
    : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (quantity <= 0) {
      setErrorMsg('Quantity must be greater than zero.');
      return;
    }

    if (tradeType === 'BUY' && estTotal > balance) {
      setErrorMsg('Insufficient virtual cash balance for this order.');
      return;
    }

    if (tradeType === 'SELL' && quantity > ownedQty) {
      setErrorMsg(`Insufficient shares in holdings. You own ${ownedQty} shares.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await onExecuteTrade({
        symbol: stock.symbol,
        quantity,
        type: tradeType,
        price: executionPrice,
        orderType,
        takeProfitPercent,
        stopLossPercent
      });

      if (response.success) {
        const orderName = orderType === 'LIMIT' ? 'Limit order placed' : 'Market order executed';
        setSuccessMsg(`Successfully processed ${tradeType} order! ${orderName} for ${quantity} shares of ${stock.symbol}.`);
        setQuantity(10);
      } else {
        setErrorMsg(response.error || 'Failed to execute trade.');
      }
    } catch (err) {
      setErrorMsg('Server connection error. Failed to execute trade.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-5 flex flex-col justify-between min-h-[350px]">
      <form onSubmit={handleSubmit} className="space-y-4 flex-1 flex flex-col justify-between">
        
        {/* Trade Type Toggles (BUY/SELL) */}
        <div>
          <div className="flex bg-slate-900/60 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => { setTradeType('BUY'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all ${
                tradeType === 'BUY' 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
              <span>BUY</span>
            </button>
            
            <button
              type="button"
              onClick={() => { setTradeType('SELL'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all ${
                tradeType === 'SELL' 
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowDownRight className="h-3.5 w-3.5" />
              <span>SELL</span>
            </button>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="text-slate-400 font-semibold mb-1 block">Order Type</label>
            <select
              value={orderType}
              onChange={(e) => setOrderType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 font-medium outline-none focus:border-blue-500"
            >
              <option value="MARKET">MARKET PRICE</option>
              <option value="LIMIT">LIMIT PRICE</option>
            </select>
          </div>

          <div>
            <label className="text-slate-400 font-semibold mb-1 block">Shares (Quantity)</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 font-bold outline-none focus:border-blue-500 text-right"
            />
          </div>

          {orderType === 'LIMIT' && (
            <div className="col-span-2">
              <label className="text-slate-400 font-semibold mb-1 block">Limit Price (INR)</label>
              <input
                type="number"
                step="0.05"
                value={limitPrice}
                onChange={(e) => setLimitPrice(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 font-bold outline-none focus:border-blue-500 text-right"
              />
            </div>
          )}

          {/* Profit Points Option */}
          <div className="col-span-2">
            <label className="text-slate-400 font-semibold mb-1.5 flex justify-between">
              <span>Take Profit Target</span>
              <span className="text-emerald-400 font-bold">{takeProfitPercent > 0 ? `+${takeProfitPercent}%` : 'Disabled'}</span>
            </label>
            <div className="flex gap-2">
              {[0, 2, 5, 10, 15].map((pct) => (
                <button
                  type="button"
                  key={pct}
                  onClick={() => setTakeProfitPercent(pct)}
                  className={`flex-1 py-1 rounded-[4px] text-[10px] font-bold border transition-all ${
                    takeProfitPercent === pct
                      ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                      : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'
                  }`}
                >
                  {pct === 0 ? 'Off' : `${pct}%`}
                </button>
              ))}
            </div>
          </div>

          {/* Stop Loss Option */}
          <div className="col-span-2">
            <label className="text-slate-400 font-semibold mb-1.5 flex justify-between">
              <span>Stop Loss Trigger</span>
              <span className="text-rose-400 font-bold">{stopLossPercent > 0 ? `-${stopLossPercent}%` : 'Disabled'}</span>
            </label>
            <div className="flex gap-2">
              {[0, 2, 5, 10, 15].map((pct) => (
                <button
                  type="button"
                  key={pct}
                  onClick={() => setStopLossPercent(pct)}
                  className={`flex-1 py-1 rounded-[4px] text-[10px] font-bold border transition-all ${
                    stopLossPercent === pct
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                      : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'
                  }`}
                >
                  {pct === 0 ? 'Off' : `${pct}%`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Trade Information Footer */}
        <div className="space-y-1 border-t border-slate-800/80 pt-3 text-[10px] font-semibold text-slate-400">
          <div className="flex justify-between">
            <span className="flex items-center gap-1">
              <Wallet className="h-3 w-3 text-slate-500" />
              <span>Available Cash / Holdings</span>
            </span>
            <span className="text-slate-200">
              {tradeType === 'BUY' 
                ? `₹${balance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` 
                : `${ownedQty} Shares Owned`}
            </span>
          </div>

          <div className="flex justify-between">
            <span>Execution Price per Share</span>
            <span className="text-slate-200">₹{executionPrice.toFixed(2)}</span>
          </div>

          {takeProfitPercent > 0 && (
            <div className="flex justify-between text-emerald-400/80">
              <span>Expected Take Profit</span>
              <span>₹{targetProfitPrice.toFixed(2)} (+₹{expectedProfit.toFixed(2)})</span>
            </div>
          )}

          {stopLossPercent > 0 && (
            <div className="flex justify-between text-rose-400/80">
              <span>Expected Stop Loss</span>
              <span>₹{(executionPrice * (1 - stopLossPercent / 100)).toFixed(2)} (-₹{(executionPrice * (stopLossPercent / 100) * quantity).toFixed(2)})</span>
            </div>
          )}

          <div className="flex justify-between text-xs border-t border-slate-800/40 pt-1.5 mt-1">
            <span className="text-slate-300 font-bold">Estimated Total</span>
            <span className="text-white font-extrabold text-sm">₹{estTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-2 rounded-lg text-[10px] text-center font-bold">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-2 rounded-lg text-[10px] text-center font-bold">
            {successMsg}
          </div>
        )}

        {/* Trade Execution Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-2.5 rounded-xl font-extrabold text-xs tracking-wider transition-all ${
            tradeType === 'BUY'
              ? 'bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 shadow-lg shadow-emerald-500/25'
              : 'bg-rose-500 hover:bg-rose-600 active:scale-95 text-slate-950 shadow-lg shadow-rose-500/25'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isSubmitting ? 'PLACING ORDER...' : `PLACE ${tradeType} ORDER`}
        </button>
      </form>
    </div>
  );
}
