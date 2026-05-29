import React, { useState, useEffect, useCallback } from 'react';

let toastId = 0;
const listeners = new Set();
let toasts = [];

function notifyListeners() {
  listeners.forEach(fn => fn([...toasts]));
}

export function showToast(message, type = 'info') {
  const id = ++toastId;
  toasts = [...toasts, { id, message, type }];
  notifyListeners();
  setTimeout(() => {
    toasts = toasts.filter(t => t.id !== id);
    notifyListeners();
  }, 3500);
}

const icons = {
  success: '✅',
  error: '❌',
  info: 'ℹ️',
  warning: '⚠️',
};

const colors = {
  success: { bg: 'rgba(0, 230, 118, 0.15)', border: 'rgba(0, 230, 118, 0.4)', text: 'var(--accent-green)' },
  error: { bg: 'rgba(255, 82, 82, 0.15)', border: 'rgba(255, 82, 82, 0.4)', text: 'var(--accent-red)' },
  info: { bg: 'rgba(68, 138, 255, 0.15)', border: 'rgba(68, 138, 255, 0.4)', text: 'var(--accent-blue)' },
  warning: { bg: 'rgba(255, 215, 64, 0.15)', border: 'rgba(255, 215, 64, 0.4)', text: 'var(--accent-yellow)' },
};

export default function Toast() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    listeners.add(setItems);
    return () => listeners.delete(setItems);
  }, []);

  const dismiss = useCallback((id) => {
    toasts = toasts.filter(t => t.id !== id);
    notifyListeners();
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2" style={{ maxWidth: '380px' }}>
      {items.map(toast => {
        const c = colors[toast.type] || colors.info;
        return (
          <div
            key={toast.id}
            className="animate-slide-in flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg"
            style={{
              background: c.bg,
              border: `1px solid ${c.border}`,
              backdropFilter: 'blur(20px)',
            }}
          >
            <span className="text-lg flex-shrink-0">{icons[toast.type] || icons.info}</span>
            <p className="text-sm font-medium flex-1" style={{ color: c.text }}>{toast.message}</p>
            <button
              onClick={() => dismiss(toast.id)}
              className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity text-lg leading-none"
              style={{ color: c.text }}
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
