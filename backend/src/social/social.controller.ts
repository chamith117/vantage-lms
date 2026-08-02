import { Controller, Get, Post, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { SocialService } from './social.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { IdeaStatus } from './entities/idea.entity';

@Controller('api/social')
@UseGuards(JwtAuthGuard)
export class SocialController {
  constructor(private socialService: SocialService) {}

  @Get('lessons/:lessonId/comments')
  async getComments(@Param('lessonId') lessonId: string) {
    return this.socialService.getLessonComments(lessonId);
  }

  @Post('lessons/:lessonId/comments')
  async addComment(@Param('lessonId') lessonId: string, @Body() body: { content: string }, @Request() req) {
    return this.socialService.addComment(req.user.id, lessonId, body.content);
  }

  @Post('comments/:commentId/reactions')
  async toggleReaction(@Param('commentId') commentId: string, @Body() body: { emoji: string }, @Request() req) {
    return this.socialService.toggleReaction(req.user.id, commentId, body.emoji);
  }

  @Get('ideas')
  async getIdeas() {
    return this.socialService.getIdeas();
  }

  @Post('ideas')
  async createIdea(@Body() body: { title: string; description: string }, @Request() req) {
    return this.socialService.createIdea(req.user.id, body.title, body.description);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Put('ideas/:id')
  async updateIdea(@Param('id') ideaId: string, @Body() body: { status: IdeaStatus; admin_response?: string }) {
    return this.socialService.updateIdeaStatus(ideaId, body.status, body.admin_response);
  }
}
