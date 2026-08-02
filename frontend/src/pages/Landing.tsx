import React from 'react';
import { Link } from 'react-router-dom';
import { Award, BookOpen, Users, ShieldCheck, Zap, CheckCircle2 } from 'lucide-react';

export const Landing: React.FC = () => {
  return (
    <div className="relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-500/8 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[300px] h-[300px] bg-accentblue-500/8 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-10 w-[250px] h-[250px] bg-brand-400/5 rounded-full blur-[80px] pointer-events-none" />

      <section className="relative pt-20 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        {/* Pill badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-badge text-brand-500 text-xs font-semibold mb-8">
          <Zap className="w-3.5 h-3.5 animate-pulse" />
          <span>Vantage Enterprise LMS Platform 1.0</span>
        </div>

        {/* Hero heading */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground max-w-4xl mx-auto leading-tight">
          See learning from a new <span className="aurora-text">vantage point.</span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto font-normal leading-relaxed">
          Transform corporate training into an engaging, gamified, and social learning experience for your entire organization.
        </p>

        {/* CTA buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/register"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold bg-brand-500 text-white shadow-xl shadow-brand-500/25 hover:bg-brand-600 hover:shadow-brand-500/40 hover:scale-105 transition-all text-center"
          >
            Explore Vantage LMS
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-semibold glass-btn text-foreground transition-all text-center"
          >
            Demo Sign In
          </Link>
        </div>

        {/* Feature cards */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="p-6 rounded-2xl glass-card glass-card-hover">
            <div className="w-12 h-12 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center mb-5">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">Gamified Experience</h3>
            <p className="text-sm text-muted-foreground">
              Earn XP points, unlock milestone achievement badges, and climb company-wide leaderboards powered by Redis.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-card glass-card-hover">
            <div className="w-12 h-12 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center mb-5">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">Modular Content & Quizzes</h3>
            <p className="text-sm text-muted-foreground">
              Structured learning paths with video, document attachments, interactive auto-graded quizzes, and progress tracking.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-card glass-card-hover">
            <div className="w-12 h-12 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center mb-5">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">Social & Idea Collaboration</h3>
            <p className="text-sm text-muted-foreground">
              Discuss course lessons, express quick reactions, and share innovative ideas in the company Idea Box.
            </p>
          </div>
        </div>

        {/* Trust bar */}
        <div className="mt-16 p-6 rounded-2xl glass-card flex flex-col md:flex-row items-center justify-between gap-6 text-left">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl glass-badge text-emerald-500">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h4 className="font-bold text-foreground text-base">Fully Self-Hosted & Local Storage</h4>
              <p className="text-xs text-muted-foreground">Zero cloud dependencies. Powered locally via Docker, PostgreSQL, and Redis.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-brand-500" /> Vantage Demo Corp</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Local File Storage</span>
          </div>
        </div>
      </section>
    </div>
  );
};
