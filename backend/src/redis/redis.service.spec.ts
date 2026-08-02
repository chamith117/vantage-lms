import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from './redis.service';
import { ConfigService } from '@nestjs/config';

describe('RedisService', () => {
  let redisService: RedisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    redisService = module.get<RedisService>(RedisService);
  });

  describe('updateLeaderboardScore', () => {
    it('should not throw when Redis client is not initialized', async () => {
      await expect(
        redisService.updateLeaderboardScore('org-1', 'user-1', 100),
      ).resolves.not.toThrow();
    });
  });

  describe('getTopLeaderboard', () => {
    it('should return empty array when Redis client is not initialized', async () => {
      const result = await redisService.getTopLeaderboard('org-1', 10);
      expect(result).toEqual([]);
    });
  });
});
