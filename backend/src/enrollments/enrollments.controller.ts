import { Controller, Get, Post, Param, UseGuards, Request } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/enrollments')
@UseGuards(JwtAuthGuard)
export class EnrollmentsController {
  constructor(private enrollmentsService: EnrollmentsService) {}

  @Post('courses/:courseId')
  async enroll(@Param('courseId') courseId: string, @Request() req) {
    return this.enrollmentsService.enroll(req.user.id, courseId);
  }

  @Get('my-courses')
  async getMyCourses(@Request() req) {
    return this.enrollmentsService.getUserEnrollments(req.user.id);
  }

  @Get('courses/:courseId/progress')
  async getProgress(@Param('courseId') courseId: string, @Request() req) {
    return this.enrollmentsService.getLessonProgress(req.user.id, courseId);
  }

  @Post('lessons/:lessonId/complete')
  async completeLesson(@Param('lessonId') lessonId: string, @Request() req) {
    return this.enrollmentsService.completeLesson(req.user.id, lessonId);
  }
}
