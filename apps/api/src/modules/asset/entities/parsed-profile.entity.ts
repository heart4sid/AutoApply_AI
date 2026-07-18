// ============================================================
// AutoApply AI — Parsed Profile Entity
// ============================================================

import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { ResumeVariantEntity } from './resume-variant.entity';

@Entity('parsed_profiles')
export class ParsedProfileEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  variantId: string;

  @ManyToOne(() => ResumeVariantEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'variantId' })
  variant: ResumeVariantEntity;

  @Column()
  userId: string;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ type: 'simple-json' })
  data: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;
}
