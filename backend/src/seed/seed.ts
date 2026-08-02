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

  await lessonRepo.save(
    lessonRepo.create({
      title: '2. Dockerfile Best Practices',
      content_type: LessonContentType.TEXT,
      content_body: `### Writing Efficient Dockerfiles\n- **Multi-stage builds**: Reduce final image size by building in one stage and copying only production artifacts\n- **Layer caching**: Order instructions from least to most frequently changing\n- **Alpine base images**: Use \`node:20-alpine\` for smaller footprint\n- **.dockerignore**: Exclude node_modules, .git, and test files\n- **Non-root user**: Run containers as non-root for security`,
      order: 2,
      duration_minutes: 15,
      module_id: mod2.id,
    }),
  );

  const lesson2_3 = await lessonRepo.save(
    lessonRepo.create({
      title: '3. Docker & DevOps Quiz',
      content_type: LessonContentType.QUIZ,
      content_body: 'Test your knowledge of Docker and DevOps practices.',
      order: 3,
      duration_minutes: 10,
      module_id: mod2.id,
    }),
  );

  const quiz2 = await quizRepo.save(
    quizRepo.create({
      lesson_id: lesson2_3.id,
      title: 'Docker & DevOps Assessment',
      passing_score: 70,
    }),
  );

  await questionRepo.save([
    questionRepo.create({
      quiz_id: quiz2.id,
      prompt: 'What is the purpose of Docker Compose?',
      question_type: QuestionType.MULTIPLE_CHOICE,
      options: ['Run single containers', 'Define and run multi-container applications', 'Manage Kubernetes clusters', 'Monitor container performance'],
      correct_answer: 'Define and run multi-container applications',
    }),
    questionRepo.create({
      quiz_id: quiz2.id,
      prompt: 'Which instruction should come FIRST in a Dockerfile for better layer caching?',
      question_type: QuestionType.MULTIPLE_CHOICE,
      options: ['RUN npm install', 'COPY package.json .', 'FROM node:20-alpine', 'CMD ["node", "dist/main.js"]'],
      correct_answer: 'FROM node:20-alpine',
    }),
    questionRepo.create({
      quiz_id: quiz2.id,
      prompt: 'Multi-stage builds help reduce the final Docker image size.',
      question_type: QuestionType.TRUE_FALSE,
      options: ['True', 'False'],
      correct_answer: 'True',
    }),
    questionRepo.create({
      quiz_id: quiz2.id,
      prompt: 'Which base image is recommended for smaller Docker images?',
      question_type: QuestionType.MULTIPLE_CHOICE,
      options: ['node:20', 'ubuntu:22.04', 'node:20-alpine', 'debian:bullseye'],
      correct_answer: 'node:20-alpine',
    }),
  ]);

  // Course 3 - Leadership
  const course3 = await courseRepo.save(
    courseRepo.create({
      title: 'Management & Leadership Excellence',
      description: 'Build high-performing teams, master delegation, run effective 1:1s, and drive strategic execution.',
      category: 'Management & Leadership',
      organization_id: orgId,
      created_by: admin.id,
    }),
  );

  const mod3 = await moduleRepo.save(moduleRepo.create({ title: 'Module 1: Leadership Foundations', order: 1, course_id: course3.id }));
  await lessonRepo.save(
    lessonRepo.create({
      title: '1. Servant Leadership Model',
      content_type: LessonContentType.TEXT,
      content_body: `### Servant Leadership Principles\n1. **Listening**: Actively listen to team needs\n2. **Empathy**: Understand team members' perspectives\n3. **Healing**: Help teams recover from setbacks\n4. **Awareness**: Be self-aware and situationally aware\n5. **Persuasion**: Influence through collaboration, not authority\n6. **Conceptualization**: Think big picture\n7. **Foresight**: Anticipate future challenges\n8. **Stewardship**: Serve the team and organization\n9. **Commitment to growth**: Invest in people development\n10. **Building community**: Foster belonging`,
      order: 1,
      duration_minutes: 15,
      module_id: mod3.id,
    }),
  );

  await lessonRepo.save(
    lessonRepo.create({
      title: '2. Effective 1:1 Meetings',
      content_type: LessonContentType.TEXT,
      content_body: `### Running Productive 1:1s\n- **Duration**: 30-45 minutes weekly\n- **Format**: Employee-led, not manager-led\n- **Topics**: Career growth, blockers, feedback, wellbeing\n- **Follow-up**: Document action items and follow through\n- **Consistency**: Never cancel 1:1s unless absolutely necessary`,
      order: 2,
      duration_minutes: 12,
      module_id: mod3.id,
    }),
  );

  const lesson3_3 = await lessonRepo.save(
    lessonRepo.create({
      title: '3. Leadership Assessment',
      content_type: LessonContentType.QUIZ,
      content_body: 'Test your leadership knowledge.',
      order: 3,
      duration_minutes: 10,
      module_id: mod3.id,
    }),
  );

  const quiz3 = await quizRepo.save(
    quizRepo.create({
      lesson_id: lesson3_3.id,
      title: 'Leadership Principles Assessment',
      passing_score: 70,
    }),
  );

  await questionRepo.save([
    questionRepo.create({
      quiz_id: quiz3.id,
      prompt: 'In servant leadership, who should lead the 1:1 meeting?',
      question_type: QuestionType.MULTIPLE_CHOICE,
      options: ['The manager', 'The employee', 'HR department', 'It alternates each week'],
      correct_answer: 'The employee',
    }),
    questionRepo.create({
      quiz_id: quiz3.id,
      prompt: 'A servant leader influences through authority and position power.',
      question_type: QuestionType.TRUE_FALSE,
      options: ['True', 'False'],
      correct_answer: 'False',
    }),
    questionRepo.create({
      quiz_id: quiz3.id,
      prompt: 'How often should 1:1 meetings typically occur?',
      question_type: QuestionType.MULTIPLE_CHOICE,
      options: ['Monthly', 'Weekly', 'Bi-weekly', 'Only when needed'],
      correct_answer: 'Weekly',
    }),
  ]);

  // Course 4 - Communication
  const course4 = await courseRepo.save(
    courseRepo.create({
      title: 'Communication & Presentation Skills',
      description: 'Master executive presentations, persuasive writing, active listening, and cross-team communication.',
      category: 'Communication & Soft Skills',
      organization_id: orgId,
      created_by: admin.id,
    }),
  );

  const mod4 = await moduleRepo.save(moduleRepo.create({ title: 'Module 1: Presentation Mastery', order: 1, course_id: course4.id }));
  await lessonRepo.save(
    lessonRepo.create({
      title: '1. Structuring Presentations',
      content_type: LessonContentType.TEXT,
      content_body: `### The PREP Framework\n- **P**oint: State your main point clearly\n- **R**eason: Explain why it matters\n- **E**vidence: Provide data and examples\n- **P**oint: Restate your conclusion\n\nKeep slides visual. One idea per slide. Use the 10-20-30 rule: 10 slides, 20 minutes, 30pt font minimum.`,
      order: 1,
      duration_minutes: 15,
      module_id: mod4.id,
    }),
  );

  const lesson4_2 = await lessonRepo.save(
    lessonRepo.create({
      title: '2. Communication Quiz',
      content_type: LessonContentType.QUIZ,
      content_body: 'Test your communication knowledge.',
      order: 2,
      duration_minutes: 10,
      module_id: mod4.id,
    }),
  );

  const quiz4 = await quizRepo.save(
    quizRepo.create({
      lesson_id: lesson4_2.id,
      title: 'Communication Skills Assessment',
      passing_score: 70,
    }),
  );

  await questionRepo.save([
    questionRepo.create({
      quiz_id: quiz4.id,
      prompt: 'What does PREP stand for in presentation structure?',
      question_type: QuestionType.MULTIPLE_CHOICE,
      options: ['Plan, Research, Execute, Present', 'Point, Reason, Evidence, Point', 'Prepare, Rehearse, Evaluate, Perform', 'Problem, Result, Effect, Proposal'],
      correct_answer: 'Point, Reason, Evidence, Point',
    }),
    questionRepo.create({
      quiz_id: quiz4.id,
      prompt: 'The 10-20-30 rule recommends a minimum font size of 30pt.',
      question_type: QuestionType.TRUE_FALSE,
      options: ['True', 'False'],
      correct_answer: 'True',
    }),
    questionRepo.create({
      quiz_id: quiz4.id,
      prompt: 'How many slides does the 10-20-30 rule recommend?',
      question_type: QuestionType.MULTIPLE_CHOICE,
      options: ['5 slides', '10 slides', '15 slides', '20 slides'],
      correct_answer: '10 slides',
    }),
  ]);

  // Course 5 - Project Management
  const course5 = await courseRepo.save(
    courseRepo.create({
      title: 'Agile Project Management & Scrum',
      description: 'Scrum framework, sprint planning, backlog grooming, velocity tracking, and agile team ceremonies.',
      category: 'Project Management',
      organization_id: orgId,
      created_by: admin.id,
    }),
  );

  const mod5 = await moduleRepo.save(moduleRepo.create({ title: 'Module 1: Scrum Framework', order: 1, course_id: course5.id }));
  await lessonRepo.save(
    lessonRepo.create({
      title: '1. Scrum Roles & Ceremonies',
      content_type: LessonContentType.TEXT,
      content_body: `### Scrum Roles\n- **Product Owner**: Owns the backlog, defines priorities\n- **Scrum Master**: Facilitates ceremonies, removes blockers\n- **Development Team**: Self-organizing, cross-functional\n\n### Ceremonies\n1. **Sprint Planning** - Define sprint goal and select items\n2. **Daily Standup** - 15-min sync (what I did, what I'll do, blockers)\n3. **Sprint Review** - Demo completed work\n4. **Sprint Retrospective** - Process improvement`,
      order: 1,
      duration_minutes: 18,
      module_id: mod5.id,
    }),
  );

  const lesson5_2 = await lessonRepo.save(
    lessonRepo.create({
      title: '2. Scrum Assessment',
      content_type: LessonContentType.QUIZ,
      content_body: 'Test your Scrum knowledge.',
      order: 2,
      duration_minutes: 10,
      module_id: mod5.id,
    }),
  );

  const quiz5 = await quizRepo.save(
    quizRepo.create({
      lesson_id: lesson5_2.id,
      title: 'Scrum Framework Assessment',
      passing_score: 70,
    }),
  );

  await questionRepo.save([
    questionRepo.create({
      quiz_id: quiz5.id,
      prompt: 'Who is responsible for prioritizing the product backlog?',
      question_type: QuestionType.MULTIPLE_CHOICE,
      options: ['Scrum Master', 'Development Team', 'Product Owner', 'Project Manager'],
      correct_answer: 'Product Owner',
    }),
    questionRepo.create({
      quiz_id: quiz5.id,
      prompt: 'A daily standup meeting should last 30-60 minutes.',
      question_type: QuestionType.TRUE_FALSE,
      options: ['True', 'False'],
      correct_answer: 'False',
    }),
    questionRepo.create({
      quiz_id: quiz5.id,
      prompt: 'Which ceremony is used to inspect and adapt the process?',
      question_type: QuestionType.MULTIPLE_CHOICE,
      options: ['Sprint Planning', 'Daily Standup', 'Sprint Review', 'Sprint Retrospective'],
      correct_answer: 'Sprint Retrospective',
    }),
    questionRepo.create({
      quiz_id: quiz5.id,
      prompt: 'Who facilitates Scrum ceremonies?',
      question_type: QuestionType.MULTIPLE_CHOICE,
      options: ['Product Owner', 'Scrum Master', 'Team Lead', 'Project Manager'],
      correct_answer: 'Scrum Master',
    }),
  ]);

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
