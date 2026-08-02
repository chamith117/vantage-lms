import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Award, Zap, CheckCircle2, Lock } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [badges, setBadges] = useState<any[]>([]);
  const [myBadges, setMyBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchBadges(); }, []);

  const fetchBadges = async () => {
    try {
      const [allRes, myRes] = await Promise.all([
        api.get('/api/gamification/badges'),
        api.get('/api/gamification/my-badges'),
      ]);
      setBadges(allRes.data);
      setMyBadges(myRes.data);
    } catch (err) {
      console.error('Error loading badges', err);
    } finally {
      setLoading(false);
    }
  };

  const unlockedBadgeIds = new Set(myBadges.map((mb) => mb.badge_id));
  const points = user?.points || 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Profile Header */}
      <div className="p-8 rounded-3xl glass-card relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-brand-500/8 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-5 text-center md:text-left z-10">
          <div className="w-20 h-20 rounded-2xl bg-brand-500 text-white font-extrabold flex items-center justify-center text-3xl shadow-xl shadow-brand-500/25">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold text-foreground">{user?.name}</h1>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
            <div className="inline-flex items-center gap-2 pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full glass-badge text-brand-500 capitalize">
                {user?.role} Role
              </span>
              <span className="text-[10px] text-muted-foreground font-semibold">Vantage Demo Corp</span>
            </div>
          </div>
        </div>
        <div className="p-5 rounded-2xl glass-panel text-center min-w-[180px] z-10">
          <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-1">Earned Experience</div>
          <div className="text-3xl font-extrabold text-brand-500 flex items-center justify-center gap-1.5">
            <Zap className="w-7 h-7" /> {points} <span className="text-sm font-bold text-muted-foreground">XP</span>
          </div>
        </div>
      </div>

      {/* Badges Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border/50 pb-3">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Award className="w-5 h-5 text-brand-500" /> Milestone Achievement Badges
          </h2>
          <span className="text-xs text-muted-foreground font-medium">
            {unlockedBadgeIds.size} of {badges.length} Unlocked
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-muted-foreground font-medium">Loading badges...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {badges.map((b) => {
              const isUnlocked = unlockedBadgeIds.has(b.id);
              return (
                <div
                  key={b.id}
                  className={`p-6 rounded-2xl transition-all flex flex-col justify-between ${
                    isUnlocked
                      ? 'glass-card badge-shimmer'
                      : 'glass-card opacity-50'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                        isUnlocked ? 'bg-brand-500/10 text-brand-500' : 'glass-btn text-muted-foreground'
                      }`}>
                        <Award className="w-6 h-6" />
                      </div>
                      {isUnlocked ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <Lock className="w-4 h-4 text-muted-foreground/50" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">{b.title}</h3>
                      <p className="text-[11px] text-muted-foreground mt-1 line-clamp-3 leading-relaxed">{b.description}</p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-border/50 mt-4 flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground font-medium">{b.category}</span>
                    <span className="font-bold text-brand-500">{b.required_points} XP</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
