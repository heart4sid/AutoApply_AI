// ============================================================
// AutoApply AI — Application Record Entity
// ============================================================

import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { UserEntity } from '../../user/entities/user.entity';

@Entity('application_records')
@Index(['userId', 'createdAt'])
@Index(['userId', 'aggregatorId', 'status'])
export class ApplicationRecordEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column()
  aggregatorId: string;

  @Column()
  aggregatorName: string;

  @Column()
  jobTitle: string;

  @Column()
  company: string;

  @Column({ type: 'varchar', nullable: true })
  location: string | null;

  @Column({ type: 'varchar', nullable: true })
  jobUrl: string | null;

  @Column({ type: 'int', default: 0 })
  matchScore: number;

  @Column({ type: 'simple-json', nullable: true })
  matchBreakdown: Record<string, number> | null;

  @Column({ type: 'varchar', nullable: true })
  resumeVariantId: string | null;

  @Column({ type: 'varchar', nullable: true })
  resumeVariantName: string | null;

  @Column({ type: 'text', nullable: true })
  coverLetterText: string | null;

  @Column({ default: 'template_only' })
  coverLetterMode: string;

  @Column({ default: 'queued' })
  status: string;

  @Column({ default: 'Queued' })
  statusLabel: string;

  @Column({ type: 'varchar', nullable: true })
  failureReason: string | null;

  @Column({ type: 'simple-json', nullable: true })
  progress: Record<string, unknown> | null;

  @Column({ type: 'varchar', nullable: true })
  screenshotUrl: string | null;

  @Column({ type: 'datetime', nullable: true })
  appliedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
