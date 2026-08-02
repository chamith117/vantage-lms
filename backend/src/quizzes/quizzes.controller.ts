import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { QuizzesService } from './quizzes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('api/quizzes')
@UseGuards(JwtAuthGuard)
export class QuizzesController {
  constructor(private quizzesService: QuizzesService) {}

  @Get('lesson/:lessonId')
  async getQuizByLesson(@Param('lessonId') lessonId: string) {
    return this.quizzesService.findQuizByLesson(lessonId);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Post()
  async createQuiz(@Body() body: { lesson_id: string; title: string; passing_score?: number; questions: any[] }) {
    return this.quizzesService.createQuiz(body.lesson_id, body.title, body.passing_score, body.questions);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Put(':id')
  async updateQuiz(@Param('id') quizId: string, @Body() body: { title: string; passing_score: number; questions: any[] }) {
    return this.quizzesService.updateQuiz(quizId, body.title, body.passing_score, body.questions);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Delete(':id')
  async deleteQuiz(@Param('id') quizId: string) {
    await this.quizzesService.deleteQuiz(quizId);
    return { message: 'Quiz deleted successfully' };
  }

  @Post(':id/submit')
  async submitQuiz(@Param('id') quizId: string, @Body() body: { answers: Record<string, string> }, @Request() req) {
    return this.quizzesService.submitQuiz(req.user.id, quizId, body.answers);
  }

  @Get(':id/my-attempts')
  async getMyAttempts(@Param('id') quizId: string, @Request() req) {
    return this.quizzesService.getUserAttempts(req.user.id, quizId);
  }
}
