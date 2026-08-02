import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Award, Lightbulb, BarChart3, LogOut, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface NavbarProps {
  user?: {
    name: string;
    email: string;
    role: string;
    points?: number;
  } | null;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const navLinks = [
    { path: '/courses', label: 'Courses', icon: BookOpen },
    { path: '/leaderboard', label: 'Leaderboard', icon: Award },
    { path: '/ideas', label: 'Idea Box', icon: Lightbulb },
  ];

  if (user?.role === 'admin' || user?.role === 'manager') {
    navLinks.push({ path: '/analytics', label: 'Analytics', icon: BarChart3 });
  }

  return (
    <header className="sticky top-0 z-50 glass-nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:shadow-brand-500/40 group-hover:scale-105 transition-all">
              <span className="text-white font-extrabold text-xl tracking-tighter">V</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-foreground group-hover:text-brand-500 transition-colors">
                  Vantage
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded-full glass-badge text-brand-500">
                  Enterprise
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground font-medium tracking-wide">
                See learning from a new vantage point
              </p>
            </div>
          </Link>

          {/* Navigation Items */}
          {user ? (
            <nav className="hidden md:flex items-center space-x-1">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'glass-badge text-brand-500 shadow-sm shadow-brand-500/10'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-brand-500' : 'text-muted-foreground'}`} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          ) : null}

          {/* User Profile / Auth Area */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              className="p-2 text-muted-foreground hover:text-foreground rounded-xl glass-btn transition-all"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {user ? (
              <div className="flex items-center gap-2">
                {/* User Points Badge */}
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-badge text-brand-500 font-semibold text-xs">
                  <Award className="w-3.5 h-3.5" />
                  <span>{user.points ?? 0} pts</span>
                </div>

                <Link
                  to="/profile"
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl glass-btn transition-all hover:scale-[1.02]"
                >
                  <div className="w-7 h-7 rounded-full bg-brand-500 text-white font-bold flex items-center justify-center text-xs shadow-md shadow-brand-500/20">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="text-left hidden lg:block">
                    <div className="text-xs font-semibold text-foreground leading-tight">{user.name}</div>
                    <div className="text-[10px] text-muted-foreground capitalize">{user.role}</div>
                  </div>
                </Link>

                <button
                  onClick={onLogout}
                  title="Logout"
                  className="p-2 text-muted-foreground hover:text-destructive rounded-xl glass-btn transition-all"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground glass-btn transition-all"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-brand-500 hover:bg-brand-600 text-white font-bold shadow-lg shadow-brand-500/25 transition-all hover:shadow-brand-500/40 hover:scale-[1.02]"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
