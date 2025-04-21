import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable, OneToOne, JoinColumn } from 'typeorm';
import { Phrase } from './phrase.entity';
import { Audio } from './audio.entity';
import {TextAnalysis, VocabularyItem} from '@usuaya/shared-types';

@Entity('text')
export class Text {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  spanish_text: string;

  // --- LLM I/O Logging --- START
  @Column({ type: 'text', nullable: true })
  llm_generation_request_prompt: string | null; // Prompt used for generateSimpleText

  @Column({ type: 'text', nullable: true })
  raw_llm_generation_response: string | null; // Raw response from generateSimpleText

  @Column({ type: 'jsonb', nullable: true })
  llm_analysis_request: object | null; // JSON payload sent to analyzeIndexedWords

  @Column({ type: 'text', nullable: true })
  raw_llm_analysis_response: string | null; // Raw JSON response from analyzeIndexedWords
  // --- LLM I/O Logging --- END

  @Column({ type: 'jsonb', nullable: true })
  analysis_data: TextAnalysis | null;

  @Column({ type: 'jsonb', nullable: true })
  original_vocabulary: VocabularyItem[] | null;

  @OneToOne(() => Audio, audio => audio.text, { cascade: true, nullable: true })
  @JoinColumn({ name: 'audio_id' })
  audio: Audio | null;

  @Column({ type: 'uuid', nullable: true })
  audio_id: string | null;

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