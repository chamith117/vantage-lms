import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { CoursesList } from './pages/CoursesList';
import { LessonViewer } from './pages/LessonViewer';
import { AdminCourseEditor } from './pages/AdminCourseEditor';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { IdeaBoxPage } from './pages/IdeaBoxPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ProtectedRoute } from './components/ProtectedRoute';

const AppContent: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-brand-500 selection:text-white">
      <Navbar user={user} onLogout={logout} />

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/courses" element={<CoursesList />} />
            <Route path="/courses/:courseId" element={<LessonViewer />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/ideas" element={<IdeaBoxPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          {/* Manager / Admin Routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin', 'manager']} />}>
            <Route path="/admin/courses/new" element={<AdminCourseEditor />} />
            <Route path="/admin/courses/edit/:courseId" element={<AdminCourseEditor />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer className="bg-card border-t border-border py-8 px-4 text-center text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <span className="font-bold text-foreground">Vantage LMS</span> &copy; {new Date().getFullYear()} Vantage Demo Corp. All rights reserved.
          </div>
          <div>
            "See learning from a new vantage point."
          </div>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;
