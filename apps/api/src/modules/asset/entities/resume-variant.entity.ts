// ============================================================
// AutoApply AI — Resume Variant Entity
// ============================================================

import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { UserEntity } from '../../user/entities/user.entity';

@Entity('resume_variants')
export class ResumeVariantEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column()
  name: string;

  @Column()
  fileName: string;

  @Column()
  filePath: string;

  @Column()
  mimeType: string;

  @Column({ type: 'int', default: 0 })
  fileSize: number;

  @Column({ type: 'int', default: 0 })
  atsScore: number;

  @Column({ default: false })
  isPrimary: boolean;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ type: 'int', default: 0 })
  applicationCount: number;

  @Column('simple-array', { default: '' })
  skills: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
