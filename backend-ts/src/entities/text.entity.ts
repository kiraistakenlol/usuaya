import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable, OneToOne, JoinColumn } from 'typeorm';
import { Phrase } from './phrase.entity';
import { Audio } from './audio.entity';

@Entity('text')
export class Text {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  spanish_text: string;

  @Column({ nullable: true })
  english_translation: string;

  @Column({ type: 'jsonb', nullable: true })
  analysis_data: any;

  @OneToOne(() => Audio, audio => audio.text)
  @JoinColumn({ name: 'audio_id' })
  audio: Audio;

  @Column({ nullable: true })
  audio_id: string;

  @ManyToMany(() => Phrase)
  @JoinTable({
    name: 'text_phrases',
    joinColumn: { name: 'text_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'phrase_id', referencedColumnName: 'id' }
  })
  phrases: Phrase[];

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;
} 