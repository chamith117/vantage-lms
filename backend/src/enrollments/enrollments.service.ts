import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Enrollment, EnrollmentStatus } from './entities/enrollment.entity';
import { LessonProgress } from './entities/lesson-progress.entity';
import { CoursesService } from '../courses/courses.service';
import { GamificationService } from '../gamification/gamification.service';

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectRepository(Enrollment)
    private enrollmentRepo: Repository<Enrollment>,
    @InjectRepository(LessonProgress)
    private progressRepo: Repository<LessonProgress>,
    private coursesService: CoursesService,
    private gamificationService: GamificationService,
  ) {}

  async enroll(userId: string, courseId: string): Promise<Enrollment> {
    await this.coursesService.findOne(courseId);
    let enrollment = await this.enrollmentRepo.findOne({
      where: { user_id: userId, course_id: courseId },
    });
    if (enrollment) {
      return enrollment; // Already enrolled
    }
    enrollment = this.enrollmentRepo.create({
      user_id: userId,
      course_id: courseId,
      status: EnrollmentStatus.ENROLLED,
      progress_percent: 0,
    });
    return this.enrollmentRepo.save(enrollment);
  }

  async getUserEnrollments(userId: string): Promise<Enrollment[]> {
    return this.enrollmentRepo.find({
      where: { user_id: userId },
      relations: ['course'],
      order: { updated_at: 'DESC' },
    });
  }

  async getLessonProgress(userId: string, courseId: string) {
    const course = await this.coursesService.findOne(courseId);
    const lessonIds: string[] = [];
    course.modules.forEach((m) => {
      if (m.lessons) {
        m.lessons.forEach((l) => lessonIds.push(l.id));
      }
    });

    const progressRecords = await this.progressRepo.find({
      where: { user_id: userId },
    });

    const completedMap = new Map(progressRecords.map((p) => [p.lesson_id, p.completed]));
    return {
      completedLessonIds: lessonIds.filter((id) => completedMap.get(id)),
    };
  }

  async completeLesson(userId: string, lessonId: string) {
    const lesson = await this.coursesService.findLesson(lessonId);
    let progress = await this.progressRepo.findOne({
      where: { user_id: userId, lesson_id: lessonId },
    });

    let newlyCompleted = false;
    if (!progress) {
      progress = this.progressRepo.create({
        user_id: userId,
        lesson_id: lessonId,
        completed: true,
      });
      await this.progressRepo.save(progress);
      newlyCompleted = true;
    } else if (!progress.completed) {
      progress.completed = true;
      await this.progressRepo.save(progress);
      newlyCompleted = true;
    }

    // Award +50 points if newly completed
    let gamificationResult = { points: 0, newBadges: [] };
    if (newlyCompleted) {
      gamificationResult = await this.gamificationService.awardPoints(userId, 50);
    }

    // Update overall course progress
    const module = await this.progressRepo.manager.findOne('modules', {
      where: { id: lesson.module_id },
    });
    if (module && (module as any).course_id) {
      const courseId = (module as any).course_id;
      const course = await this.coursesService.findOne(courseId);
      let totalLessons = 0;
      let completedLessons = 0;

      const userProgress = await this.progressRepo.find({ where: { user_id: userId } });
      const completedSet = new Set(userProgress.filter((p) => p.completed).map((p) => p.lesson_id));

      course.modules.forEach((m) => {
        if (m.lessons) {
          totalLessons += m.lessons.length;
          m.lessons.forEach((l) => {
            if (completedSet.has(l.id)) completedLessons++;
          });
        }
      });

      const percent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 100;
      let enrollment = await this.enrollmentRepo.findOne({
        where: { user_id: userId, course_id: courseId },
      });

      if (enrollment) {
        enrollment.progress_percent = percent;
        enrollment.status = percent === 100 ? EnrollmentStatus.COMPLETED : EnrollmentStatus.IN_PROGRESS;
        await this.enrollmentRepo.save(enrollment);
      }
    }

    return {
      completed: true,
      newlyCompleted,
      gamification: gamificationResult,
    };
  }
}
