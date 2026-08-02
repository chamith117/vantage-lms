import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { MessageSquare, Send, ThumbsUp, Heart, Rocket, Lightbulb, PartyPopper } from 'lucide-react';

interface CommentSectionProps {
  lessonId: string;
}

const EMOJI_OPTIONS = [
  { char: '👍', name: 'thumbs_up' },
  { char: '❤️', name: 'heart' },
  { char: '🚀', name: 'rocket' },
  { char: '💡', name: 'lightbulb' },
  { char: '🎉', name: 'party' },
];

export const CommentSection: React.FC<CommentSectionProps> = ({ lessonId }) => {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [lessonId]);

  const fetchComments = async () => {
    try {
      const res = await api.get(`/api/social/lessons/${lessonId}/comments`);
      setComments(res.data);
    } catch (err) {
      console.error('Failed to load comments', err);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      await api.post(`/api/social/lessons/${lessonId}/comments`, { content: newComment });
      setNewComment('');
      fetchComments();
    } catch (err) {
      console.error('Failed to post comment', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReaction = async (commentId: string, emoji: string) => {
    try {
      await api.post(`/api/social/comments/${commentId}/reactions`, { emoji });
      fetchComments();
    } catch (err) {
      console.error('Failed to toggle reaction', err);
    }
  };

  return (
    <div className="mt-8 p-6 rounded-2xl glass-card border border-border space-y-6">
      <div className="flex items-center gap-2 border-b border-border pb-4">
        <MessageSquare className="w-5 h-5 text-brand-500" />
        <h3 className="text-lg font-bold text-foreground">Lesson Discussion Thread</h3>
        <span className="text-xs text-muted-foreground font-medium">({comments.length} contributions)</span>
      </div>

      {/* Post New Comment */}
      <form onSubmit={handlePostComment} className="space-y-3">
        <textarea
          rows={2}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Share your technical insights, questions, or notes with colleagues..."
          className="w-full p-3 bg-card border border-border rounded-xl text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-brand-500 transition-all resize-none"
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting || !newComment.trim()}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-brand-500/10 hover:bg-brand-500/20 text-brand-500 border border-brand-500/30 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            {submitting ? 'Posting...' : 'Post Comment (+20 XP)'}
          </button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.map((c) => {
          // Group reactions by emoji
          const reactionCounts: Record<string, number> = {};
          c.reactions?.forEach((r: any) => {
            reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1;
          });

          return (
            <div key={c.id} className="p-4 rounded-xl bg-card/60 border border-border/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-vantage-700 text-brand-500 font-bold flex items-center justify-center text-[10px] border border-brand-500/20">
                    {c.user?.name?.charAt(0) || 'U'}
                  </div>
                  <span className="text-xs font-semibold text-foreground">{c.user?.name}</span>
                  <span className="text-[10px] text-slate-500">
                    {new Date(c.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">{c.content}</p>

              {/* Emoji Reactions Bar */}
              <div className="flex items-center gap-1.5 pt-2">
                {EMOJI_OPTIONS.map((e) => {
                  const count = reactionCounts[e.char] || 0;
                  return (
                    <button
                      key={e.char}
                      onClick={() => handleReaction(c.id, e.char)}
                      className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 border transition-all ${
                        count > 0
                          ? 'bg-brand-500/10 border-brand-500/40 text-brand-500'
                          : 'bg-background/60 border-border text-muted-foreground hover:border-border'
                      }`}
                    >
                      <span>{e.char}</span>
                      {count > 0 && <span className="text-[10px] font-bold">{count}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
