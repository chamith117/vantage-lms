import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Course } from '../courses/entities/course.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { QuizAttempt } from '../quizzes/entities/quiz-attempt.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Course)
    private courseRepo: Repository<Course>,
    @InjectRepository(Enrollment)
    private enrollmentRepo: Repository<Enrollment>,
    @InjectRepository(QuizAttempt)
    private attemptRepo: Repository<QuizAttempt>,
  ) {}

  async getDashboardMetrics() {
    const totalUsers = await this.userRepo.count();
    const totalCourses = await this.courseRepo.count();
    const totalEnrollments = await this.enrollmentRepo.count();

    const enrollments = await this.enrollmentRepo.find({ relations: ['course'] });
    const completedCount = enrollments.filter((e) => e.progress_percent === 100).length;
    const completionRate = totalEnrollments > 0 ? Math.round((completedCount / totalEnrollments) * 100) : 0;

    const attempts = await this.attemptRepo.find();
    const avgQuizScore =
      attempts.length > 0 ? Math.round(attempts.reduce((acc, a) => acc + a.score, 0) / attempts.length) : 0;

    // Course popularity map
    const courseEnrollmentCounts: Record<string, { title: string; count: number; completed: number }> = {};
    enrollments.forEach((e) => {
      const cId = e.course_id;
      const title = e.course ? e.course.title : 'Course';
      if (!courseEnrollmentCounts[cId]) {
        courseEnrollmentCounts[cId] = { title, count: 0, completed: 0 };
      }
      courseEnrollmentCounts[cId].count++;
      if (e.progress_percent === 100) {
        courseEnrollmentCounts[cId].completed++;
      }
    });

    const popularCourses = Object.values(courseEnrollmentCounts).sort((a, b) => b.count - a.count);

    // Score distribution (ranges: 0-50, 51-70, 71-85, 86-100)
    const scoreDistribution = [
      { range: '0-50%', count: attempts.filter((a) => a.score <= 50).length },
      { range: '51-70%', count: attempts.filter((a) => a.score > 50 && a.score <= 70).length },
      { range: '71-85%', count: attempts.filter((a) => a.score > 70 && a.score <= 85).length },
      { range: '86-100%', count: attempts.filter((a) => a.score > 85).length },
    ];

    return {
      totalUsers,
      totalCourses,
      totalEnrollments,
      completionRate,
      avgQuizScore,
      popularCourses,
      scoreDistribution,
    };
  }

  async generateCsvReport(): Promise<string> {
    const enrollments = await this.enrollmentRepo.find({
      relations: ['user', 'course'],
    });
    const attempts = await this.attemptRepo.find({
      relations: ['user', 'quiz'],
    });

    let csv = 'Report Type,User Name,User Email,Course / Quiz Title,Status / Score,Progress %,Date\n';

    enrollments.forEach((e) => {
      const userName = `"${e.user ? e.user.name : 'N/A'}"`;
      const email = e.user ? e.user.email : 'N/A';
      const courseTitle = `"${e.course ? e.course.title : 'N/A'}"`;
      csv += `Enrollment,${userName},${email},${courseTitle},${e.status},${e.progress_percent}%,${e.enrolled_at.toISOString().split('T')[0]}\n`;
    });

    attempts.forEach((a) => {
      const userName = `"${a.user ? a.user.name : 'N/A'}"`;
      const email = a.user ? a.user.email : 'N/A';
      const quizTitle = `"${a.quiz ? a.quiz.title : 'Quiz'}"`;
      const status = a.passed ? 'PASSED' : 'FAILED';
      csv += `Quiz Attempt,${userName},${email},${quizTitle},${status} (${a.score}%),N/A,${a.submitted_at.toISOString().split('T')[0]}\n`;
    });

    return csv;
  }
}
