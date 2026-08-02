import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Trophy, Crown, Zap, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LeaderboardPage: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => { fetchLeaderboard(); }, []);

  const fetchLeaderboard = async () => {
    try {
      const res = await api.get('/api/gamification/leaderboard');
      setLeaderboard(res.data);
    } catch (err) {
      console.error('Leaderboard error', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Banner */}
      <div className="p-8 rounded-3xl glass-card relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-brand-500/8 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-2 text-center md:text-left z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-badge text-brand-500 text-xs font-semibold">
            <Trophy className="w-3.5 h-3.5" />
            <span>Redis Sorted Set Rankings</span>
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Enterprise Leaderboard</h1>
          <p className="text-xs text-muted-foreground">
            Real-time learner rankings for <span className="font-semibold text-brand-500">Vantage Demo Corp</span>
          </p>
        </div>

        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-xl shadow-brand-500/25 text-white shrink-0">
          <Crown className="w-8 h-8" />
        </div>
      </div>

      {/* Leaderboard Table */}
      {loading ? (
        <div className="py-20 text-center text-muted-foreground font-medium">Loading real-time leaderboard...</div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/50 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="py-4 px-6">Rank</th>
                  <th className="py-4 px-6">Learner</th>
                  <th className="py-4 px-6">Role</th>
                  <th className="py-4 px-6 text-right">XP Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30 text-xs font-medium">
                {leaderboard.map((item) => {
                  const isCurrentUser = user && user.email === item.email;
                  return (
                    <tr
                      key={item.userId || item.email}
                      className={`transition-all ${
                        isCurrentUser
                          ? 'bg-brand-500/8 border-l-4 border-l-brand-500'
                          : 'hover:bg-secondary/30'
                      }`}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          {item.rank <= 3 ? (
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold ${
                              item.rank === 1 ? 'glass-badge text-brand-500' :
                              item.rank === 2 ? 'glass-badge text-slate-300' :
                              'glass-badge text-amber-500'
                            }`}>
                              {item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : '🥉'}
                            </div>
                          ) : (
                            <span className="w-7 text-center font-bold text-muted-foreground text-xs">#{item.rank}</span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand-500/15 text-brand-500 font-bold flex items-center justify-center text-xs">
                            {item.name ? item.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="text-foreground font-semibold flex items-center gap-2">
                              {item.name}
                              {isCurrentUser && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full glass-badge text-brand-500 font-bold">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-muted-foreground">{item.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6 capitalize">
                        <span className="px-2.5 py-1 rounded-full glass-badge text-muted-foreground text-[10px] font-semibold">
                          {item.role}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right font-extrabold text-brand-500 text-sm">
                        <div className="inline-flex items-center gap-1.5">
                          <Zap className="w-4 h-4" />
                          <span>{item.points} XP</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
