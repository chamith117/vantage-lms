import { Test, TestingModule } from '@nestjs/testing';
import { GamificationService } from './gamification.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Badge } from './entities/badge.entity';
import { UserBadge } from './entities/user-badge.entity';
import { UsersService } from '../users/users.service';
import { RedisService } from '../redis/redis.service';

describe('GamificationService', () => {
  let gamificationService: GamificationService;
  let mockBadgeRepo: any;
  let mockUserBadgeRepo: any;
  let mockUsersService: any;
  let mockRedisService: any;

  const mockBadge = {
    id: 'badge-1',
    title: 'First Step',
    description: 'Earn 50 XP',
    icon: 'Zap',
    required_points: 50,
    category: 'Milestone',
  };

  const mockUserBadge = {
    id: 'ub-1',
    user_id: 'user-1',
    badge_id: 'badge-1',
    awarded_at: new Date(),
    badge: mockBadge,
  };

  beforeEach(async () => {
    mockBadgeRepo = {
      find: jest.fn().mockResolvedValue([mockBadge]),
    };
    mockUserBadgeRepo = {
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockImplementation((d) => d),
      save: jest.fn().mockImplementation((d) => Promise.resolve(d)),
    };
    mockUsersService = {
      addPoints: jest.fn().mockResolvedValue({ points: 50 }),
      findById: jest.fn().mockResolvedValue({ id: 'user-1', points: 50 }),
      findAll: jest.fn().mockResolvedValue([
        { id: 'user-1', name: 'User 1', points: 50, email: 'u1@test.com', avatar_url: null, role: 'learner' },
      ]),
    };
    mockRedisService = {
      updateLeaderboardScore: jest.fn(),
      getTopLeaderboard: jest.fn().mockResolvedValue([
        { userId: 'user-1', score: 50 },
      ]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GamificationService,
        { provide: getRepositoryToken(Badge), useValue: mockBadgeRepo },
        { provide: getRepositoryToken(UserBadge), useValue: mockUserBadgeRepo },
        { provide: UsersService, useValue: mockUsersService },
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    gamificationService = module.get<GamificationService>(GamificationService);
  });

  describe('awardPoints', () => {
    it('should award points and check for new badges', async () => {
      const result = await gamificationService.awardPoints('user-1', 50);
      expect(result.points).toBe(50);
      expect(mockUsersService.addPoints).toHaveBeenCalledWith('user-1', 50);
      expect(mockRedisService.updateLeaderboardScore).toHaveBeenCalled();
    });

    it('should award badge if points threshold met', async () => {
      mockUsersService.addPoints.mockResolvedValue({ points: 60 });
      mockUserBadgeRepo.find.mockResolvedValue([]);

      const result = await gamificationService.awardPoints('user-1', 60);
      expect(result.newBadges).toHaveLength(1);
      expect(result.newBadges[0].title).toBe('First Step');
    });

    it('should not re-award already earned badges', async () => {
      mockUsersService.addPoints.mockResolvedValue({ points: 60 });
      mockUserBadgeRepo.find.mockResolvedValue([mockUserBadge]);

      const result = await gamificationService.awardPoints('user-1', 60);
      expect(result.newBadges).toHaveLength(0);
    });
  });

  describe('getUserBadges', () => {
    it('should return user badges', async () => {
      mockUserBadgeRepo.find.mockResolvedValue([mockUserBadge]);
      const result = await gamificationService.getUserBadges('user-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('getAllBadges', () => {
    it('should return all badges', async () => {
      const result = await gamificationService.getAllBadges();
      expect(result).toHaveLength(1);
    });
  });

  describe('getLeaderboard', () => {
    it('should return leaderboard from Redis', async () => {
      const result = await gamificationService.getLeaderboard();
      expect(result).toHaveLength(1);
      expect(result[0].rank).toBe(1);
      expect(result[0].userId).toBe('user-1');
    });

    it('should fallback to DB if Redis is empty', async () => {
      mockRedisService.getTopLeaderboard.mockResolvedValue([]);
      const result = await gamificationService.getLeaderboard();
      expect(result).toHaveLength(1);
    });
  });
});
