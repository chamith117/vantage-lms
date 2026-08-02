import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Lightbulb, Send, MessageCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const IdeaBoxPage: React.FC = () => {
  const [ideas, setIdeas] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeIdeaId, setActiveIdeaId] = useState<string | null>(null);
  const [adminStatus, setAdminStatus] = useState<'pending' | 'reviewed' | 'implemented'>('reviewed');
  const [adminResponse, setAdminResponse] = useState('');
  const { user } = useAuth();

  useEffect(() => { fetchIdeas(); }, []);

  const fetchIdeas = async () => {
    try {
      const res = await api.get('/api/social/ideas');
      setIdeas(res.data);
    } catch (err) {
      console.error('Failed to load ideas', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    setSubmitting(true);
    try {
      await api.post('/api/social/ideas', { title, description });
      setTitle('');
      setDescription('');
      fetchIdeas();
    } catch (err) {
      console.error('Idea creation failed', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateIdea = async (ideaId: string) => {
    try {
      await api.put(`/api/social/ideas/${ideaId}`, { status: adminStatus, admin_response: adminResponse });
      setActiveIdeaId(null);
      setAdminResponse('');
      fetchIdeas();
    } catch (err) {
      console.error('Update idea error', err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Banner */}
      <div className="p-8 rounded-3xl glass-card relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="absolute -top-20 -left-20 w-60 h-60 bg-brand-500/8 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-2 text-center md:text-left z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-badge text-brand-500 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Community Innovation Portal</span>
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Vantage Idea Box</h1>
          <p className="text-xs text-muted-foreground">
            Submit learning suggestions & improvement ideas to company administrators (+20 XP)
          </p>
        </div>

        <div className="w-16 h-16 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center shrink-0">
          <Lightbulb className="w-8 h-8" />
        </div>
      </div>

      {/* Submit Idea Form */}
      <form onSubmit={handleCreateIdea} className="glass-card p-6 rounded-2xl space-y-4">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <Send className="w-4 h-4 text-brand-500" /> Submit a New Suggestion
        </h2>
        <div className="space-y-3">
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Idea Title (e.g., Add Python for Data Science Course Track)"
            className="w-full px-4 py-2.5 glass-input rounded-xl text-sm text-foreground placeholder-muted-foreground"
          />
          <textarea
            rows={3}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Elaborate on how this initiative helps Vantage Demo Corp team members..."
            className="w-full p-4 glass-input rounded-xl text-sm text-foreground placeholder-muted-foreground resize-none"
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl font-bold bg-brand-500 hover:bg-brand-600 text-white text-xs shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition-all disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Idea (+20 XP)'}
          </button>
        </div>
      </form>

      {/* Ideas Feed */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">Community Ideas Stream</h2>
        {loading ? (
          <div className="py-12 text-center text-muted-foreground font-medium">Loading idea stream...</div>
        ) : (
          <div className="space-y-4">
            {ideas.map((idea) => {
              const isAdminOrManager = user?.role === 'admin' || user?.role === 'manager';
              return (
                <div key={idea.id} className="p-6 glass-card rounded-2xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-foreground">{idea.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <span>Submitted by <strong className="text-foreground">{idea.user?.name}</strong></span>
                        <span>&bull;</span>
                        <span>{new Date(idea.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      idea.status === 'implemented' ? 'glass-badge text-emerald-500' :
                      idea.status === 'reviewed' ? 'glass-badge text-accentblue-500' :
                      'glass-badge text-brand-500'
                    }`}>
                      {idea.status}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">{idea.description}</p>

                  {idea.admin_response && (
                    <div className="p-4 rounded-xl glass-badge text-brand-500 text-xs space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <MessageCircle className="w-3.5 h-3.5" /> Administrator Response:
                      </div>
                      <p className="text-foreground">{idea.admin_response}</p>
                    </div>
                  )}

                  {isAdminOrManager && (
                    <div className="pt-2 border-t border-border/50">
                      {activeIdeaId === idea.id ? (
                        <div className="space-y-3 p-4 glass-panel rounded-xl">
                          <div className="text-xs font-bold text-foreground">Review & Respond to Idea</div>
                          <div className="flex gap-2">
                            {(['pending', 'reviewed', 'implemented'] as const).map((s) => (
                              <button
                                type="button"
                                key={s}
                                onClick={() => setAdminStatus(s)}
                                className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all ${
                                  adminStatus === s
                                    ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/25'
                                    : 'glass-btn text-muted-foreground'
                                }`}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                          <textarea
                            rows={2}
                            value={adminResponse}
                            onChange={(e) => setAdminResponse(e.target.value)}
                            placeholder="Write official response..."
                            className="w-full p-2.5 glass-input rounded-xl text-xs text-foreground placeholder-muted-foreground"
                          />
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => setActiveIdeaId(null)} className="px-3 py-1 rounded-lg text-xs glass-btn text-muted-foreground">
                              Cancel
                            </button>
                            <button
                              onClick={() => handleUpdateIdea(idea.id)}
                              className="px-4 py-1.5 rounded-lg text-xs font-bold bg-brand-500 text-white shadow-sm shadow-brand-500/25"
                            >
                              Save Response
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setActiveIdeaId(idea.id); setAdminStatus(idea.status); setAdminResponse(idea.admin_response || ''); }}
                          className="text-xs font-bold text-brand-500 hover:underline"
                        >
                          + Respond as Admin
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
