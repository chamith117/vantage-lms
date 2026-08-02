import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quiz } from './entities/quiz.entity';
import { QuizQuestion } from './entities/question.entity';
import { QuizAttempt } from './entities/quiz-attempt.entity';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { GamificationService } from '../gamification/gamification.service';

@Injectable()
export class QuizzesService {
  constructor(
    @InjectRepository(Quiz)
    private quizRepo: Repository<Quiz>,
    @InjectRepository(QuizQuestion)
    private questionRepo: Repository<QuizQuestion>,
    @InjectRepository(QuizAttempt)
    private attemptRepo: Repository<QuizAttempt>,
    private enrollmentsService: EnrollmentsService,
    private gamificationService: GamificationService,
  ) {}

  async createQuiz(lessonId: string, title: string, passingScore: number = 70, questions: any[]): Promise<Quiz> {
    const quiz = this.quizRepo.create({
      lesson_id: lessonId,
      title,
      passing_score: passingScore,
    });
    const savedQuiz = await this.quizRepo.save(quiz);

    if (questions && questions.length > 0) {
      const qEntities = questions.map((q) =>
        this.questionRepo.create({
          quiz_id: savedQuiz.id,
          prompt: q.prompt,
          question_type: q.question_type,
          options: q.options,
          correct_answer: q.correct_answer,
        }),
      );
      await this.questionRepo.save(qEntities);
    }

    return this.findQuizByLesson(lessonId);
  }

  async findQuizByLesson(lessonId: string): Promise<Quiz> {
    const quiz = await this.quizRepo.findOne({
      where: { lesson_id: lessonId },
      relations: ['questions'],
    });
    if (!quiz) {
      throw new NotFoundException('Quiz not found for this lesson');
    }
    return quiz;
  }

  async findQuizById(id: string): Promise<Quiz> {
    const quiz = await this.quizRepo.findOne({
      where: { id },
      relations: ['questions'],
    });
    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }
    return quiz;
  }

  async submitQuiz(userId: string, quizId: string, answers: Record<string, string>) {
    const quiz = await this.findQuizById(quizId);
    let correctCount = 0;
    const totalCount = quiz.questions.length;

    quiz.questions.forEach((q) => {
      if (answers[q.id] && answers[q.id].trim().toLowerCase() === q.correct_answer.trim().toLowerCase()) {
        correctCount++;
      }
    });

    const score = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 100;
    const passed = score >= quiz.passing_score;

    const attempt = this.attemptRepo.create({
      user_id: userId,
      quiz_id: quizId,
      score,
      passed,
      user_answers: answers,
    });
    await this.attemptRepo.save(attempt);

    let gamificationResult = { points: 0, newBadges: [] };
    if (passed) {
      // Complete lesson and award +100 bonus points for quiz mastery
      await this.enrollmentsService.completeLesson(userId, quiz.lesson_id);
      gamificationResult = await this.gamificationService.awardPoints(userId, 100);
    }

    return {
      attemptId: attempt.id,
      score,
      passed,
      passing_score: quiz.passing_score,
      correctCount,
      totalCount,
      gamification: gamificationResult,
    };
  }

  async getUserAttempts(userId: string, quizId: string): Promise<QuizAttempt[]> {
    return this.attemptRepo.find({
      where: { user_id: userId, quiz_id: quizId },
      order: { submitted_at: 'DESC' },
    });
  }

  async updateQuiz(quizId: string, title: string, passingScore: number, questions: any[]): Promise<Quiz> {
    const quiz = await this.findQuizById(quizId);
    if (title) quiz.title = title;
    if (passingScore) quiz.passing_score = passingScore;
    await this.quizRepo.save(quiz);

    if (questions) {
      await this.questionRepo.delete({ quiz_id: quizId });
      if (questions.length > 0) {
        const qEntities = questions.map((q) =>
          this.questionRepo.create({
            quiz_id: quizId,
            prompt: q.prompt,
            question_type: q.question_type,
            options: q.options,
            correct_answer: q.correct_answer,
          }),
        );
        await this.questionRepo.save(qEntities);
      }
    }

    return this.findQuizById(quizId);
  }

  async deleteQuiz(quizId: string): Promise<void> {
    const quiz = await this.findQuizById(quizId);
    await this.questionRepo.delete({ quiz_id: quizId });
    await this.quizRepo.remove(quiz);
  }
}
