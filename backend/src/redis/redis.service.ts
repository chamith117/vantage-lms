import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const host = this.configService.get<string>('REDIS_HOST', 'redis');
    const port = this.configService.get<number>('REDIS_PORT', 6379);
    this.client = new Redis({
      host,
      port,
      lazyConnect: true,
      maxRetriesPerRequest: 3,
    });
    this.client.connect().catch((err) => {
      console.warn('Redis connection warning (falling back to memory if unreachable):', err.message);
    });
  }

  onModuleDestroy() {
    if (this.client) {
      this.client.disconnect();
    }
  }

  async updateLeaderboardScore(orgId: string, userId: string, points: number) {
    if (!this.client || this.client.status !== 'ready') return;
    try {
      await this.client.zadd(`leaderboard:org:${orgId}`, points, userId);
    } catch (err) {
      console.error('Redis zadd error:', err);
    }
  }

  async getTopLeaderboard(orgId: string, topCount: number = 10): Promise<{ userId: string; score: number }[]> {
    if (!this.client || this.client.status !== 'ready') return [];
    try {
      const results = await this.client.zrevrange(`leaderboard:org:${orgId}`, 0, topCount - 1, 'WITHSCORES');
      const leaderboard: { userId: string; score: number }[] = [];
      for (let i = 0; i < results.length; i += 2) {
        leaderboard.push({
          userId: results[i],
          score: parseFloat(results[i + 1]),
        });
      }
      return leaderboard;
    } catch (err) {
      console.error('Redis zrevrange error:', err);
      return [];
    }
  }
}
