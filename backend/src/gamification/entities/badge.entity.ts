import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('badges')
export class Badge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column({ default: 'Award' })
  icon: string;

  @Column({ default: 100 })
  required_points: number;

  @Column({ default: 'Achievement' })
  category: string;
}
