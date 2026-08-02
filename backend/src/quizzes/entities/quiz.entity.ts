import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { QuizQuestion } from './question.entity';

@Entity('quizzes')
export class Quiz {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  lesson_id: string;

  @Column()
  title: string;

  @Column({ default: 70 })
  passing_score: number; // Percentage

  @OneToMany(() => QuizQuestion, (q) => q.quiz, { cascade: true })
  questions: QuizQuestion[];

  @CreateDateColumn()
  created_at: Date;
}
