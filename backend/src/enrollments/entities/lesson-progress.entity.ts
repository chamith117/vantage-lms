import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Lesson } from '../../courses/entities/lesson.entity';

@Entity('lesson_progress')
@Unique(['user_id', 'lesson_id'])
export class LessonProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  user_id: string;

  @ManyToOne(() => Lesson, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lesson_id' })
  lesson: Lesson;

  @Column()
  lesson_id: string;

  @Column({ default: false })
  completed: boolean;

  @CreateDateColumn()
  completed_at: Date;
}
