import React, { useState } from 'react';
import { User, Mail, Shield, ShieldCheck, CheckCircle2, TrendingUp, TrendingDown, Save, PieChart } from 'lucide-react';

export default function ProfileSection({ user, portfolio, transactions, onUpdateProfile }) {
  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || 'blue');
  const [tradingLevel, setTradingLevel] = useState(user?.tradingLevel || 'Novice');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const holdings = portfolio?.holdings || [];
  const balance = portfolio?.balance || 1000000;
  
  // Stats calculations
  const totalEquities = holdings.reduce((sum, h) => sum + (h.quantity * h.avgPrice), 0);
  const totalWorth = balance + totalEquities;
  const allocationEquities = totalWorth > 0 ? (totalEquities / totalWorth) * 100 : 0;
  const allocationCash = 100 - allocationEquities;

  const totalTrades = transactions.length;
  const buyTrades = transactions.filter(t => t.type === 'BUY').length;
  const sellTrades = totalTrades - buyTrades;

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const response = await fetch('http://localhost:5000/api/auth/profile/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sensex_token')}`
        },
        body: JSON.stringify({ name, avatar, tradingLevel })
      });
      const result = await response.json();

      if (response.ok) {
        localStorage.setItem('sensex_user', JSON.stringify(result));
        onUpdateProfile(result);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to update profile settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const getAvatarClass = (color) => {
    switch (color) {
      case 'emerald': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'purple': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'orange': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-fade-in">
      
      {/* Profile Card & Info Edit */}
      <div className="md:col-span-5 space-y-6">
        <div className="glass-panel rounded-2xl p-6 flex flex-col items-center text-center">
          
          {/* Avatar frame */}
          <div className={`h-24 w-24 rounded-full border-2 flex items-center justify-center shadow-inner ${getAvatarClass(avatar)}`}>
            <User className="h-12 w-12" />
          </div>
          
          <h2 className="text-lg font-black text-white mt-4">{user?.name}</h2>
          <p className="text-xs text-slate-500 font-semibold">{user?.email}</p>
          
          <div className="mt-3 flex items-center gap-1.5 bg-slate-900/60 border border-slate-800 px-3 py-1 rounded-full text-[10px] font-bold text-blue-400">
            <Shield className="h-3 w-3" />
            <span>Trading Level: {user?.tradingLevel}</span>
          </div>

          <form onSubmit={handleSave} className="w-full mt-6 space-y-4 text-left text-xs border-t border-slate-800/80 pt-5">
            
            <div className="space-y-1">
              <label className="text-slate-400 font-bold">Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-200 outline-none focus:border-blue-500 font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 font-bold block mb-1.5">Avatar Color Theme</label>
              <div className="flex gap-3">
                {['blue', 'emerald', 'purple', 'orange'].map((c) => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setAvatar(c)}
                    className={`h-7 w-7 rounded-full border transition-all ${
                      avatar === c ? 'scale-110 border-white shadow-md' : 'border-transparent'
                    } ${
                      c === 'blue' ? 'bg-blue-500' : c === 'emerald' ? 'bg-emerald-500' : c === 'purple' ? 'bg-purple-500' : 'bg-orange-500'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 font-bold">Trading Level</label>
              <select
                value={tradingLevel}
                onChange={(e) => setTradingLevel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-200 outline-none focus:border-blue-500 font-semibold"
              >
                <option value="Novice">Novice / Beginner</option>
                <option value="Intermediate">Intermediate Trader</option>
                <option value="Expert">Expert / Analyst</option>
              </select>
            </div>

            {saveSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] py-1.5 rounded-lg flex items-center justify-center gap-1 font-bold">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Profile updated successfully!</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="w-full bg-blue-500 hover:bg-blue-600 active:scale-[0.97] py-2 rounded-xl text-slate-950 font-extrabold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-500/10"
            >
              <Save className="h-4 w-4" />
              <span>{isSaving ? 'SAVING CHANGES...' : 'SAVE SETTINGS'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Profile statistics / allocation charts */}
      <div className="md:col-span-7 space-y-6">
        
        {/* Trading Statistics */}
        <div className="glass-panel rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Trading Performance Stats</span>
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/50">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Value (Equity + Cash)</span>
              <span className="text-lg font-black text-slate-100 block mt-1">₹{totalWorth.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
            </div>

            <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/50">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Trades Executed</span>
              <span className="text-lg font-black text-slate-100 block mt-1">{totalTrades}</span>
            </div>

            <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/50">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">BUY Orders Executed</span>
              <span className="text-sm font-bold text-slate-300 block mt-1">{buyTrades}</span>
            </div>

            <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/50">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">SELL Orders Executed</span>
              <span className="text-sm font-bold text-slate-300 block mt-1">{sellTrades}</span>
            </div>
          </div>
        </div>

        {/* Portfolio Asset Allocation */}
        <div className="glass-panel rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <PieChart className="h-4 w-4 text-blue-400" />
            <span>Asset Allocations</span>
          </h3>

          <div className="space-y-4">
            {/* Equities Allocation bar */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1 text-slate-300">
                <span>Holdings (Stock Equity)</span>
                <span>{allocationEquities.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full" style={{ width: `${allocationEquities}%` }} />
              </div>
            </div>

            {/* Cash Allocation bar */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1 text-slate-300">
                <span>Virtual Cash Balance</span>
                <span>{allocationCash.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full" style={{ width: `${allocationCash}%` }} />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
