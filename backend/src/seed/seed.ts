import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import Redis from 'ioredis';
import { User, UserRole } from '../users/entities/user.entity';
import { Course } from '../courses/entities/course.entity';
import { CourseModule } from '../courses/entities/module.entity';
import { Lesson, LessonContentType } from '../courses/entities/lesson.entity';
import { Quiz } from '../quizzes/entities/quiz.entity';
import { QuizQuestion, QuestionType } from '../quizzes/entities/question.entity';
import { Badge } from '../gamification/entities/badge.entity';
import { UserBadge } from '../gamification/entities/user-badge.entity';
import { Enrollment, EnrollmentStatus } from '../enrollments/entities/enrollment.entity';
import { LessonProgress } from '../enrollments/entities/lesson-progress.entity';
import { Idea, IdeaStatus } from '../social/entities/idea.entity';
import { Comment } from '../social/entities/comment.entity';
import { Reaction } from '../social/entities/reaction.entity';

async function runSeed() {
  console.log('🌱 Starting Vantage LMS Seed Script...');

  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'vantage_lms',
    entities: [User, Course, CourseModule, Lesson, Quiz, QuizQuestion, Badge, UserBadge, Enrollment, LessonProgress, Idea, Comment, Reaction],
    synchronize: true,
  });

  await dataSource.initialize();
  console.log('✅ PostgreSQL connection established.');

  // Clean existing data for idempotency
  await dataSource.query('TRUNCATE TABLE users, courses, modules, lessons, quizzes, quiz_questions, badges, user_badges, enrollments, lesson_progress, ideas, comments RESTART IDENTITY CASCADE;');

  const passwordHash = await bcrypt.hash('Password123!', 10);
  const orgId = 'vantage-demo-corp-id';

  // 1. Seed Users
  const userRepo = dataSource.getRepository(User);
  const admin = await userRepo.save(
    userRepo.create({
      name: 'Alex Rivera',
      email: 'admin@vantage.local',
      password: passwordHash,
      role: UserRole.ADMIN,
      organization_id: orgId,
      points: 450,
    }),
  );

  const manager = await userRepo.save(
    userRepo.create({
      name: 'Sarah Jenkins',
      email: 'manager@vantage.local',
      password: passwordHash,
      role: UserRole.MANAGER,
      organization_id: orgId,
      points: 280,
    }),
  );

  const learner = await userRepo.save(
    userRepo.create({
      name: 'Jordan Lee',
      email: 'learner@vantage.local',
      password: passwordHash,
      role: UserRole.LEARNER,
      organization_id: orgId,
      points: 150,
    }),
  );

  console.log('✅ Seeded 3 default users (admin@vantage.local, manager@vantage.local, learner@vantage.local)');

  // 2. Seed Badges
  const badgeRepo = dataSource.getRepository(Badge);
  const badge1 = await badgeRepo.save(badgeRepo.create({ title: 'First Step', description: 'Earned 50 XP points by completing your first lesson', icon: 'Zap', required_points: 50, category: 'Milestone' }));
  const badge2 = await badgeRepo.save(badgeRepo.create({ title: 'Quiz Master', description: 'Earned 100 XP points by passing a knowledge assessment quiz', icon: 'Award', required_points: 100, category: 'Achievement' }));
  const badge3 = await badgeRepo.save(badgeRepo.create({ title: 'Enterprise Scholar', description: 'Earned 250 XP points in Vantage LMS', icon: 'Shield', required_points: 250, category: 'Leader' }));
  const badge4 = await badgeRepo.save(badgeRepo.create({ title: 'Vantage Pioneer', description: 'Earned 400 XP points in Vantage LMS', icon: 'Crown', required_points: 400, category: 'Master' }));

  const userBadgeRepo = dataSource.getRepository(UserBadge);
  await userBadgeRepo.save([
    userBadgeRepo.create({ user_id: admin.id, badge_id: badge1.id }),
    userBadgeRepo.create({ user_id: admin.id, badge_id: badge2.id }),
    userBadgeRepo.create({ user_id: admin.id, badge_id: badge3.id }),
    userBadgeRepo.create({ user_id: admin.id, badge_id: badge4.id }),
    userBadgeRepo.create({ user_id: manager.id, badge_id: badge1.id }),
    userBadgeRepo.create({ user_id: manager.id, badge_id: badge2.id }),
    userBadgeRepo.create({ user_id: manager.id, badge_id: badge3.id }),
    userBadgeRepo.create({ user_id: learner.id, badge_id: badge1.id }),
    userBadgeRepo.create({ user_id: learner.id, badge_id: badge2.id }),
  ]);

  // 3. Seed Courses, Modules, Lessons, Quizzes
  const courseRepo = dataSource.getRepository(Course);
  const moduleRepo = dataSource.getRepository(CourseModule);
  const lessonRepo = dataSource.getRepository(Lesson);
  const quizRepo = dataSource.getRepository(Quiz);
  const questionRepo = dataSource.getRepository(QuizQuestion);

  // Course 1
  const course1 = await courseRepo.save(
    courseRepo.create({
      title: 'Enterprise Security & Data Protection 2026',
      description: 'Essential cybersecurity protocols, password hygiene, phishing defense, data classification, and incident management for Vantage Demo Corp employees.',
      category: 'Compliance & Security',
      organization_id: orgId,
      created_by: admin.id,
    }),
  );

  const mod1 = await moduleRepo.save(moduleRepo.create({ title: 'Module 1: Cyber Hygiene & Password Security', order: 1, course_id: course1.id }));
  
  const lesson1_1 = await lessonRepo.save(
    lessonRepo.create({
      title: '1. Password Protocols & Multi-Factor Auth',
      content_type: LessonContentType.TEXT,
      content_body: `### Core Security Directives\n1. **Password Complexity**: Minimum 14 characters using a mix of letters, numbers, and special symbols.\n2. **MFA Mandatory**: Every login to internal enterprise portals requires YubiKey or TOTP authenticator confirmation.\n3. **Zero Credential Reuse**: Never reuse corporate passwords across non-approved third-party services.`,
      order: 1,
      duration_minutes: 10,
      module_id: mod1.id,
    }),
  );

  const lesson1_2 = await lessonRepo.save(
    lessonRepo.create({
      title: '2. Spotting & Reporting Phishing Attacks',
      content_type: LessonContentType.TEXT,
      content_body: `### Identifying Phishing Scams\n- **Urgency Signals**: Unexpected emails urging immediate wire transfers or password resets.\n- **Domain Inspection**: Always verify email headers match \`@vantage-democorp.com\` precisely.\n- **Suspicious Attachments**: Do not open executable files (.exe, .scr, .iso) sent via unverified channels.`,
      order: 2,
      duration_minutes: 15,
      module_id: mod1.id,
    }),
  );

  const lesson1_3 = await lessonRepo.save(
    lessonRepo.create({
      title: '3. Security Compliance Quiz',
      content_type: LessonContentType.QUIZ,
      content_body: 'Test your understanding of enterprise security protocols.',
      order: 3,
      duration_minutes: 10,
      module_id: mod1.id,
    }),
  );

  const quiz1 = await quizRepo.save(
    quizRepo.create({
      lesson_id: lesson1_3.id,
      title: 'Security Compliance Assessment',
      passing_score: 70,
    }),
  );

  await questionRepo.save([
    questionRepo.create({
      quiz_id: quiz1.id,
      prompt: 'What is the minimum required password length for Vantage Demo Corp systems?',
      question_type: QuestionType.MULTIPLE_CHOICE,
      options: ['8 characters', '10 characters', '14 characters', '20 characters'],
      correct_answer: '14 characters',
    }),
    questionRepo.create({
      quiz_id: quiz1.id,
      prompt: 'Multi-Factor Authentication (MFA) is optional for remote work.',
      question_type: QuestionType.TRUE_FALSE,
      options: ['True', 'False'],
      correct_answer: 'False',
    }),
    questionRepo.create({
      quiz_id: quiz1.id,
      prompt: 'What action should you take if you receive a suspicious email requesting credential resets?',
      question_type: QuestionType.MULTIPLE_CHOICE,
      options: ['Click the link to check', 'Report to Infosec immediately', 'Forward to colleagues', 'Ignore and delete'],
      correct_answer: 'Report to Infosec immediately',
    }),
  ]);

  // Course 2
  const course2 = await courseRepo.save(
    courseRepo.create({
      title: 'Cloud Infrastructure & Microservices Architecture',
      description: 'Hands-on guide to containerization with Docker, Redis caching strategies, PostgreSQL database design, and resilient Node.js services.',
      category: 'Software Engineering',
      organization_id: orgId,
      created_by: admin.id,
    }),
  );

  const mod2 = await moduleRepo.save(moduleRepo.create({ title: 'Module 1: Container Orchestration with Docker', order: 1, course_id: course2.id }));
  await lessonRepo.save(
    lessonRepo.create({
      title: '1. Docker Compose Essentials',
      content_type: LessonContentType.TEXT,
      content_body: `### Microservice Orchestration\nDocker Compose simplifies running multi-container applications locally. In Vantage LMS, we isolate:\n- \`postgres\` (PostgreSQL 16)\n- \`redis\` (Redis 7 Sorted Sets for real-time leaderboards)\n- \`backend\` (NestJS REST API)\n- \`frontend\` (React + Vite + Tailwind CSS)`,
      order: 1,
      duration_minutes: 20,
      module_id: mod2.id,
    }),
  );

  // 4. Seed Enrollments & Progress
  const enrollRepo = dataSource.getRepository(Enrollment);
  await enrollRepo.save([
    enrollRepo.create({ user_id: admin.id, course_id: course1.id, status: EnrollmentStatus.COMPLETED, progress_percent: 100 }),
    enrollRepo.create({ user_id: manager.id, course_id: course1.id, status: EnrollmentStatus.IN_PROGRESS, progress_percent: 66 }),
    enrollRepo.create({ user_id: learner.id, course_id: course1.id, status: EnrollmentStatus.IN_PROGRESS, progress_percent: 33 }),
    enrollRepo.create({ user_id: learner.id, course_id: course2.id, status: EnrollmentStatus.ENROLLED, progress_percent: 0 }),
  ]);

  // 5. Seed Ideas & Comments
  const ideaRepo = dataSource.getRepository(Idea);
  await ideaRepo.save([
    ideaRepo.create({
      user_id: learner.id,
      title: 'Dark Mode Contrast Options for Accessibility',
      description: 'Would love an ultra high-contrast toggle for code snippets in technical course lessons.',
      status: IdeaStatus.REVIEWED,
      admin_response: 'Great suggestion! The Vantage UX team will incorporate high contrast themes in upcoming release.',
    }),
    ideaRepo.create({
      user_id: manager.id,
      title: 'Automated Certificate Generation upon Course Completion',
      description: 'Allow learners to download a PDF certificate with verification code once they reach 100% completion.',
      status: IdeaStatus.PENDING,
    }),
  ]);

  const commentRepo = dataSource.getRepository(Comment);
  await commentRepo.save([
    commentRepo.create({
      user_id: manager.id,
      lesson_id: lesson1_1.id,
      content: 'Clear and concise guidelines on password length. Shared this with our engineering squad!',
    }),
    commentRepo.create({
      user_id: learner.id,
      lesson_id: lesson1_1.id,
      content: 'Configured YubiKey MFA today. Very straightforward setup.',
    }),
  ]);

  // 6. Sync Redis Leaderboard
  try {
    const redisHost = process.env.REDIS_HOST || 'localhost';
    const redisPort = parseInt(process.env.REDIS_PORT || '6379');
    const redis = new Redis({ host: redisHost, port: redisPort, lazyConnect: true });
    await redis.connect();
    await redis.zadd(`leaderboard:org:${orgId}`, admin.points, admin.id);
    await redis.zadd(`leaderboard:org:${orgId}`, manager.points, manager.id);
    await redis.zadd(`leaderboard:org:${orgId}`, learner.points, learner.id);
    await redis.disconnect();
    console.log('✅ Redis Sorted Set leaderboard synchronized.');
  } catch (err) {
    console.log('⚠️ Redis sync warning (will populate when docker container launches):', (err as Error).message);
  }

  await dataSource.destroy();
  console.log('🎉 Seed script completed successfully!');
}

runSeed().catch((err) => {
  console.error('❌ Seed script error:', err);
  process.exit(1);
});
