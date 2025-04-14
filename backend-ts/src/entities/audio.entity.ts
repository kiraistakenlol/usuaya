import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne } from 'typeorm';
import { Text } from './text.entity';
import { WordTiming } from '@usuaya/shared-types';

@Entity('audio')
export class Audio {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  file_id: string;

  @Column({ type: 'jsonb', nullable: true })
  word_timings: WordTiming[] | null;

  @OneToOne(() => Text, text => text.audio)
  text: Text;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;
} 