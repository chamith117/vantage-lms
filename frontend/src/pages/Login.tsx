import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/courses');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (quickEmail: string) => {
    setEmail(quickEmail);
    setPassword('Password123!');
    setError('');
    setLoading(true);
    try {
      await login(quickEmail, 'Password123!');
      navigate('/courses');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md glass-card glass-panel p-8 rounded-3xl relative overflow-hidden">
        {/* Decorative gradient orb */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center relative">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-500 shadow-lg shadow-brand-500/30 mb-4">
            <span className="font-extrabold text-2xl text-white">V</span>
          </div>
          <h2 className="text-3xl font-extrabold text-foreground tracking-tight">Welcome Back</h2>
          <p className="mt-2 text-xs text-muted-foreground">
            Sign in to <span className="text-foreground font-semibold">Vantage Demo Corp</span> workspace
          </p>
        </div>

        {error && (
          <div className="mt-6 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Work Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@vantage.local"
                className="block w-full pl-10 pr-4 py-2.5 glass-input rounded-xl text-sm text-foreground placeholder-muted-foreground"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="block w-full pl-10 pr-4 py-2.5 glass-input rounded-xl text-sm text-foreground placeholder-muted-foreground"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 text-sm transition-all disabled:opacity-50 hover:scale-[1.01]"
          >
            {loading ? 'Signing In...' : 'Sign In'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-4 mt-4 border-t border-border/50">
          <p className="text-center text-xs text-muted-foreground mb-3">Quick Demo Access</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Admin', email: 'admin@vantage.local', cls: 'glass-badge text-brand-500 hover:bg-brand-500/15' },
              { label: 'Manager', email: 'manager@vantage.local', cls: 'glass-badge text-accentblue-500 hover:bg-accentblue-500/15' },
              { label: 'Learner', email: 'learner@vantage.local', cls: 'glass-badge text-emerald-500 hover:bg-emerald-500/15' },
            ].map((demo) => (
              <button
                key={demo.email}
                onClick={() => quickLogin(demo.email)}
                disabled={loading}
                className={`py-2 rounded-xl text-xs font-bold transition-all ${demo.cls}`}
              >
                {demo.label}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          No account yet?{' '}
          <Link to="/register" className="font-bold text-brand-500 hover:underline">
            Create Enterprise Account
          </Link>
        </p>
      </div>
    </div>
  );
};
