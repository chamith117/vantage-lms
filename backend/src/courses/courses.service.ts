import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from './entities/course.entity';
import { CourseModule } from './entities/module.entity';
import { Lesson } from './entities/lesson.entity';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private courseRepo: Repository<Course>,
    @InjectRepository(CourseModule)
    private moduleRepo: Repository<CourseModule>,
    @InjectRepository(Lesson)
    private lessonRepo: Repository<Lesson>,
  ) {}

  async createCourse(data: Partial<Course>): Promise<Course> {
    const course = this.courseRepo.create(data);
    return this.courseRepo.save(course);
  }

  async findAll(): Promise<Course[]> {
    return this.courseRepo.find({
      relations: ['modules', 'modules.lessons'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Course> {
    const course = await this.courseRepo.findOne({
      where: { id },
      relations: ['modules', 'modules.lessons'],
    });
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    // Sort modules and lessons by order
    course.modules.sort((a, b) => a.order - b.order);
    course.modules.forEach((mod) => {
      if (mod.lessons) {
        mod.lessons.sort((a, b) => a.order - b.order);
      }
    });
    return course;
  }

  async updateCourse(id: string, data: Partial<Course>): Promise<Course> {
    await this.findOne(id);
    await this.courseRepo.update(id, data);
    return this.findOne(id);
  }

  async deleteCourse(id: string): Promise<void> {
    const course = await this.findOne(id);
    await this.courseRepo.remove(course);
  }

  async addModule(courseId: string, title: string, order: number = 0): Promise<CourseModule> {
    await this.findOne(courseId);
    const module = this.moduleRepo.create({
      course_id: courseId,
      title,
      order,
    });
    return this.moduleRepo.save(module);
  }

  async addLesson(moduleId: string, lessonData: Partial<Lesson>): Promise<Lesson> {
    const module = await this.moduleRepo.findOne({ where: { id: moduleId } });
    if (!module) {
      throw new NotFoundException('Module not found');
    }
    const lesson = this.lessonRepo.create({
      ...lessonData,
      module_id: moduleId,
    });
    return this.lessonRepo.save(lesson);
  }

  async findLesson(id: string): Promise<Lesson> {
    const lesson = await this.lessonRepo.findOne({ where: { id } });
    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }
    return lesson;
  }

  async updateModule(id: string, data: Partial<CourseModule>): Promise<CourseModule> {
    const module = await this.moduleRepo.findOne({ where: { id } });
    if (!module) throw new NotFoundException('Module not found');
    Object.assign(module, data);
    return this.moduleRepo.save(module);
  }

  async deleteModule(id: string): Promise<void> {
    const module = await this.moduleRepo.findOne({ where: { id } });
    if (!module) throw new NotFoundException('Module not found');
    await this.moduleRepo.remove(module);
  }

  async updateLesson(id: string, data: Partial<Lesson>): Promise<Lesson> {
    const lesson = await this.findLesson(id);
    Object.assign(lesson, data);
    return this.lessonRepo.save(lesson);
  }

  async deleteLesson(id: string): Promise<void> {
    const lesson = await this.findLesson(id);
    await this.lessonRepo.remove(lesson);
  }
}
