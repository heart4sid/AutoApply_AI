// ============================================================
// AutoApply AI — User Service
// ============================================================

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async findOne(id: string): Promise<UserEntity> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateProfile(id: string, updateData: Partial<UserEntity>): Promise<UserEntity> {
    const user = await this.findOne(id);
    Object.assign(user, updateData);
    return this.userRepo.save(user);
  }

  async setOnboardingComplete(id: string): Promise<UserEntity> {
    return this.updateProfile(id, { onboardingComplete: true });
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepo.remove(user);
  }
}
