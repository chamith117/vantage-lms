import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { CheckCircle2, Circle, FileText, Video, HelpCircle, ArrowLeft, Link2, PlayCircle } from 'lucide-react';
import { QuizRunner } from '../components/QuizRunner';
import { CommentSection } from '../components/CommentSection';
import confetti from 'canvas-confetti';

function extractYouTubeId(url: string): string {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : '';
}

function isYouTubeUrl(url: string): boolean {
  return url.includes('youtube.com') || url.includes('youtu.be');
}

function VideoEmbed({ url }: { url: string }) {
  if (isYouTubeUrl(url)) {
    const id = extractYouTubeId(url);
    if (!id) return null;
    return (
      <div className="rounded-xl overflow-hidden border border-border/50 bg-black aspect-video">
        <iframe
          src={`https://www.youtube.com/embed/${id}`}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Video lesson"
        />
      </div>
    );
  }
  return (
    <div className="rounded-xl overflow-hidden border border-border/50 bg-black aspect-video">
      <video src={url} controls className="w-full h-full object-contain" />
    </div>
  );
}

export const LessonViewer: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<any>(null);
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [quizData, setQuizData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (courseId) fetchCourseAndProgress();
  }, [courseId]);

  const fetchCourseAndProgress = async () => {
    try {
      const [cRes, pRes] = await Promise.all([
        api.get(`/api/courses/${courseId}`),
        api.get(`/api/enrollments/courses/${courseId}/progress`),
      ]);
      setCourse(cRes.data);
      setCompletedLessonIds(pRes.data.completedLessonIds || []);
      if (cRes.data.modules?.length > 0 && cRes.data.modules[0].lessons?.length > 0) {
        selectLesson(cRes.data.modules[0].lessons[0]);
      }
    } catch (err) {
      console.error('Failed to load course viewer', err);
    } finally {
      setLoading(false);
    }
  };

  const selectLesson = async (lesson: any) => {
    setActiveLesson(lesson);
    setQuizData(null);
    if (lesson.content_type === 'quiz') {
      try {
        const qRes = await api.get(`/api/quizzes/lesson/${lesson.id}`);
        setQuizData(qRes.data);
      } catch (err) {
        console.error('Failed to load quiz', err);
      }
    }
  };

  const handleToggleComplete = async (lessonId: string) => {
    try {
      const res = await api.post(`/api/enrollments/lessons/${lessonId}/complete`);
      if (res.data.newlyCompleted) {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      }
      fetchCourseAndProgress();
    } catch (err) {
      console.error('Error completing lesson', err);
    }
  };

  if (loading) return <div className="py-20 text-center text-muted-foreground font-medium">Loading Vantage learning environment...</div>;
  if (!course) return <div className="py-20 text-center text-muted-foreground">Course not found.</div>;

  const isCompleted = activeLesson && completedLessonIds.includes(activeLesson.id);
  const hasVideoUrl = activeLesson?.video_url;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between pb-4">
        <Link to="/courses" className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-brand-500 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Catalog
        </Link>
        <span className="text-xs font-semibold text-brand-500 glass-badge px-3 py-1">
          {course.category}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1 glass-card p-4 rounded-2xl space-y-4 h-fit">
          <div className="border-b border-border/50 pb-3">
            <h2 className="text-sm font-bold text-foreground leading-tight">{course.title}</h2>
            <p className="text-[11px] text-muted-foreground mt-1">Course Content Syllabus</p>
          </div>

          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            {course.modules?.map((mod: any) => (
              <div key={mod.id} className="space-y-2">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{mod.title}</div>
                <div className="space-y-1">
                  {mod.lessons?.map((l: any) => {
                    const lCompleted = completedLessonIds.includes(l.id);
                    const isActive = activeLesson?.id === l.id;
                    return (
                      <button
                        key={l.id}
                        onClick={() => selectLesson(l)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-medium transition-all ${
                          isActive ? 'glass-badge text-brand-500' : 'glass-btn text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {l.content_type === 'quiz' ? <HelpCircle className="w-3.5 h-3.5 text-brand-500 shrink-0" /> :
                           l.content_type === 'url' ? <Link2 className="w-3.5 h-3.5 text-accentblue-500 shrink-0" /> :
                           l.content_type === 'video' ? <Video className="w-3.5 h-3.5 text-accentblue-500 shrink-0" /> :
                           <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                          <span className="truncate">{l.title}</span>
                        </div>
                        {lCompleted ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> :
                         <Circle className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {activeLesson ? (
            <div className="glass-card p-6 sm:p-8 rounded-2xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Lesson {activeLesson.order} &bull; {activeLesson.duration_minutes} min
                    </span>
                    {(activeLesson.content_type === 'url' || activeLesson.content_type === 'video') && activeLesson.video_url && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full glass-badge text-accentblue-500 font-semibold flex items-center gap-1">
                        <PlayCircle className="w-3 h-3" /> Video
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl font-extrabold text-foreground mt-1">{activeLesson.title}</h1>
                </div>
                <button
                  onClick={() => handleToggleComplete(activeLesson.id)}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                    isCompleted
                      ? 'glass-badge text-emerald-500'
                      : 'bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isCompleted ? 'Completed (+50 XP)' : 'Mark Completed (+50 XP)'}
                </button>
              </div>

              {activeLesson.content_type === 'quiz' ? (
                quizData ? (
                  <QuizRunner quiz={quizData} onQuizPassed={() => handleToggleComplete(activeLesson.id)} />
                ) : (
                  <div className="p-8 text-center text-muted-foreground font-medium">Loading Quiz...</div>
                )
              ) : (
                <div className="space-y-6 text-foreground">
                  {/* Video / URL Embed */}
                  {hasVideoUrl && (
                    <VideoEmbed url={activeLesson.video_url} />
                  )}

                  {/* File Attachment */}
                  {activeLesson.file_url && (
                    <div className="p-4 rounded-xl glass-btn flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-brand-500" />
                        <div>
                          <div className="text-xs font-bold text-foreground">Attached Learning Resource</div>
                          <div className="text-[10px] text-muted-foreground">{activeLesson.file_url}</div>
                        </div>
                      </div>
                      <a
                        href={activeLesson.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg glass-badge text-brand-500 text-xs font-bold hover:bg-brand-500/15 transition-colors"
                      >
                        Download / View
                      </a>
                    </div>
                  )}

                  {/* Body Text */}
                  <div className="prose prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap font-normal">
                    {activeLesson.content_body || 'No textual content provided for this lesson module.'}
                  </div>
                </div>
              )}

              <CommentSection lessonId={activeLesson.id} />
            </div>
          ) : (
            <div className="glass-card p-12 text-center text-muted-foreground rounded-2xl">
              Select a lesson from the syllabus to start learning.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
