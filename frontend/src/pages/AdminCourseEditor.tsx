import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { Upload, Layers, FileText, ArrowLeft, Pencil, Link2, PlayCircle } from 'lucide-react';

export const AdminCourseEditor: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const isEditMode = Boolean(courseId);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Compliance & Security');
  const [loading, setLoading] = useState(false);
  const [createdCourse, setCreatedCourse] = useState<any>(null);

  const [moduleTitle, setModuleTitle] = useState('');
  const [lessonTitle, setLessonTitle] = useState('');
  const [contentType, setContentType] = useState<'text' | 'video' | 'pdf' | 'quiz' | 'url'>('text');
  const [contentBody, setContentBody] = useState('');
  const [uploadedFileUrl, setUploadedFileUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (courseId) {
      api.get(`/api/courses/${courseId}`).then((res) => {
        const course = res.data;
        setTitle(course.title);
        setDescription(course.description);
        setCategory(course.category);
        setCreatedCourse(course);
      }).catch(() => navigate('/courses'));
    }
  }, [courseId]);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEditMode && courseId) {
        const res = await api.put(`/api/courses/${courseId}`, { title, description, category });
        setCreatedCourse(res.data);
      } else {
        const res = await api.post('/api/courses', { title, description, category });
        setCreatedCourse(res.data);
      }
    } catch (err) {
      console.error('Course save error', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post('/api/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadedFileUrl(res.data.url);
    } catch (err) {
      console.error('File upload error', err);
    } finally {
      setUploading(false);
    }
  };

  const handleAddModule = async () => {
    if (!moduleTitle.trim() || !createdCourse) return;
    try {
      await api.post(`/api/courses/${createdCourse.id}/modules`, {
        title: moduleTitle,
        order: (createdCourse.modules?.length || 0) + 1,
      });
      const refreshRes = await api.get(`/api/courses/${createdCourse.id}`);
      setCreatedCourse(refreshRes.data);
      setModuleTitle('');
    } catch (err) {
      console.error('Add module error', err);
    }
  };

  const handleAddLesson = async (moduleId: string) => {
    if (!lessonTitle.trim()) return;
    try {
      await api.post(`/api/courses/modules/${moduleId}/lessons`, {
        title: lessonTitle,
        content_type: contentType,
        content_body: contentBody,
        file_url: uploadedFileUrl || null,
        video_url: videoUrl || null,
        order: 1,
        duration_minutes: 15,
      });
      const refreshRes = await api.get(`/api/courses/${createdCourse.id}`);
      setCreatedCourse(refreshRes.data);
      setLessonTitle('');
      setContentBody('');
      setUploadedFileUrl('');
      setVideoUrl('');
    } catch (err) {
      console.error('Add lesson error', err);
    }
  };

  const showUrlInput = contentType === 'url' || contentType === 'video';
  const isYouTube = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      <div className="flex items-center justify-between pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">
            {isEditMode ? 'Edit Course' : 'Vantage Course Studio'}
          </h1>
          <p className="text-xs text-muted-foreground">
            {isEditMode ? 'Update course details and manage modules' : 'Design and publish enterprise learning pathways'}
          </p>
        </div>
        <button
          onClick={() => navigate('/courses')}
          className="px-4 py-2 rounded-xl text-xs font-semibold glass-btn text-muted-foreground hover:text-foreground flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Catalog
        </button>
      </div>

      {!createdCourse ? (
        <form onSubmit={handleCreateCourse} className="glass-card p-8 rounded-2xl space-y-6">
          <h2 className="text-lg font-bold text-foreground border-b border-border/50 pb-3">
            {isEditMode ? 'Update Course Details' : 'Step 1: Course Overview'}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Course Title</label>
              <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Advanced Cybersecurity & Risk Governance 2026" className="w-full px-4 py-2.5 glass-input rounded-xl text-sm text-foreground" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-2.5 glass-input rounded-xl text-sm text-foreground">
                <option value="Compliance & Security">Compliance & Security</option>
                <option value="Software Engineering">Software Engineering</option>
                <option value="Management & Leadership">Management & Leadership</option>
                <option value="Design & UX">Design & UX</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Description</label>
              <textarea rows={4} required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detailed summary of competencies, target audience, and enterprise objectives..." className="w-full px-4 py-2.5 glass-input rounded-xl text-sm text-foreground resize-none" />
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full py-3 rounded-xl font-bold bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 text-sm transition-all flex items-center justify-center gap-2">
            {loading ? (isEditMode ? 'Saving Changes...' : 'Creating Draft...') : (isEditMode ? 'Save Changes' : 'Create Course & Proceed to Modules')}
          </button>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl glass-badge text-emerald-500 text-xs flex items-center justify-between">
            <span className="font-bold">Course: "{createdCourse.title}"</span>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase glass-badge">
              {isEditMode ? 'Editing' : 'Draft Active'}
            </span>
          </div>

          {!isEditMode && (
            <div className="glass-card p-4 rounded-2xl space-y-2">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Pencil className="w-4 h-4 text-brand-500" /> Edit Course Details
              </h3>
              <p className="text-xs text-muted-foreground">Update the title, description, or category below.</p>
              <div className="space-y-3">
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Course Title" className="w-full px-4 py-2 glass-input rounded-xl text-sm text-foreground" />
                <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" className="w-full px-4 py-2 glass-input rounded-xl text-sm text-foreground" />
                <button onClick={handleCreateCourse} className="px-4 py-2 rounded-xl font-bold glass-badge text-brand-500 text-xs hover:bg-brand-500/15 transition-all">
                  Update Details
                </button>
              </div>
            </div>
          )}

          {/* Module Creator */}
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Layers className="w-5 h-5 text-brand-500" /> Add Syllabus Module
            </h3>
            <div className="flex gap-2">
              <input type="text" value={moduleTitle} onChange={(e) => setModuleTitle(e.target.value)} placeholder="e.g. Module 1: System Security Architecture" className="flex-1 px-4 py-2 glass-input rounded-xl text-sm text-foreground" />
              <button onClick={handleAddModule} className="px-5 py-2 rounded-xl font-bold glass-badge text-brand-500 text-xs hover:bg-brand-500/15 transition-all">
                + Add Module
              </button>
            </div>
          </div>

          {/* Modules & Lessons */}
          {createdCourse.modules?.map((mod: any) => (
            <div key={mod.id} className="p-6 glass-card rounded-2xl space-y-4">
              <div className="font-bold text-foreground text-sm border-b border-border/50 pb-2">{mod.title}</div>

              {mod.lessons?.length > 0 && (
                <div className="space-y-2">
                  {mod.lessons.map((lesson: any) => (
                    <div key={lesson.id} className="flex items-center justify-between px-3 py-2 glass-btn rounded-xl">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {lesson.content_type === 'url' || lesson.content_type === 'video' ? (
                          <PlayCircle className="w-3.5 h-3.5 text-accentblue-500" />
                        ) : lesson.content_type === 'quiz' ? (
                          <span className="w-3.5 h-3.5 text-brand-500">&#x2753;</span>
                        ) : (
                          <FileText className="w-3.5 h-3.5 text-brand-500" />
                        )}
                        {lesson.title}
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full glass-badge text-muted-foreground uppercase">{lesson.content_type}</span>
                        {lesson.video_url && (
                          <span className="text-[10px] text-accentblue-500 truncate max-w-[120px]">{lesson.video_url}</span>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground">{lesson.duration_minutes}min</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="p-4 glass-panel rounded-xl space-y-3">
                <div className="text-xs font-semibold text-muted-foreground">Add Lesson to {mod.title}</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input type="text" value={lessonTitle} onChange={(e) => setLessonTitle(e.target.value)} placeholder="Lesson Title" className="px-3 py-2 glass-input rounded-xl text-xs text-foreground" />
                  <select value={contentType} onChange={(e: any) => { setContentType(e.target.value); setVideoUrl(''); setUploadedFileUrl(''); }} className="px-3 py-2 glass-input rounded-xl text-xs text-foreground">
                    <option value="text">Text Document</option>
                    <option value="video">Video Lecture</option>
                    <option value="pdf">PDF Manual</option>
                    <option value="quiz">Interactive Quiz</option>
                    <option value="url">YouTube / URL Embed</option>
                  </select>
                </div>

                {/* URL / Video URL Input */}
                {showUrlInput && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Link2 className="w-3.5 h-3.5 text-accentblue-500" />
                      {contentType === 'url' ? 'Paste YouTube or any video URL' : 'Video URL (YouTube or direct link)'}
                    </div>
                    <input
                      type="url"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/..."
                      className="w-full px-4 py-2.5 glass-input rounded-xl text-sm text-foreground placeholder-muted-foreground"
                    />
                    {videoUrl && (
                      <div className="rounded-xl overflow-hidden border border-border/50 bg-black aspect-video">
                        {isYouTube ? (
                          <iframe
                            src={`https://www.youtube.com/embed/${extractYouTubeId(videoUrl)}`}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title="YouTube preview"
                          />
                        ) : (
                          <video src={videoUrl} controls className="w-full h-full object-contain" />
                        )}
                      </div>
                    )}
                  </div>
                )}

                <textarea rows={3} value={contentBody} onChange={(e) => setContentBody(e.target.value)} placeholder="Lesson body text or markdown content..." className="w-full p-3 glass-input rounded-xl text-xs text-foreground resize-none" />

                <div className="flex items-center gap-3">
                  <label className="px-4 py-2 rounded-xl glass-badge text-brand-500 text-xs font-semibold cursor-pointer hover:bg-brand-500/15 transition-all flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    {uploading ? 'Uploading...' : 'Attach PDF/Media File'}
                    <input type="file" onChange={handleFileUpload} className="hidden" />
                  </label>
                  {uploadedFileUrl && (
                    <span className="text-[11px] text-emerald-500 font-medium truncate">File: {uploadedFileUrl}</span>
                  )}
                </div>

                <button type="button" onClick={() => handleAddLesson(mod.id)} className="px-4 py-2 rounded-xl font-bold bg-brand-500 hover:bg-brand-600 text-white text-xs shadow-lg shadow-brand-500/25 transition-all">
                  Save Lesson
                </button>
              </div>
            </div>
          ))}

          <button onClick={() => navigate('/courses')} className="w-full py-3 rounded-xl font-bold bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 text-sm transition-all">
            Finish & View in Catalog
          </button>
        </div>
      )}
    </div>
  );
};

function extractYouTubeId(url: string): string {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : '';
}
