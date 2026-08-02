import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Course } from '../courses/entities/course.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { QuizAttempt } from '../quizzes/entities/quiz-attempt.entity';

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService;
  let mockUserRepo: any;
  let mockCourseRepo: any;
  let mockEnrollRepo: any;
  let mockAttemptRepo: any;

  beforeEach(async () => {
    mockUserRepo = { count: jest.fn().mockResolvedValue(3) };
    mockCourseRepo = { count: jest.fn().mockResolvedValue(2) };
    mockEnrollRepo = {
      count: jest.fn().mockResolvedValue(4),
      find: jest.fn().mockResolvedValue([
        { progress_percent: 100, course_id: 'c1', user: { name: 'A', email: 'a@t.com' }, course: { title: 'C1' }, enrolled_at: new Date() },
        { progress_percent: 50, course_id: 'c1', user: { name: 'B', email: 'b@t.com' }, course: { title: 'C1' }, enrolled_at: new Date() },
        { progress_percent: 0, course_id: 'c2', user: { name: 'C', email: 'c@t.com' }, course: { title: 'C2' }, enrolled_at: new Date() },
        { progress_percent: 0, course_id: 'c2', user: { name: 'D', email: 'd@t.com' }, course: { title: 'C2' }, enrolled_at: new Date() },
      ]),
    };
    mockAttemptRepo = {
      find: jest.fn().mockResolvedValue([
        { score: 85, user: { name: 'A', email: 'a@t.com' }, quiz: { title: 'Q1' }, submitted_at: new Date() },
      ]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: getRepositoryToken(Course), useValue: mockCourseRepo },
        { provide: getRepositoryToken(Enrollment), useValue: mockEnrollRepo },
        {
          provide: getRepositoryToken(QuizAttempt),
          useValue: mockAttemptRepo,
        },
      ],
    }).compile();

    analyticsService = module.get<AnalyticsService>(AnalyticsService);
  });

  describe('getDashboardMetrics', () => {
    it('should return dashboard metrics', async () => {
      const result = await analyticsService.getDashboardMetrics();
      expect(result.totalUsers).toBe(3);
      expect(result.totalCourses).toBe(2);
      expect(result.totalEnrollments).toBe(4);
      expect(result.completionRate).toBe(25);
      expect(result.avgQuizScore).toBe(85);
      expect(result.popularCourses).toBeDefined();
      expect(result.scoreDistribution).toBeDefined();
    });

    it('should calculate score distribution correctly', async () => {
      const result = await analyticsService.getDashboardMetrics();
      expect(result.scoreDistribution).toHaveLength(4);
    });

    it('should calculate popular courses sorted by enrollment count', async () => {
      const result = await analyticsService.getDashboardMetrics();
      expect(result.popularCourses[0].count).toBeGreaterThanOrEqual(
        result.popularCourses[1].count,
      );
    });
  });

  describe('generateCsvReport', () => {
    it('should generate a CSV string with header', async () => {
      const result = await analyticsService.generateCsvReport();
      expect(result).toContain('Report Type');
      expect(result).toContain('Enrollment');
      expect(result).toContain('Quiz Attempt');
    });

    it('should include user data in CSV', async () => {
      const result = await analyticsService.generateCsvReport();
      expect(result).toContain('a@t.com');
    });
  });
});
