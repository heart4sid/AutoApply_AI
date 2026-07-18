// ============================================================
// AutoApply AI — Aggregator Connection Entity
// ============================================================

import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { UserEntity } from '../../user/entities/user.entity';

@Entity('aggregator_connections')
export class AggregatorConnectionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column()
  aggregatorId: string; // e.g., 'agg-naukri'

  @Column({ default: 'disconnected' })
  status: string; // 'disconnected' | 'verifying' | 'connected' | 'error'

  // Encrypted credentials (AES-256-GCM in MVP, Vault in production)
  @Column({ type: 'text', nullable: true })
  encryptedCredentials: string | null;

  @Column({ type: 'varchar', nullable: true })
  encryptionIv: string | null;

  @Column({ type: 'varchar', nullable: true })
  encryptionTag: string | null;

  @Column({ type: 'varchar', nullable: true })
  errorMessage: string | null;

  @Column({ type: 'int', default: 0 })
  applicationCount: number;

  @Column({ type: 'int', default: 25 })
  dailyLimit: number;

  @Column({ type: 'int', default: 0 })
  dailyUsed: number;

  @Column({ type: 'datetime', nullable: true })
  lastValidatedAt: Date | null;

  @Column({ type: 'datetime', nullable: true })
  lastSyncAt: Date | null;

  // Per-connection config (JSON)
  @Column({ type: 'simple-json', nullable: true })
  config: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
