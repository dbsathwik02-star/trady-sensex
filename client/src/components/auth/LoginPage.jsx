import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const features = [
  { icon: '📊', title: 'Live Charts', desc: 'Real-time candlestick charts with TradingView' },
  { icon: '🤖', title: 'AI Signals', desc: 'RSI, MACD, Bollinger buy/sell signals' },
  { icon: '💼', title: 'Portfolio Tracking', desc: 'Track holdings, P&L in real-time' },
  { icon: '⚡', title: 'Real-Time Data', desc: 'WebSocket-powered live price updates' },
  { icon: '📈', title: 'SENSEX 30', desc: 'All BSE SENSEX constituent stocks' },
  { icon: '🔔', title: 'Smart Alerts', desc: 'Get notified on signal changes' },
];

export default function LoginPage() {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let data;
      if (isLogin) {
        data = await login(email, password);
      } else {
        data = await register(username, email, password);
      }
      if (data.error) setError(data.error);
    } catch (err) {
      setError('Connection failed. Please check if the server is running.');
    }
    setLoading(false);
  };

  const handleDemo = async () => {
    setError('');
    setLoading(true);
    try {
      const data = await login('demo@sensex.com', 'demo123');
      if (data.error) setError(data.error);
    } catch (err) {
      setError('Connection failed. Please check if the server is running.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-primary)' }}>
      {/* Animated background grid */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(68, 138, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(68, 138, 255, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }} />
        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, var(--accent-blue), transparent)', filter: 'blur(80px)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, var(--accent-purple), transparent)', filter: 'blur(80px)' }} />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, var(--accent-cyan), transparent)', filter: 'blur(60px)' }} />
      </div>

      {/* Left Side - Features */}
      <div className="hidden lg:flex flex-1 flex-col justify-center px-16 relative z-10">
        <div className="mb-12 animate-fade-in">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
              style={{ background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))' }}>
              📈
            </div>
            <h1 className="text-4xl font-bold gradient-text">SENSEX Trader Pro</h1>
          </div>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
            Professional-grade BSE SENSEX trading dashboard with real-time analytics,
            AI-powered signals, and portfolio management.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="glass-card p-4 animate-fade-in"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="text-2xl mb-2">{f.icon}</div>
              <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{f.title}</h3>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Live market stats decoration */}
        <div className="mt-12 flex gap-8 animate-fade-in" style={{ animationDelay: '600ms' }}>
          <div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>SENSEX</p>
            <p className="text-2xl font-bold" style={{ fontFamily: 'JetBrains Mono', color: 'var(--accent-green)' }}>
              72,568.45
            </p>
            <p className="text-sm" style={{ color: 'var(--accent-green)' }}>+1.24%</p>
          </div>
          <div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>NIFTY 50</p>
            <p className="text-2xl font-bold" style={{ fontFamily: 'JetBrains Mono', color: 'var(--accent-green)' }}>
              21,982.30
            </p>
            <p className="text-sm" style={{ color: 'var(--accent-green)' }}>+0.98%</p>
          </div>
          <div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Active Traders</p>
            <p className="text-2xl font-bold" style={{ fontFamily: 'JetBrains Mono', color: 'var(--accent-cyan)' }}>
              12,847
            </p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Online now</p>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center px-6 relative z-10">
        <div className="w-full max-w-md">
          {/* Mobile branding */}
          <div className="lg:hidden text-center mb-8 animate-fade-in">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                style={{ background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))' }}>
                📈
              </div>
              <h1 className="text-3xl font-bold gradient-text">SENSEX Trader Pro</h1>
            </div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Real-time BSE trading dashboard</p>
          </div>

          <div className="glass-card p-8 animate-fade-in" style={{ animationDelay: '200ms' }}>
            {/* Toggle Tabs */}
            <div className="flex mb-8 rounded-lg overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
              <button
                onClick={() => { setIsLogin(true); setError(''); }}
                className="flex-1 py-3 text-sm font-semibold transition-all duration-300"
                style={{
                  background: isLogin ? 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))' : 'transparent',
                  color: isLogin ? 'white' : 'var(--text-muted)',
                  borderRadius: '8px',
                }}
              >
                Sign In
              </button>
              <button
                onClick={() => { setIsLogin(false); setError(''); }}
                className="flex-1 py-3 text-sm font-semibold transition-all duration-300"
                style={{
                  background: !isLogin ? 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))' : 'transparent',
                  color: !isLogin ? 'white' : 'var(--text-muted)',
                  borderRadius: '8px',
                }}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="animate-fade-in">
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="input-dark w-full"
                    placeholder="Choose a username"
                    required={!isLogin}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input-dark w-full"
                  placeholder="trader@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-dark w-full"
                  placeholder="Enter your password"
                  required
                />
              </div>

              {error && (
                <div className="p-3 rounded-lg text-sm animate-fade-in"
                  style={{
                    background: 'rgba(255, 82, 82, 0.1)',
                    border: '1px solid rgba(255, 82, 82, 0.3)',
                    color: 'var(--accent-red)',
                  }}>
                  ⚠️ {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {isLogin ? 'Signing In...' : 'Creating Account...'}
                  </span>
                ) : (
                  isLogin ? 'Sign In' : 'Create Account'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center my-6">
              <div className="flex-1 h-px" style={{ background: 'var(--border-color)' }} />
              <span className="px-4 text-xs" style={{ color: 'var(--text-muted)' }}>OR</span>
              <div className="flex-1 h-px" style={{ background: 'var(--border-color)' }} />
            </div>

            {/* Demo Login */}
            <button
              onClick={handleDemo}
              disabled={loading}
              className="w-full py-3 rounded-lg text-sm font-semibold transition-all duration-300 disabled:opacity-50"
              style={{
                background: 'rgba(0, 230, 118, 0.1)',
                border: '1px solid rgba(0, 230, 118, 0.3)',
                color: 'var(--accent-green)',
              }}
              onMouseEnter={e => {
                e.target.style.background = 'rgba(0, 230, 118, 0.2)';
                e.target.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={e => {
                e.target.style.background = 'rgba(0, 230, 118, 0.1)';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              🚀 Quick Demo Login
            </button>

            <p className="text-center text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
              Demo: demo@sensex.com / demo123
            </p>
          </div>

          {/* Footer */}
          <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
            Built with ❤️ for Indian stock traders • Not real trading advice
          </p>
        </div>
      </div>
    </div>
  );
}
