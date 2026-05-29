import React, { useState } from 'react';
import { api } from '../../services/api';
import { showToast } from '../common/Toast';

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

const QUICK_QTY = [1, 5, 10, 25, 50, 100];

export default function OrderPanel({ stock, portfolio, onTradeExecuted }) {
  const [orderType, setOrderType] = useState('BUY');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const price = stock?.price ?? 0;
  const total = price * quantity;
  const cash = portfolio?.cash ?? portfolio?.availableCash ?? 1000000;

  const handleExecute = async () => {
    if (!stock?.symbol) return;
    if (showConfirm) {
      setLoading(true);
      try {
        const result = await api.executeTrade(stock.symbol, orderType, quantity);
        if (result.error) {
          showToast(result.error, 'error');
        } else {
          showToast(
            `${orderType} ${quantity} × ${stock.symbol} @ ₹${formatIndian(price)} executed!`,
            'success'
          );
          if (onTradeExecuted) onTradeExecuted();
        }
      } catch (err) {
        showToast('Trade execution failed. Please try again.', 'error');
      }
      setLoading(false);
      setShowConfirm(false);
    } else {
      setShowConfirm(true);
    }
  };

  const isBuy = orderType === 'BUY';

  return (
    <div className="glass-card h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
          📝 Place Order
        </h3>
      </div>

      {/* Stock Info */}
      <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              {stock?.symbol || 'N/A'}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {stock?.name || 'Select a stock'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold font-mono" style={{ color: 'var(--text-primary)' }}>
              ₹{formatIndian(price)}
            </p>
            <p className="text-xs font-mono" style={{
              color: (stock?.change ?? 0) >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'
            }}>
              {(stock?.change ?? 0) >= 0 ? '+' : ''}{(stock?.changePercent ?? 0).toFixed(2)}%
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {/* BUY/SELL Toggle */}
        <div className="flex rounded-lg overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
          <button
            onClick={() => { setOrderType('BUY'); setShowConfirm(false); }}
            className="flex-1 py-2.5 text-sm font-bold transition-all duration-200"
            style={{
              background: isBuy ? 'linear-gradient(135deg, #00c853, #00e676)' : 'transparent',
              color: isBuy ? '#0a0e27' : 'var(--text-muted)',
              borderRadius: '8px',
            }}
          >
            BUY
          </button>
          <button
            onClick={() => { setOrderType('SELL'); setShowConfirm(false); }}
            className="flex-1 py-2.5 text-sm font-bold transition-all duration-200"
            style={{
              background: !isBuy ? 'linear-gradient(135deg, #ff1744, #ff5252)' : 'transparent',
              color: !isBuy ? 'white' : 'var(--text-muted)',
              borderRadius: '8px',
            }}
          >
            SELL
          </button>
        </div>

        {/* Quantity */}
        <div>
          <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
            Quantity
          </label>
          <input
            type="number"
            value={quantity}
            onChange={e => {
              setQuantity(Math.max(1, parseInt(e.target.value) || 1));
              setShowConfirm(false);
            }}
            min="1"
            className="input-dark w-full font-mono text-center text-lg"
            style={{ padding: '10px' }}
          />
        </div>

        {/* Quick Quantity Buttons */}
        <div className="grid grid-cols-3 gap-1.5">
          {QUICK_QTY.map(q => (
            <button
              key={q}
              onClick={() => { setQuantity(q); setShowConfirm(false); }}
              className="py-1.5 text-xs font-semibold rounded-lg transition-all duration-150"
              style={{
                background: quantity === q ? 'rgba(68,138,255,0.15)' : 'var(--bg-primary)',
                color: quantity === q ? 'var(--accent-blue)' : 'var(--text-muted)',
                border: `1px solid ${quantity === q ? 'var(--accent-blue)' : 'var(--border-color)'}`,
              }}
            >
              {q}
            </button>
          ))}
        </div>

        {/* Order Summary */}
        <div className="rounded-lg p-3 space-y-2" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
          <div className="flex justify-between text-xs">
            <span style={{ color: 'var(--text-muted)' }}>Market Price</span>
            <span className="font-mono" style={{ color: 'var(--text-primary)' }}>₹{formatIndian(price)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span style={{ color: 'var(--text-muted)' }}>Quantity</span>
            <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{quantity}</span>
          </div>
          <div className="h-px" style={{ background: 'var(--border-color)' }} />
          <div className="flex justify-between text-sm font-bold">
            <span style={{ color: 'var(--text-secondary)' }}>Total Value</span>
            <span className="font-mono" style={{ color: isBuy ? 'var(--accent-green)' : 'var(--accent-red)' }}>
              ₹{formatIndian(total)}
            </span>
          </div>
        </div>

        {/* Available Balance */}
        <div className="flex justify-between text-xs px-1">
          <span style={{ color: 'var(--text-muted)' }}>Available Cash</span>
          <span className="font-mono" style={{ color: 'var(--accent-cyan)' }}>₹{formatIndian(cash)}</span>
        </div>

        {/* Confirmation */}
        {showConfirm && (
          <div
            className="rounded-lg p-3 text-center animate-fade-in"
            style={{
              background: isBuy ? 'rgba(0,230,118,0.08)' : 'rgba(255,82,82,0.08)',
              border: `1px solid ${isBuy ? 'rgba(0,230,118,0.3)' : 'rgba(255,82,82,0.3)'}`,
            }}
          >
            <p className="text-xs font-medium" style={{ color: isBuy ? 'var(--accent-green)' : 'var(--accent-red)' }}>
              Confirm {orderType} {quantity} × {stock?.symbol} for ₹{formatIndian(total)}?
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Click the button again to confirm
            </p>
          </div>
        )}

        {/* Execute Button */}
        <button
          onClick={handleExecute}
          disabled={loading || !stock}
          className={`w-full py-3 text-sm font-bold rounded-lg transition-all duration-200 disabled:opacity-50 ${
            isBuy ? 'btn-buy' : 'btn-sell'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Executing...
            </span>
          ) : showConfirm ? (
            `✓ Confirm ${orderType}`
          ) : (
            `${isBuy ? '🟢' : '🔴'} ${orderType} ${stock?.symbol || ''}`
          )}
        </button>
      </div>
    </div>
  );
}
