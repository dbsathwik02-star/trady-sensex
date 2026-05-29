import React, { useState } from 'react';
import { Activity, Mail, Lock, User, ArrowRight } from 'lucide-react';

export default function AuthModal({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password || (!isLogin && !name)) {
      setErrorMsg('All fields are required.');
      return;
    }

    setIsSubmitting(true);
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const payload = isLogin ? { email, password } : { name, email, password };

    try {
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();

      if (response.ok && result.token) {
        localStorage.setItem('sensex_token', result.token);
        localStorage.setItem('sensex_user', JSON.stringify(result.user));
        onAuthSuccess(result.token, result.user);
      } else {
        setErrorMsg(result.error || 'Authentication failed. Please check inputs.');
      }
    } catch (err) {
      setErrorMsg('Server connection failed. Is the backend running?');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#04060b]/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="glass-panel rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-800/80 max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-6">
          <div className="h-12 w-12 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 mx-auto mb-3">
            <Activity className="h-6 w-6 text-white animate-pulse" />
          </div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            {isLogin ? 'Welcome Back Trader' : 'Create Paper Trading Account'}
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            {isLogin ? 'Access BSE SENSEX live dashboard & virtual portfolio' : 'Start paper trading today with ₹10,00,000 in virtual cash'}
          </p>
        </div>

        {errorMsg && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-xl mb-4 font-bold text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 block">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-200 outline-none focus:border-blue-500 transition-colors font-semibold"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 block">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-200 outline-none focus:border-blue-500 transition-colors font-semibold"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-200 outline-none focus:border-blue-500 transition-colors font-semibold"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-500 hover:bg-blue-600 active:scale-[0.98] py-3 rounded-xl font-extrabold text-xs text-slate-950 flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 mt-6"
          >
            <span>{isSubmitting ? 'VERIFYING...' : isLogin ? 'SIGN IN' : 'REGISTER & OPEN ACCOUNT'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
          
          {isLogin && (
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-2.5 mt-4 text-[10px] text-slate-400 font-semibold leading-relaxed">
              💡 <span className="text-slate-300 font-bold">Demo Account:</span> Log in with <span className="text-blue-400 font-bold">test@example.com</span> and password <span className="text-blue-400 font-bold">password123</span>, or click "Create Account" below.
            </div>
          )}
        </form>

        <div className="border-t border-slate-800/80 pt-4 mt-6 text-center text-xs">
          <span className="text-slate-500 font-semibold">
            {isLogin ? "Don't have an account?" : 'Already registered?'}
          </span>{' '}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setErrorMsg('');
              setName('');
              setEmail('');
              setPassword('');
            }}
            className="text-blue-400 font-extrabold hover:text-blue-300 transition-colors"
          >
            {isLogin ? 'Create Account' : 'Sign In Now'}
          </button>
        </div>
      </div>
    </div>
  );
}
