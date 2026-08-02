import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { CourseModule } from './module.entity';

export enum LessonContentType {
  VIDEO = 'video',
  PDF = 'pdf',
  TEXT = 'text',
  QUIZ = 'quiz',
  URL = 'url',
}

@Entity('lessons')
export class Lesson {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({
    type: 'enum',
    enum: LessonContentType,
    default: LessonContentType.TEXT,
  })
  content_type: LessonContentType;

  @Column({ type: 'text', nullable: true })
  content_body: string;

  @Column({ nullable: true })
  file_url: string;

  @Column({ nullable: true })
  video_url: string;

  @Column({ default: 0 })
  order: number;

  @Column({ default: 15 })
  duration_minutes: number;

  @ManyToOne(() => CourseModule, (mod) => mod.lessons, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'module_id' })
  module: CourseModule;

  @Column()
  module_id: string;
}
