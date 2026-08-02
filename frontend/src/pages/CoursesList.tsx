import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { BookOpen, Search, Filter, CheckCircle2, PlayCircle, Plus, Sparkles, Layers, Pencil, Trash2, X, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const CoursesList: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [myEnrollments, setMyEnrollments] = useState<Record<string, any>>({});
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; course: any }>({ open: false, course: null });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [coursesRes, enrollRes] = await Promise.all([
        api.get('/api/courses'),
        api.get('/api/enrollments/my-courses'),
      ]);
      setCourses(coursesRes.data);
      const enrollMap: Record<string, any> = {};
      enrollRes.data.forEach((e: any) => { enrollMap[e.course_id] = e; });
      setMyEnrollments(enrollMap);
    } catch (err) {
      console.error('Failed to load courses', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (courseId: string) => {
    try {
      const res = await api.post(`/api/enrollments/courses/${courseId}`);
      setMyEnrollments((prev) => ({ ...prev, [courseId]: res.data }));
    } catch (err) {
      console.error('Enrollment error', err);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.course) return;
    setDeleting(true);
    try {
      await api.delete(`/api/courses/${deleteModal.course.id}`);
      setCourses((prev) => prev.filter((c) => c.id !== deleteModal.course.id));
      setDeleteModal({ open: false, course: null });
    } catch (err) {
      console.error('Delete failed', err);
    } finally {
      setDeleting(false);
    }
  };

  const categories = ['All', ...Array.from(new Set(courses.map((c) => c.category)))];
  const filteredCourses = courses.filter((c) => {
    const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase()) || c.description.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'All' || c.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-badge text-brand-500 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Vantage Learning Workspace</span>
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Enterprise Course Catalog</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Explore curated skill paths for <span className="text-foreground font-semibold">Vantage Demo Corp</span>
          </p>
        </div>
        {(user?.role === 'admin' || user?.role === 'manager') && (
          <Link
            to="/admin/courses/new"
            className="px-5 py-2.5 rounded-xl font-bold bg-brand-500 hover:bg-brand-600 text-white flex items-center gap-2 shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 text-sm transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" /> Create Course
          </Link>
        )}
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-card p-4 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses or topics..."
            className="w-full pl-10 pr-4 py-2 glass-input rounded-xl text-sm text-foreground placeholder-muted-foreground"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
          <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'glass-badge text-brand-500 shadow-sm shadow-brand-500/10'
                  : 'glass-btn text-muted-foreground hover:text-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Course Grid */}
      {loading ? (
        <div className="py-20 text-center text-muted-foreground font-medium">Loading Vantage courses...</div>
      ) : filteredCourses.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground glass-card rounded-2xl">
          No courses matching your criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((c) => {
            const enrollment = myEnrollments[c.id];
            const totalModules = c.modules?.length || 0;
            let totalLessons = 0;
            c.modules?.forEach((m: any) => { totalLessons += m.lessons?.length || 0; });

            return (
              <div key={c.id} className="rounded-2xl glass-card glass-card-hover p-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full glass-badge text-brand-500">
                      {c.category}
                    </span>
                    {enrollment && (
                      <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Enrolled
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground leading-snug line-clamp-2">{c.title}</h3>
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-3 leading-relaxed">{c.description}</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-brand-500" /> {totalModules} Modules
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-brand-500" /> {totalLessons} Lessons
                    </span>
                  </div>
                  {enrollment && (
                    <div className="space-y-1.5 pt-2">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="text-brand-500 font-bold">{enrollment.progress_percent}%</span>
                      </div>
                      <div className="w-full bg-secondary/50 rounded-full h-2 overflow-hidden">
                        <div className="bg-brand-500 h-full rounded-full transition-all duration-500 shadow-sm shadow-brand-500/30" style={{ width: `${enrollment.progress_percent}%` }} />
                      </div>
                    </div>
                  )}
                </div>
                <div className="pt-6 mt-6 space-y-2">
                  {(user?.role === 'admin' || user?.role === 'manager') && (
                    <div className="flex gap-2">
                      <Link
                        to={`/admin/courses/edit/${c.id}`}
                        className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl font-bold glass-btn text-muted-foreground text-xs transition-all"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </Link>
                      {user?.role === 'admin' && (
                        <button
                          onClick={() => setDeleteModal({ open: true, course: c })}
                          className="px-3 py-2 rounded-xl font-bold glass-btn text-destructive hover:bg-destructive/10 text-xs transition-all"
                          title="Delete course"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                  {enrollment ? (
                    <Link
                      to={`/courses/${c.id}`}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold glass-badge text-brand-500 text-xs transition-all hover:shadow-sm hover:shadow-brand-500/10"
                    >
                      <PlayCircle className="w-4 h-4" /> Continue Course
                    </Link>
                  ) : (
                    <button
                      onClick={() => handleEnroll(c.id)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 text-xs transition-all hover:scale-[1.01]"
                    >
                      Enroll Now
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !deleting && setDeleteModal({ open: false, course: null })}
          />

          {/* Modal */}
          <div className="relative glass-panel rounded-3xl p-8 max-w-md w-full space-y-6 animate-in fade-in zoom-in duration-200">
            {/* Close button */}
            <button
              onClick={() => !deleting && setDeleteModal({ open: false, course: null })}
              className="absolute top-4 right-4 p-1 rounded-lg glass-btn text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Warning icon */}
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
            </div>

            {/* Text */}
            <div className="text-center space-y-2">
              <h3 className="text-xl font-extrabold text-foreground">Delete Course?</h3>
              <p className="text-sm text-muted-foreground">
                This will permanently delete <span className="font-bold text-foreground">"{deleteModal.course?.title}"</span> and all its modules, lessons, quizzes, enrollments, and progress. This action cannot be undone.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal({ open: false, course: null })}
                disabled={deleting}
                className="flex-1 py-3 rounded-xl font-bold glass-btn text-muted-foreground text-sm transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-3 rounded-xl font-bold bg-destructive hover:bg-destructive/90 text-white shadow-lg text-sm transition-all disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete Course'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
