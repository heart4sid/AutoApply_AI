// ============================================================
// AutoApply AI — User Entity
// ============================================================

import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, OneToMany,
} from 'typeorm';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column()
  name: string;

  @Column({ default: 'user' })
  role: string; // 'user' | 'admin' | 'security'

  @Column({ default: 'free' })
  tier: string; // 'free' | 'pro' | 'enterprise'

  @Column({ type: 'varchar', nullable: true })
  avatarUrl: string | null;

  @Column({ default: 'Asia/Kolkata' })
  timezone: string;

  @Column({ default: 'en' })
  locale: string;

  @Column({ default: false })
  onboardingComplete: boolean;

  @Column({ default: false })
  mfaEnabled: boolean;

  @Column({ type: 'varchar', nullable: true })
  mfaSecret: string | null;

  @Column({ default: false })
  emailVerified: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
