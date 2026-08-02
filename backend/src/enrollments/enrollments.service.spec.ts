import { Test, TestingModule } from '@nestjs/testing';
import { EnrollmentsService } from './enrollments.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Enrollment, EnrollmentStatus } from './entities/enrollment.entity';
import { LessonProgress } from './entities/lesson-progress.entity';
import { CoursesService } from '../courses/courses.service';
import { GamificationService } from '../gamification/gamification.service';

describe('EnrollmentsService', () => {
  let enrollmentsService: EnrollmentsService;
  let mockEnrollRepo: any;
  let mockProgressRepo: any;
  let mockCoursesService: any;
  let mockGamificationService: any;

  const mockEnrollment = {
    id: 'enroll-1',
    user_id: 'user-1',
    course_id: 'course-1',
    status: EnrollmentStatus.ENROLLED,
    progress_percent: 0,
    enrolled_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    mockEnrollRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((d) => d),
      save: jest.fn().mockImplementation((d) => Promise.resolve(d)),
    };
    mockProgressRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((d) => d),
      save: jest.fn().mockImplementation((d) => Promise.resolve(d)),
      manager: {
        findOne: jest.fn().mockResolvedValue({ id: 'mod-1', course_id: 'course-1' }),
      },
    };
    mockCoursesService = {
      findOne: jest.fn().mockResolvedValue({
        id: 'course-1',
        modules: [
          {
            id: 'mod-1',
            lessons: [{ id: 'lesson-1' }, { id: 'lesson-2' }],
          },
        ],
      }),
      findLesson: jest.fn().mockResolvedValue({ id: 'lesson-1', module_id: 'mod-1' }),
    };
    mockGamificationService = {
      awardPoints: jest.fn().mockResolvedValue({ points: 50, newBadges: [] }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnrollmentsService,
        { provide: getRepositoryToken(Enrollment), useValue: mockEnrollRepo },
        {
          provide: getRepositoryToken(LessonProgress),
          useValue: mockProgressRepo,
        },
        { provide: CoursesService, useValue: mockCoursesService },
        { provide: GamificationService, useValue: mockGamificationService },
      ],
    }).compile();

    enrollmentsService = module.get<EnrollmentsService>(EnrollmentsService);
  });

  describe('enroll', () => {
    it('should create a new enrollment', async () => {
      mockEnrollRepo.findOne.mockResolvedValue(null);
      const result = await enrollmentsService.enroll('user-1', 'course-1');
      expect(result.status).toBe(EnrollmentStatus.ENROLLED);
      expect(result.progress_percent).toBe(0);
      expect(mockEnrollRepo.save).toHaveBeenCalled();
    });

    it('should return existing enrollment if already enrolled', async () => {
      mockEnrollRepo.findOne.mockResolvedValue(mockEnrollment);
      const result = await enrollmentsService.enroll('user-1', 'course-1');
      expect(result.id).toBe('enroll-1');
    });
  });

  describe('getUserEnrollments', () => {
    it('should return user enrollments', async () => {
      mockEnrollRepo.find.mockResolvedValue([mockEnrollment]);
      const result = await enrollmentsService.getUserEnrollments('user-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('getLessonProgress', () => {
    it('should return completed lesson ids', async () => {
      mockProgressRepo.find.mockResolvedValue([
        { lesson_id: 'lesson-1', completed: true },
      ]);
      const result = await enrollmentsService.getLessonProgress(
        'user-1',
        'course-1',
      );
      expect(result.completedLessonIds).toContain('lesson-1');
      expect(result.completedLessonIds).not.toContain('lesson-2');
    });
  });

  describe('completeLesson', () => {
    it('should complete a lesson and award points', async () => {
      mockProgressRepo.findOne.mockResolvedValue(null);
      mockProgressRepo.find.mockResolvedValue([
        { lesson_id: 'lesson-1', completed: true },
        { lesson_id: 'lesson-2', completed: false },
      ]);
      mockEnrollRepo.findOne.mockResolvedValue({
        ...mockEnrollment,
        progress_percent: 0,
      });

      const result = await enrollmentsService.completeLesson(
        'user-1',
        'lesson-1',
      );
      expect(result.completed).toBe(true);
      expect(result.newlyCompleted).toBe(true);
      expect(mockGamificationService.awardPoints).toHaveBeenCalledWith(
        'user-1',
        50,
      );
    });

    it('should not re-award points for already completed lesson', async () => {
      mockProgressRepo.findOne.mockResolvedValue({
        lesson_id: 'lesson-1',
        completed: true,
      });
      mockProgressRepo.find.mockResolvedValue([
        { lesson_id: 'lesson-1', completed: true },
      ]);

      const result = await enrollmentsService.completeLesson(
        'user-1',
        'lesson-1',
      );
      expect(result.completed).toBe(true);
      expect(result.newlyCompleted).toBe(false);
      expect(mockGamificationService.awardPoints).not.toHaveBeenCalled();
    });
  });
});
