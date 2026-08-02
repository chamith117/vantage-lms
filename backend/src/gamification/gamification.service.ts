import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Badge } from './entities/badge.entity';
import { UserBadge } from './entities/user-badge.entity';
import { UsersService } from '../users/users.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class GamificationService {
  constructor(
    @InjectRepository(Badge)
    private badgeRepo: Repository<Badge>,
    @InjectRepository(UserBadge)
    private userBadgeRepo: Repository<UserBadge>,
    private usersService: UsersService,
    private redisService: RedisService,
  ) {}

  async awardPoints(userId: string, pointsAmount: number): Promise<{ points: number; newBadges: Badge[] }> {
    const user = await this.usersService.addPoints(userId, pointsAmount);
    
    // Sync with Redis Leaderboard
    await this.redisService.updateLeaderboardScore(user.organization_id, user.id, user.points);

    // Check for newly unlocked badges
    const allBadges = await this.badgeRepo.find();
    const existingUserBadges = await this.userBadgeRepo.find({ where: { user_id: userId } });
    const existingBadgeIds = new Set(existingUserBadges.map((ub) => ub.badge_id));

    const newBadges: Badge[] = [];
    for (const badge of allBadges) {
      if (user.points >= badge.required_points && !existingBadgeIds.has(badge.id)) {
        const ub = this.userBadgeRepo.create({
          user_id: userId,
          badge_id: badge.id,
        });
        await this.userBadgeRepo.save(ub);
        newBadges.push(badge);
      }
    }

    return {
      points: user.points,
      newBadges,
    };
  }

  async getUserBadges(userId: string): Promise<UserBadge[]> {
    return this.userBadgeRepo.find({
      where: { user_id: userId },
      relations: ['badge'],
    });
  }

  async getAllBadges(): Promise<Badge[]> {
    return this.badgeRepo.find({ order: { required_points: 'ASC' } });
  }

  async getLeaderboard(orgId: string = 'vantage-demo-corp-id') {
    const redisEntries = await this.redisService.getTopLeaderboard(orgId, 20);
    const users = await this.usersService.findAll();

    if (redisEntries.length > 0) {
      // Map Redis scores to user details
      const userMap = new Map(users.map((u) => [u.id, u]));
      return redisEntries.map((entry, index) => {
        const u = userMap.get(entry.userId);
        return {
          rank: index + 1,
          userId: entry.userId,
          name: u ? u.name : 'Unknown User',
          email: u ? u.email : '',
          avatar_url: u ? u.avatar_url : null,
          role: u ? u.role : 'learner',
          points: entry.score,
        };
      });
    }

    // Fallback if Redis hasn't been populated yet
    return users.slice(0, 20).map((u, idx) => ({
      rank: idx + 1,
      userId: u.id,
      name: u.name,
      email: u.email,
      avatar_url: u.avatar_url,
      role: u.role,
      points: u.points,
    }));
  }
}
