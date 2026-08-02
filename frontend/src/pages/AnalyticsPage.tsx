import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { BarChart3, Download, Users, BookOpen, Award, CheckCircle2, TrendingUp } from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAnalytics(); }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/api/analytics/dashboard');
      setData(res.data);
    } catch (err) {
      console.error('Analytics load error', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      const response = await api.get('/api/analytics/export-csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'vantage-analytics-report.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('CSV export failed', err);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-muted-foreground font-medium">Loading Vantage analytics suite...</div>;
  }

  const COLORS = ['#3B82F6', '#0EA5E9', '#10B981', '#6366F1'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-badge text-brand-500 text-xs font-semibold mb-2">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Executive Reporting Suite</span>
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Enterprise Learning Analytics</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Performance metrics and completion rates for <span className="text-foreground font-semibold">Vantage Demo Corp</span>
          </p>
        </div>
        <button
          onClick={handleExportCsv}
          className="px-5 py-2.5 rounded-xl font-bold bg-brand-500 hover:bg-brand-600 text-white flex items-center gap-2 shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 text-xs transition-all"
        >
          <Download className="w-4 h-4" /> Export CSV Report
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Enrolled Users', value: data?.totalUsers || 0, icon: Users, color: 'text-brand-500' },
          { label: 'Active Courses', value: data?.totalCourses || 0, icon: BookOpen, color: 'text-accentblue-500' },
          { label: 'Completion Rate', value: `${data?.completionRate || 0}%`, icon: CheckCircle2, color: 'text-emerald-500' },
          { label: 'Avg Quiz Score', value: `${data?.avgQuizScore || 0}%`, icon: Award, color: 'text-brand-500' },
        ].map((kpi) => (
          <div key={kpi.label} className="p-6 rounded-2xl glass-card space-y-2">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
              <span>{kpi.label}</span>
              <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
            </div>
            <div className="text-3xl font-extrabold text-foreground">{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="p-6 rounded-2xl glass-card space-y-4">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-brand-500" /> Course Popularity & Enrollments
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.popularCourses || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="title" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(15,15,15,0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(12px)' }} />
                <Bar dataKey="count" fill="#3B82F6" radius={[8, 8, 0, 0]} name="Enrollments" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-6 rounded-2xl glass-card space-y-4">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Award className="w-4 h-4 text-accentblue-500" /> Quiz Performance Distribution
          </h3>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.scoreDistribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="range"
                >
                  {data?.scoreDistribution?.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'rgba(15,15,15,0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(12px)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
