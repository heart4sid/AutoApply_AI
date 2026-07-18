// ============================================================
// AutoApply AI — Notification Service
// ============================================================

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationEntity } from './entities/notification.entity';
import { NotificationGateway } from './notification.gateway';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notifRepo: Repository<NotificationEntity>,
    private readonly gateway: NotificationGateway,
  ) {}

  async create(userId: string, type: string, title: string, message: string, actionUrl?: string) {
    const notif = this.notifRepo.create({
      userId,
      type,
      title,
      message,
      actionUrl,
    });

    const saved = await this.notifRepo.save(notif);

    // Broadcast to user live
    this.gateway.emitToUser(userId, 'notification:new', saved);

    return saved;
  }

  async findAll(userId: string): Promise<NotificationEntity[]> {
    return this.notifRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async markAsRead(userId: string, id: string): Promise<NotificationEntity> {
    const notif = await this.notifRepo.findOne({ where: { id, userId } });
    if (!notif) {
      throw new NotFoundException('Notification not found');
    }
    notif.read = true;
    return this.notifRepo.save(notif);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notifRepo.update({ userId, read: false }, { read: true });
  }
}
