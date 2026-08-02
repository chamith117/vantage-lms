import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import api from '../services/api';
import { Award, CheckCircle2, XCircle, AlertCircle, RefreshCw, ArrowRight } from 'lucide-react';

interface Question {
  id: string;
  prompt: string;
  question_type: string;
  options: string[];
}

interface Quiz {
  id: string;
  title: string;
  passing_score: number;
  questions: Question[];
}

interface QuizRunnerProps {
  quiz: Quiz;
  onQuizPassed?: () => void;
}

export const QuizRunner: React.FC<QuizRunnerProps> = ({ quiz, onQuizPassed }) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    passed: boolean;
    passing_score: number;
    correctCount: number;
    totalCount: number;
    gamification?: { points: number; newBadges: any[] };
  } | null>(null);
  const [attempts, setAttempts] = useState<any[]>([]);

  useEffect(() => {
    fetchAttempts();
  }, [quiz.id]);

  const fetchAttempts = async () => {
    try {
      const res = await api.get(`/api/quizzes/${quiz.id}/my-attempts`);
      setAttempts(res.data);
      if (res.data.length > 0 && res.data[0].passed) {
        setResult({
          score: res.data[0].score,
          passed: res.data[0].passed,
          passing_score: quiz.passing_score,
          correctCount: Math.round((res.data[0].score / 100) * quiz.questions.length),
          totalCount: quiz.questions.length,
        });
      }
    } catch (err) {
      console.error('Error fetching quiz attempts', err);
    }
  };

  const handleOptionSelect = (questionId: string, option: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post(`/api/quizzes/${quiz.id}/submit`, { answers });
      setResult(res.data);
      if (res.data.passed) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
        if (onQuizPassed) onQuizPassed();
      }
      fetchAttempts();
    } catch (err) {
      console.error('Quiz submission error', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetake = () => {
    setAnswers({});
    setResult(null);
  };

  return (
    <div className="p-6 rounded-2xl glass-card border border-border space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h3 className="text-xl font-bold text-foreground">{quiz.title}</h3>
          <p className="text-xs text-muted-foreground">
            Passing score threshold: <span className="font-bold text-brand-500">{quiz.passing_score}%</span>
          </p>
        </div>
        <div className="p-2.5 rounded-xl bg-brand-500/10 border border-brand-500/30 text-brand-500">
          <Award className="w-6 h-6" />
        </div>
      </div>

      {result ? (
        <div className="text-center py-6 space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-card border border-border">
            {result.passed ? (
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            ) : (
              <XCircle className="w-10 h-10 text-destructive" />
            )}
          </div>

          <div>
            <h4 className="text-2xl font-extrabold text-foreground">
              {result.passed ? 'Assessment Passed!' : 'Assessment Not Passed'}
            </h4>
            <p className="text-sm text-muted-foreground mt-1">
              You scored <span className={`font-bold ${result.passed ? 'text-emerald-500' : 'text-destructive'}`}>{result.score}%</span> ({result.correctCount} / {result.totalCount} correct)
            </p>
          </div>

          {result.gamification && result.gamification.points > 0 && (
            <div className="p-3 rounded-xl bg-brand-500/10 border border-brand-500/30 text-brand-500 font-semibold text-xs inline-flex items-center gap-2">
              <Award className="w-4 h-4" />
              <span>+{result.gamification.points} XP Awarded to your profile!</span>
            </div>
          )}

          <div className="pt-4 flex justify-center">
            <button
              onClick={handleRetake}
              className="px-6 py-2.5 rounded-xl font-semibold bg-card hover:bg-brand-500/10 border border-border text-foreground flex items-center gap-2 text-sm transition-all"
            >
              <RefreshCw className="w-4 h-4" /> Retake Assessment
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {quiz.questions.map((q, idx) => (
            <div key={q.id} className="p-4 rounded-xl bg-card/80 border border-border space-y-3">
              <label className="block text-sm font-semibold text-foreground">
                {idx + 1}. {q.prompt}
              </label>

              <div className="space-y-2">
                {q.options.map((opt) => (
                  <button
                    type="button"
                    key={opt}
                    onClick={() => handleOptionSelect(q.id, opt)}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-medium border transition-all ${
                      answers[q.id] === opt
                        ? 'bg-brand-500/10 border-brand-500 text-brand-500 shadow-md'
                        : 'bg-background border-border text-muted-foreground hover:border-border'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <button
            type="submit"
            disabled={submitting || Object.keys(answers).length < quiz.questions.length}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 text-white shadow-lg shadow-brand-500/20 transition-all disabled:opacity-50"
          >
            {submitting ? 'Submitting Answers...' : 'Submit Assessment'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}
    </div>
  );
};
