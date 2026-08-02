import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('api/courses')
@UseGuards(JwtAuthGuard)
export class CoursesController {
  constructor(private coursesService: CoursesService) {}

  @Get()
  async getAllCourses() {
    return this.coursesService.findAll();
  }

  @Get(':id')
  async getCourse(@Param('id') id: string) {
    return this.coursesService.findOne(id);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Post()
  async createCourse(@Body() body: any, @Request() req) {
    return this.coursesService.createCourse({
      ...body,
      created_by: req.user.id,
      organization_id: req.user.organization_id,
    });
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Put(':id')
  async updateCourse(@Param('id') id: string, @Body() body: any) {
    return this.coursesService.updateCourse(id, body);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  async deleteCourse(@Param('id') id: string) {
    return this.coursesService.deleteCourse(id);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Post(':id/modules')
  async addModule(@Param('id') id: string, @Body() body: { title: string; order?: number }) {
    return this.coursesService.addModule(id, body.title, body.order);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Post('modules/:moduleId/lessons')
  async addLesson(@Param('moduleId') moduleId: string, @Body() body: any) {
    return this.coursesService.addLesson(moduleId, body);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Put('modules/:moduleId')
  async updateModule(@Param('moduleId') moduleId: string, @Body() body: { title: string }) {
    return this.coursesService.updateModule(moduleId, body);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Delete('modules/:moduleId')
  async deleteModule(@Param('moduleId') moduleId: string) {
    await this.coursesService.deleteModule(moduleId);
    return { message: 'Module deleted' };
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Put('lessons/:lessonId')
  async updateLesson(@Param('lessonId') lessonId: string, @Body() body: any) {
    return this.coursesService.updateLesson(lessonId, body);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Delete('lessons/:lessonId')
  async deleteLesson(@Param('lessonId') lessonId: string) {
    await this.coursesService.deleteLesson(lessonId);
    return { message: 'Lesson deleted' };
  }
}
