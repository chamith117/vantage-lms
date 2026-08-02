import { Test, TestingModule } from '@nestjs/testing';
import { QuizzesService } from './quizzes.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Quiz } from './entities/quiz.entity';
import { QuizQuestion, QuestionType } from './entities/question.entity';
import { QuizAttempt } from './entities/quiz-attempt.entity';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { GamificationService } from '../gamification/gamification.service';
import { NotFoundException } from '@nestjs/common';

describe('QuizzesService', () => {
  let quizzesService: QuizzesService;
  let mockQuizRepo: any;
  let mockQuestionRepo: any;
  let mockAttemptRepo: any;
  let mockEnrollmentsService: any;
  let mockGamificationService: any;

  const mockQuiz = {
    id: 'quiz-1',
    lesson_id: 'lesson-1',
    title: 'Test Quiz',
    passing_score: 70,
    questions: [
      {
        id: 'q1',
        prompt: 'What is 2+2?',
        question_type: QuestionType.MULTIPLE_CHOICE,
        options: ['3', '4', '5', '6'],
        correct_answer: '4',
      },
      {
        id: 'q2',
        prompt: 'Is the sky blue?',
        question_type: QuestionType.TRUE_FALSE,
        options: ['True', 'False'],
        correct_answer: 'True',
      },
    ],
  };

  beforeEach(async () => {
    mockQuizRepo = {
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((d) => d),
      save: jest.fn().mockImplementation((d) => Promise.resolve(d)),
    };
    mockQuestionRepo = {
      create: jest.fn().mockImplementation((d) => d),
      save: jest.fn().mockImplementation((d) => Promise.resolve(d)),
    };
    mockAttemptRepo = {
      find: jest.fn(),
      create: jest.fn().mockImplementation((d) => d),
      save: jest.fn().mockImplementation((d) => Promise.resolve(d)),
    };
    mockEnrollmentsService = {
      completeLesson: jest.fn().mockResolvedValue({
        completed: true,
        newlyCompleted: true,
        gamification: { points: 50, newBadges: [] },
      }),
    };
    mockGamificationService = {
      awardPoints: jest.fn().mockResolvedValue({ points: 100, newBadges: [] }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuizzesService,
        { provide: getRepositoryToken(Quiz), useValue: mockQuizRepo },
        { provide: getRepositoryToken(QuizQuestion), useValue: mockQuestionRepo },
        { provide: getRepositoryToken(QuizAttempt), useValue: mockAttemptRepo },
        {
          provide: EnrollmentsService,
          useValue: mockEnrollmentsService,
        },
        {
          provide: GamificationService,
          useValue: mockGamificationService,
        },
      ],
    }).compile();

    quizzesService = module.get<QuizzesService>(QuizzesService);
  });

  describe('findQuizByLesson', () => {
    it('should return quiz for a lesson', async () => {
      mockQuizRepo.findOne.mockResolvedValue(mockQuiz);
      const result = await quizzesService.findQuizByLesson('lesson-1');
      expect(result.id).toBe('quiz-1');
      expect(result.questions).toHaveLength(2);
    });

    it('should throw if quiz not found', async () => {
      mockQuizRepo.findOne.mockResolvedValue(null);
      await expect(
        quizzesService.findQuizByLesson('bad-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createQuiz', () => {
    it('should create a quiz with questions', async () => {
      mockQuizRepo.save.mockImplementation((d) =>
        Promise.resolve({ ...d, id: 'quiz-new' }),
      );
      mockQuestionRepo.save.mockImplementation((d) =>
        Promise.resolve({ ...d, id: 'q-new' }),
      );
      mockQuizRepo.findOne.mockResolvedValue({
        id: 'quiz-new',
        questions: [],
      });

      const result = await quizzesService.createQuiz(
        'lesson-1',
        'New Quiz',
        70,
        [
          {
            prompt: 'Q1?',
            question_type: 'multiple_choice',
            options: ['A', 'B'],
            correct_answer: 'A',
          },
        ],
      );
      expect(mockQuizRepo.save).toHaveBeenCalled();
      expect(mockQuestionRepo.save).toHaveBeenCalled();
    });
  });

  describe('submitQuiz', () => {
    it('should grade quiz and return score - all correct', async () => {
      mockQuizRepo.findOne.mockResolvedValue(mockQuiz);
      mockAttemptRepo.save.mockImplementation((d) =>
        Promise.resolve({ ...d, id: 'attempt-1' }),
      );

      const result = await quizzesService.submitQuiz('user-1', 'quiz-1', {
        q1: '4',
        q2: 'True',
      });
      expect(result.score).toBe(100);
      expect(result.passed).toBe(true);
      expect(result.correctCount).toBe(2);
      expect(result.totalCount).toBe(2);
    });

    it('should grade quiz - partial correct', async () => {
      mockQuizRepo.findOne.mockResolvedValue(mockQuiz);
      mockAttemptRepo.save.mockImplementation((d) =>
        Promise.resolve({ ...d, id: 'attempt-1' }),
      );

      const result = await quizzesService.submitQuiz('user-1', 'quiz-1', {
        q1: '4',
        q2: 'False',
      });
      expect(result.score).toBe(50);
      expect(result.passed).toBe(false);
      expect(result.correctCount).toBe(1);
    });

    it('should award bonus points on pass', async () => {
      mockQuizRepo.findOne.mockResolvedValue(mockQuiz);
      mockAttemptRepo.save.mockImplementation((d) =>
        Promise.resolve({ ...d, id: 'attempt-1' }),
      );

      await quizzesService.submitQuiz('user-1', 'quiz-1', {
        q1: '4',
        q2: 'True',
      });
      expect(mockGamificationService.awardPoints).toHaveBeenCalledWith(
        'user-1',
        100,
      );
      expect(mockEnrollmentsService.completeLesson).toHaveBeenCalledWith(
        'user-1',
        'lesson-1',
      );
    });

    it('should not award bonus points on fail', async () => {
      mockQuizRepo.findOne.mockResolvedValue(mockQuiz);
      mockAttemptRepo.save.mockImplementation((d) =>
        Promise.resolve({ ...d, id: 'attempt-1' }),
      );

      await quizzesService.submitQuiz('user-1', 'quiz-1', {
        q1: '3',
        q2: 'False',
      });
      expect(mockGamificationService.awardPoints).not.toHaveBeenCalled();
    });
  });

  describe('getUserAttempts', () => {
    it('should return user attempts', async () => {
      mockAttemptRepo.find.mockResolvedValue([
        { id: 'a1', score: 80, passed: true },
      ]);
      const result = await quizzesService.getUserAttempts(
        'user-1',
        'quiz-1',
      );
      expect(result).toHaveLength(1);
    });
  });
});
