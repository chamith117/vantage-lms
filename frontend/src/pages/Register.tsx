import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, Shield, ArrowRight, AlertCircle } from 'lucide-react';

export const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'manager' | 'learner'>('learner');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(name, email, password, role);
      navigate('/courses');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Try another email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md glass-card glass-panel p-8 rounded-3xl relative overflow-hidden">
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center relative">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-500 shadow-lg shadow-brand-500/30 mb-4">
            <span className="font-extrabold text-2xl text-white">V</span>
          </div>
          <h2 className="text-3xl font-extrabold text-foreground tracking-tight">Create Enterprise Account</h2>
          <p className="mt-2 text-xs text-muted-foreground">
            Join <span className="text-foreground font-semibold">Vantage Demo Corp</span> learning workspace
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
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Full Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="block w-full pl-10 pr-4 py-2.5 glass-input rounded-xl text-sm text-foreground placeholder-muted-foreground"
              />
            </div>
          </div>

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
                placeholder="jane.doe@vantage.local"
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
                placeholder="Minimum 6 characters"
                className="block w-full pl-10 pr-4 py-2.5 glass-input rounded-xl text-sm text-foreground placeholder-muted-foreground"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Select Role</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'learner', label: 'Learner', icon: User, desc: 'Access courses' },
                { value: 'manager', label: 'Manager', icon: Shield, desc: 'Manage courses' },
                { value: 'admin', label: 'Admin', icon: Shield, desc: 'Full access' },
              ].map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value as any)}
                  className={`p-3 rounded-xl text-center transition-all ${
                    role === r.value
                      ? 'glass-badge text-brand-500 shadow-sm shadow-brand-500/10'
                      : 'glass-btn text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <r.icon className="w-5 h-5 mx-auto mb-1" />
                  <div className="text-xs font-bold">{r.label}</div>
                  <div className="text-[10px] opacity-70">{r.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 text-sm transition-all disabled:opacity-50 hover:scale-[1.01]"
          >
            {loading ? 'Creating Account...' : 'Create Account'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-brand-500 hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};
