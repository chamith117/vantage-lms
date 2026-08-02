import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { CourseModule } from './module.entity';

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ default: 'General' })
  category: string;

  @Column({ nullable: true })
  thumbnail_url: string;

  @Column({ default: 'vantage-demo-corp-id' })
  organization_id: string;

  @Column({ nullable: true })
  created_by: string;

  @OneToMany(() => CourseModule, (mod) => mod.course, { cascade: true })
  modules: CourseModule[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
