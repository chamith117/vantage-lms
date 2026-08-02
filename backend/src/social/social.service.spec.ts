import { Test, TestingModule } from '@nestjs/testing';
import { SocialService } from './social.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Comment } from './entities/comment.entity';
import { Reaction } from './entities/reaction.entity';
import { Idea, IdeaStatus } from './entities/idea.entity';
import { GamificationService } from '../gamification/gamification.service';
import { NotFoundException } from '@nestjs/common';

describe('SocialService', () => {
  let socialService: SocialService;
  let mockCommentRepo: any;
  let mockReactionRepo: any;
  let mockIdeaRepo: any;
  let mockGamificationService: any;

  beforeEach(async () => {
    mockCommentRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((d) => d),
      save: jest.fn().mockImplementation((d) => Promise.resolve(d)),
    };
    mockReactionRepo = {
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((d) => d),
      save: jest.fn().mockImplementation((d) => Promise.resolve(d)),
      remove: jest.fn(),
    };
    mockIdeaRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((d) => d),
      save: jest.fn().mockImplementation((d) => Promise.resolve(d)),
    };
    mockGamificationService = {
      awardPoints: jest.fn().mockResolvedValue({ points: 20, newBadges: [] }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SocialService,
        { provide: getRepositoryToken(Comment), useValue: mockCommentRepo },
        { provide: getRepositoryToken(Reaction), useValue: mockReactionRepo },
        { provide: getRepositoryToken(Idea), useValue: mockIdeaRepo },
        {
          provide: GamificationService,
          useValue: mockGamificationService,
        },
      ],
    }).compile();

    socialService = module.get<SocialService>(SocialService);
  });

  describe('getLessonComments', () => {
    it('should return comments for a lesson', async () => {
      mockCommentRepo.find.mockResolvedValue([
        { id: 'c1', content: 'Hello', user: {}, reactions: [] },
      ]);
      const result = await socialService.getLessonComments('lesson-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('addComment', () => {
    it('should create a comment and award points', async () => {
      const savedComment = {
        id: 'c1',
        content: 'Great lesson',
        user_id: 'user-1',
        lesson_id: 'lesson-1',
      };
      mockCommentRepo.save.mockResolvedValue(savedComment);
      mockCommentRepo.findOne.mockResolvedValue({
        ...savedComment,
        user: { name: 'Test' },
        reactions: [],
      });

      const result = await socialService.addComment(
        'user-1',
        'lesson-1',
        'Great lesson',
      );
      expect(result.comment.content).toBe('Great lesson');
      expect(result.gamification.points).toBe(20);
      expect(mockGamificationService.awardPoints).toHaveBeenCalledWith(
        'user-1',
        20,
      );
    });
  });

  describe('toggleReaction', () => {
    it('should add a reaction if none exists', async () => {
      mockReactionRepo.findOne.mockResolvedValue(null);
      const result = await socialService.toggleReaction(
        'user-1',
        'comment-1',
        '👍',
      );
      expect(result.action).toBe('added');
      expect(mockReactionRepo.save).toHaveBeenCalled();
    });

    it('should remove a reaction if it exists', async () => {
      const existingReaction = {
        id: 'r1',
        user_id: 'user-1',
        comment_id: 'comment-1',
        emoji: '👍',
      };
      mockReactionRepo.findOne.mockResolvedValue(existingReaction);
      const result = await socialService.toggleReaction(
        'user-1',
        'comment-1',
        '👍',
      );
      expect(result.action).toBe('removed');
      expect(mockReactionRepo.remove).toHaveBeenCalled();
    });
  });

  describe('getIdeas', () => {
    it('should return all ideas', async () => {
      mockIdeaRepo.find.mockResolvedValue([
        { id: 'i1', title: 'Idea 1', user: {} },
      ]);
      const result = await socialService.getIdeas();
      expect(result).toHaveLength(1);
    });
  });

  describe('createIdea', () => {
    it('should create an idea and award points', async () => {
      const savedIdea = {
        id: 'i1',
        title: 'New Feature',
        description: 'Description',
        status: 'pending',
      };
      mockIdeaRepo.save.mockResolvedValue(savedIdea);
      mockIdeaRepo.findOne.mockResolvedValue({
        ...savedIdea,
        user: { name: 'Test' },
      });

      const result = await socialService.createIdea(
        'user-1',
        'New Feature',
        'Description',
      );
      expect(result.title).toBe('New Feature');
      expect(result.status).toBe(IdeaStatus.PENDING);
      expect(mockGamificationService.awardPoints).toHaveBeenCalledWith(
        'user-1',
        20,
      );
    });
  });

  describe('updateIdeaStatus', () => {
    it('should update idea status', async () => {
      mockIdeaRepo.findOne.mockResolvedValue({
        id: 'i1',
        status: IdeaStatus.PENDING,
      });
      mockIdeaRepo.save.mockImplementation((d) => Promise.resolve(d));

      const result = await socialService.updateIdeaStatus(
        'i1',
        IdeaStatus.REVIEWED,
        'Looks good',
      );
      expect(result.status).toBe(IdeaStatus.REVIEWED);
      expect(result.admin_response).toBe('Looks good');
    });

    it('should throw if idea not found', async () => {
      mockIdeaRepo.findOne.mockResolvedValue(null);
      await expect(
        socialService.updateIdeaStatus('bad-id', IdeaStatus.REVIEWED),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
