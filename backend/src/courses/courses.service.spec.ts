import { Test, TestingModule } from '@nestjs/testing';
import { CoursesService } from './courses.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Course } from './entities/course.entity';
import { CourseModule } from './entities/module.entity';
import { Lesson, LessonContentType } from './entities/lesson.entity';
import { NotFoundException } from '@nestjs/common';

describe('CoursesService', () => {
  let coursesService: CoursesService;
  let mockCourseRepo: any;
  let mockModuleRepo: any;
  let mockLessonRepo: any;

  const mockCourse = {
    id: 'course-1',
    title: 'Test Course',
    description: 'A test course',
    category: 'General',
    thumbnail_url: null,
    organization_id: 'vantage-demo-corp-id',
    created_by: 'user-1',
    modules: [],
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockModule = {
    id: 'module-1',
    title: 'Module 1',
    order: 1,
    course_id: 'course-1',
    lessons: [],
  };

  const mockLesson = {
    id: 'lesson-1',
    title: 'Lesson 1',
    content_type: LessonContentType.TEXT,
    content_body: 'Some content',
    file_url: null,
    order: 1,
    duration_minutes: 15,
    module_id: 'module-1',
  };

  beforeEach(async () => {
    mockCourseRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((d) => d),
      save: jest.fn().mockImplementation((d) => Promise.resolve(d)),
      remove: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
    };
    mockModuleRepo = {
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((d) => d),
      save: jest.fn().mockImplementation((d) => Promise.resolve(d)),
    };
    mockLessonRepo = {
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((d) => d),
      save: jest.fn().mockImplementation((d) => Promise.resolve(d)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoursesService,
        { provide: getRepositoryToken(Course), useValue: mockCourseRepo },
        { provide: getRepositoryToken(CourseModule), useValue: mockModuleRepo },
        { provide: getRepositoryToken(Lesson), useValue: mockLessonRepo },
      ],
    }).compile();

    coursesService = module.get<CoursesService>(CoursesService);
  });

  describe('findAll', () => {
    it('should return all courses', async () => {
      mockCourseRepo.find.mockResolvedValue([mockCourse]);
      const result = await coursesService.findAll();
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return a course by id', async () => {
      mockCourseRepo.findOne.mockResolvedValue(mockCourse);
      const result = await coursesService.findOne('course-1');
      expect(result.id).toBe('course-1');
    });

    it('should throw NotFoundException if not found', async () => {
      mockCourseRepo.findOne.mockResolvedValue(null);
      await expect(coursesService.findOne('bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createCourse', () => {
    it('should create a course', async () => {
      const result = await coursesService.createCourse({
        title: 'New Course',
        description: 'Desc',
      });
      expect(result.title).toBe('New Course');
      expect(mockCourseRepo.save).toHaveBeenCalled();
    });
  });

  describe('updateCourse', () => {
    it('should update a course', async () => {
      mockCourseRepo.findOne
        .mockResolvedValueOnce(mockCourse)
        .mockResolvedValueOnce({ ...mockCourse, title: 'Updated' });

      const result = await coursesService.updateCourse('course-1', {
        title: 'Updated',
      });
      expect(result.title).toBe('Updated');
      expect(mockCourseRepo.update).toHaveBeenCalledWith('course-1', {
        title: 'Updated',
      });
    });

    it('should throw if course not found', async () => {
      mockCourseRepo.findOne.mockResolvedValue(null);
      await expect(
        coursesService.updateCourse('bad-id', { title: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteCourse', () => {
    it('should delete a course', async () => {
      mockCourseRepo.findOne.mockResolvedValue(mockCourse);
      await coursesService.deleteCourse('course-1');
      expect(mockCourseRepo.remove).toHaveBeenCalled();
    });
  });

  describe('addModule', () => {
    it('should add a module to a course', async () => {
      mockCourseRepo.findOne.mockResolvedValue(mockCourse);
      const result = await coursesService.addModule(
        'course-1',
        'New Module',
        1,
      );
      expect(result.title).toBe('New Module');
      expect(mockModuleRepo.save).toHaveBeenCalled();
    });

    it('should throw if course not found', async () => {
      mockCourseRepo.findOne.mockResolvedValue(null);
      await expect(
        coursesService.addModule('bad-id', 'Mod', 1),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('addLesson', () => {
    it('should add a lesson to a module', async () => {
      mockModuleRepo.findOne.mockResolvedValue(mockModule);
      const result = await coursesService.addLesson('module-1', {
        title: 'New Lesson',
        content_type: LessonContentType.TEXT,
      });
      expect(result.title).toBe('New Lesson');
      expect(mockLessonRepo.save).toHaveBeenCalled();
    });

    it('should throw if module not found', async () => {
      mockModuleRepo.findOne.mockResolvedValue(null);
      await expect(
        coursesService.addLesson('bad-id', { title: 'L' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findLesson', () => {
    it('should return a lesson', async () => {
      mockLessonRepo.findOne.mockResolvedValue(mockLesson);
      const result = await coursesService.findLesson('lesson-1');
      expect(result.id).toBe('lesson-1');
    });

    it('should throw if lesson not found', async () => {
      mockLessonRepo.findOne.mockResolvedValue(null);
      await expect(coursesService.findLesson('bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
