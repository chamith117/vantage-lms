import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/gamification')
@UseGuards(JwtAuthGuard)
export class GamificationController {
  constructor(private gamificationService: GamificationService) {}

  @Get('leaderboard')
  async getLeaderboard(@Request() req) {
    const orgId = req.user.organization_id || 'vantage-demo-corp-id';
    return this.gamificationService.getLeaderboard(orgId);
  }

  @Get('badges')
  async getAllBadges() {
    return this.gamificationService.getAllBadges();
  }

  @Get('my-badges')
  async getMyBadges(@Request() req) {
    return this.gamificationService.getUserBadges(req.user.id);
  }
}
