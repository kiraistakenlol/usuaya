import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable } from 'typeorm';
import { Phrase } from './phrase.entity';

@Entity('text')
export class Text {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  spanish_text: string;

  @Column({ nullable: true })
  english_translation: string;

  @Column({ nullable: true })
  vocabulary_usage: string;

  @Column({ nullable: true })
  audio_file_id: string;

  @ManyToMany(() => Phrase)
  @JoinTable({
    name: 'text_phrases',
    joinColumn: { name: 'text_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'phrase_id', referencedColumnName: 'id' }
  })
  phrases: Phrase[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
} 