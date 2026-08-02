const request = require('supertest');
const BASE = 'http://localhost:4000';

let adminToken: string;
let learnerToken: string;
let courseId: string;
let quizLessonId: string;
let quizId: string;
let commentId: string;

describe('Vantage LMS API (e2e)', () => {
  // ===== HEALTH =====
  describe('Health', () => {
    it('GET /api/health', async () => {
      const res = await request(BASE).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.service).toContain('Vantage');
    });
  });

  // ===== AUTH =====
  describe('Auth', () => {
    it('POST /api/auth/login - valid admin', async () => {
      const res = await request(BASE)
        .post('/api/auth/login')
        .send({ email: 'admin@vantage.local', password: 'Password123!' });
      expect(res.status).toBe(201);
      expect(res.body.access_token).toBeDefined();
      expect(res.body.user.email).toBe('admin@vantage.local');
      expect(res.body.user).not.toHaveProperty('password');
      adminToken = res.body.access_token;
    });

    it('POST /api/auth/login - valid learner', async () => {
      const res = await request(BASE)
        .post('/api/auth/login')
        .send({ email: 'learner@vantage.local', password: 'Password123!' });
      expect(res.status).toBe(201);
      expect(res.body.access_token).toBeDefined();
      learnerToken = res.body.access_token;
    });

    it('POST /api/auth/login - invalid password', async () => {
      const res = await request(BASE)
        .post('/api/auth/login')
        .send({ email: 'admin@vantage.local', password: 'wrong' });
      expect(res.status).toBe(401);
    });

    it('POST /api/auth/login - nonexistent email', async () => {
      const res = await request(BASE)
        .post('/api/auth/login')
        .send({ email: 'nope@example.com', password: 'Password123!' });
      expect(res.status).toBe(401);
    });

    it('POST /api/auth/register - new user', async () => {
      const res = await request(BASE)
        .post('/api/auth/register')
        .send({
          name: 'E2E Test User',
          email: `e2e_${Date.now()}@test.com`,
          password: 'Password123!',
        });
      expect(res.status).toBe(201);
      expect(res.body.access_token).toBeDefined();
    });

    it('POST /api/auth/register - duplicate email', async () => {
      const res = await request(BASE)
        .post('/api/auth/register')
        .send({ name: 'Dup', email: 'admin@vantage.local', password: 'Password123!' });
      expect(res.status).toBe(409);
    });

    it('GET /api/auth/me - with token', async () => {
      const res = await request(BASE)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.email).toBe('admin@vantage.local');
    });

    it('GET /api/auth/me - without token', async () => {
      const res = await request(BASE).get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });

  // ===== COURSES =====
  describe('Courses', () => {
    it('GET /api/courses - list all', async () => {
      const res = await request(BASE)
        .get('/api/courses')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(2);

      // Find the course with a quiz lesson
      for (const course of res.body) {
        for (const mod of course.modules || []) {
          for (const lesson of mod.lessons || []) {
            if (lesson.content_type === 'quiz') {
              courseId = course.id;
              quizLessonId = lesson.id;
              break;
            }
          }
          if (quizLessonId) break;
        }
        if (quizLessonId) break;
      }
      // Fallback to first course if no quiz found
      if (!courseId) courseId = res.body[0].id;
    });

    it('GET /api/courses - learner can list', async () => {
      const res = await request(BASE)
        .get('/api/courses')
        .set('Authorization', `Bearer ${learnerToken}`);
      expect(res.status).toBe(200);
    });

    it('GET /api/courses/:id - single course', async () => {
      const res = await request(BASE)
        .get(`/api/courses/${courseId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(courseId);
      expect(res.body.modules).toBeDefined();
    });

    it('POST /api/courses - admin creates course', async () => {
      const res = await request(BASE)
        .post('/api/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'E2E Test Course', description: 'Created by e2e test', category: 'Testing' });
      expect(res.status).toBe(201);
      expect(res.body.title).toBe('E2E Test Course');
    });

    it('POST /api/courses - learner forbidden', async () => {
      const res = await request(BASE)
        .post('/api/courses')
        .set('Authorization', `Bearer ${learnerToken}`)
        .send({ title: 'Fail', description: 'X' });
      expect(res.status).toBe(403);
    });

    it('POST /api/courses - without auth', async () => {
      const res = await request(BASE).post('/api/courses').send({ title: 'Fail', description: 'X' });
      expect(res.status).toBe(401);
    });
  });

  // ===== ENROLLMENTS =====
  describe('Enrollments', () => {
    it('POST /api/enrollments/courses/:courseId - enroll', async () => {
      const res = await request(BASE)
        .post(`/api/enrollments/courses/${courseId}`)
        .set('Authorization', `Bearer ${learnerToken}`);
      expect([201, 200]).toContain(res.status);
      expect(res.body.status).toBeDefined();
    });

    it('GET /api/enrollments/my-courses', async () => {
      const res = await request(BASE)
        .get('/api/enrollments/my-courses')
        .set('Authorization', `Bearer ${learnerToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('GET /api/enrollments/courses/:courseId/progress', async () => {
      const res = await request(BASE)
        .get(`/api/enrollments/courses/${courseId}/progress`)
        .set('Authorization', `Bearer ${learnerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.completedLessonIds).toBeDefined();
    });
  });

  // ===== COURSE MANAGEMENT =====
  describe('Course Management (Modules & Lessons)', () => {
    let newCourseId: string;
    let moduleId: string;

    beforeAll(async () => {
      const courseRes = await request(BASE)
        .post('/api/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Module/Lesson Test Course', description: 'Testing', category: 'Testing' });
      newCourseId = courseRes.body.id;
    });

    it('POST /api/courses/:id/modules - add module', async () => {
      const res = await request(BASE)
        .post(`/api/courses/${newCourseId}/modules`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Test Module', order: 1 });
      expect(res.status).toBe(201);
      expect(res.body.title).toBe('Test Module');
      moduleId = res.body.id;
    });

    it('POST /api/courses/modules/:moduleId/lessons - add lesson', async () => {
      const res = await request(BASE)
        .post(`/api/courses/modules/${moduleId}/lessons`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Test Lesson', content_type: 'text', content_body: 'Content', order: 1, duration_minutes: 10 });
      expect(res.status).toBe(201);
      expect(res.body.title).toBe('Test Lesson');
    });
  });

  // ===== QUIZZES =====
  describe('Quizzes', () => {
    it('GET /api/quizzes/lesson/:lessonId - get quiz', async () => {
      if (!quizLessonId) {
        console.warn('Skipping: no quiz lesson found in seed data');
        return;
      }
      const res = await request(BASE)
        .get(`/api/quizzes/lesson/${quizLessonId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.questions).toBeDefined();
      quizId = res.body.id;
    });

    it('POST /api/quizzes/:id/submit - submit answers (pass)', async () => {
      if (!quizId) {
        console.warn('Skipping: no quiz ID available');
        return;
      }
      const quizRes = await request(BASE)
        .get(`/api/quizzes/lesson/${quizLessonId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      const questions = quizRes.body.questions;
      const answers: Record<string, string> = {};
      questions.forEach((q: any) => { answers[q.id] = q.correct_answer; });

      const res = await request(BASE)
        .post(`/api/quizzes/${quizRes.body.id}/submit`)
        .set('Authorization', `Bearer ${learnerToken}`)
        .send({ answers });
      expect(res.status).toBe(201);
      expect(res.body.passed).toBe(true);
      expect(res.body.score).toBe(100);
    });

    it('POST /api/quizzes/:id/submit - wrong answers (fail)', async () => {
      if (!quizId) {
        console.warn('Skipping: no quiz ID available');
        return;
      }
      const quizRes = await request(BASE)
        .get(`/api/quizzes/lesson/${quizLessonId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      const questions = quizRes.body.questions;
      const answers: Record<string, string> = {};
      questions.forEach((q: any) => { answers[q.id] = 'Wrong'; });

      const res = await request(BASE)
        .post(`/api/quizzes/${quizRes.body.id}/submit`)
        .set('Authorization', `Bearer ${learnerToken}`)
        .send({ answers });
      expect(res.status).toBe(201);
      expect(res.body.passed).toBe(false);
    });

    it('GET /api/quizzes/:id/my-attempts', async () => {
      if (!quizId) {
        console.warn('Skipping: no quiz ID available');
        return;
      }
      const res = await request(BASE)
        .get(`/api/quizzes/${quizId}/my-attempts`)
        .set('Authorization', `Bearer ${learnerToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ===== GAMIFICATION =====
  describe('Gamification', () => {
    it('GET /api/gamification/leaderboard', async () => {
      const res = await request(BASE)
        .get('/api/gamification/leaderboard')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0].rank).toBe(1);
    });

    it('GET /api/gamification/badges', async () => {
      const res = await request(BASE)
        .get('/api/gamification/badges')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThanOrEqual(4);
    });

    it('GET /api/gamification/my-badges', async () => {
      const res = await request(BASE)
        .get('/api/gamification/my-badges')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ===== SOCIAL =====
  describe('Social', () => {
    let socialLessonId: string;

    beforeAll(async () => {
      // Find first text lesson from enrolled course
      const coursesRes = await request(BASE)
        .get('/api/courses')
        .set('Authorization', `Bearer ${adminToken}`);
      for (const course of coursesRes.body) {
        for (const mod of course.modules || []) {
          for (const lesson of mod.lessons || []) {
            if (lesson.content_type === 'text') {
              socialLessonId = lesson.id;
              break;
            }
          }
          if (socialLessonId) break;
        }
        if (socialLessonId) break;
      }
    });

    it('POST /api/social/lessons/:lessonId/comments - add comment', async () => {
      if (!socialLessonId) {
        console.warn('Skipping: no text lesson found');
        return;
      }
      const res = await request(BASE)
        .post(`/api/social/lessons/${socialLessonId}/comments`)
        .set('Authorization', `Bearer ${learnerToken}`)
        .send({ content: 'E2E test comment' });
      expect(res.status).toBe(201);
      expect(res.body.comment.content).toBe('E2E test comment');
      commentId = res.body.comment.id;
    });

    it('GET /api/social/lessons/:lessonId/comments', async () => {
      if (!socialLessonId) {
        console.warn('Skipping: no text lesson found');
        return;
      }
      const res = await request(BASE)
        .get(`/api/social/lessons/${socialLessonId}/comments`)
        .set('Authorization', `Bearer ${learnerToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('POST /api/social/comments/:commentId/reactions - toggle on', async () => {
      if (!commentId) {
        console.warn('Skipping: no comment ID available');
        return;
      }
      const res = await request(BASE)
        .post(`/api/social/comments/${commentId}/reactions`)
        .set('Authorization', `Bearer ${learnerToken}`)
        .send({ emoji: '👍' });
      expect(res.status).toBe(201);
      expect(res.body.action).toBe('added');
    });

    it('POST /api/social/comments/:commentId/reactions - toggle off', async () => {
      if (!commentId) {
        console.warn('Skipping: no comment ID available');
        return;
      }
      const res = await request(BASE)
        .post(`/api/social/comments/${commentId}/reactions`)
        .set('Authorization', `Bearer ${learnerToken}`)
        .send({ emoji: '👍' });
      expect(res.status).toBe(201);
      expect(res.body.action).toBe('removed');
    });

    it('POST /api/social/ideas - create idea', async () => {
      const res = await request(BASE)
        .post('/api/social/ideas')
        .set('Authorization', `Bearer ${learnerToken}`)
        .send({ title: 'E2E Idea', description: 'An idea from e2e test' });
      expect(res.status).toBe(201);
      expect(res.body.status).toBe('pending');
    });

    it('GET /api/social/ideas', async () => {
      const res = await request(BASE)
        .get('/api/social/ideas')
        .set('Authorization', `Bearer ${learnerToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('PUT /api/social/ideas/:id - update idea (admin)', async () => {
      const ideasRes = await request(BASE)
        .get('/api/social/ideas')
        .set('Authorization', `Bearer ${adminToken}`);
      const pendingIdea = ideasRes.body.find((i: any) => i.status === 'pending');
      if (pendingIdea) {
        const res = await request(BASE)
          .put(`/api/social/ideas/${pendingIdea.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ status: 'reviewed', admin_response: 'Looks good!' });
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('reviewed');
      }
    });
  });

  // ===== ANALYTICS =====
  describe('Analytics', () => {
    it('GET /api/analytics/dashboard - admin', async () => {
      const res = await request(BASE)
        .get('/api/analytics/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.totalUsers).toBeGreaterThanOrEqual(3);
      expect(res.body.totalCourses).toBeGreaterThanOrEqual(2);
      expect(res.body.popularCourses).toBeDefined();
    });

    it('GET /api/analytics/dashboard - learner forbidden', async () => {
      const res = await request(BASE)
        .get('/api/analytics/dashboard')
        .set('Authorization', `Bearer ${learnerToken}`);
      expect(res.status).toBe(403);
    });

    it('GET /api/analytics/export-csv - admin', async () => {
      const res = await request(BASE)
        .get('/api/analytics/export-csv')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text).toContain('Report Type');
    });
  });

  // ===== EDGE CASES =====
  describe('Edge Cases', () => {
    it('GET /api/courses/:id - nonexistent course', async () => {
      const res = await request(BASE)
        .get('/api/courses/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });

    it('GET /api/quizzes/lesson/:id - nonexistent lesson quiz', async () => {
      const res = await request(BASE)
        .get('/api/quizzes/lesson/nonexistent')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });

    it('POST /api/auth/register - short password', async () => {
      const res = await request(BASE)
        .post('/api/auth/register')
        .send({ name: 'X', email: 'x@x.com', password: '123' });
      expect(res.status).toBe(400);
    });

    it('POST /api/auth/register - invalid email', async () => {
      const res = await request(BASE)
        .post('/api/auth/register')
        .send({ name: 'X', email: 'not-an-email', password: 'Password123!' });
      expect(res.status).toBe(400);
    });

    it('DELETE /api/courses/:id - learner forbidden', async () => {
      const res = await request(BASE)
        .delete(`/api/courses/${courseId}`)
        .set('Authorization', `Bearer ${learnerToken}`);
      expect(res.status).toBe(403);
    });
  });
});
