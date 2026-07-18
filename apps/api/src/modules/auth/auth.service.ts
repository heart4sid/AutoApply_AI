// ============================================================
// AutoApply AI — Auth Service
// ============================================================

import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';
import { UserEntity } from '../user/entities/user.entity';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  tier: string;
  jti: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // ── Register ──
  async register(name: string, email: string, password: string) {
    // Check for existing user
    const existing = await this.userRepo.findOne({ where: { email: email.toLowerCase() } });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    // Hash password with Argon2id
    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536, // 64 MB
      timeCost: 3,
      parallelism: 4,
    });

    // Create user
    const user = this.userRepo.create({
      email: email.toLowerCase(),
      name,
      passwordHash,
      role: 'user',
      tier: 'free',
    });

    const savedUser = await this.userRepo.save(user);

    // Generate tokens
    const tokens = await this.generateTokens(savedUser);

    return {
      user: this.sanitizeUser(savedUser),
      tokens,
    };
  }

  // ── Login ──
  async login(email: string, password: string) {
    const user = await this.userRepo.findOne({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Verify password
    const isValid = await argon2.verify(user.passwordHash, password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  // ── Refresh Token ──
  async refreshAccessToken(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const tokens = await this.generateTokens(user);
    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  // ── Token Generation ──
  private async generateTokens(user: UserEntity) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tier: user.tier,
      jti: uuidv4(),
    };

    const accessToken = this.jwtService.sign(payload);

    const refreshToken = this.jwtService.sign(
      { sub: user.id, jti: uuidv4() },
      {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRY', '30d'),
      },
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: 3600, // 1 hour in seconds
    };
  }

  // ── Validate JWT Payload ──
  async validateUser(payload: JwtPayload): Promise<UserEntity | null> {
    return this.userRepo.findOne({ where: { id: payload.sub } });
  }

  // ── Strip sensitive fields ──
  private sanitizeUser(user: UserEntity) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tier: user.tier,
      avatarUrl: user.avatarUrl,
      timezone: user.timezone,
      locale: user.locale,
      onboardingComplete: user.onboardingComplete,
      mfaEnabled: user.mfaEnabled,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt?.toISOString(),
      updatedAt: user.updatedAt?.toISOString(),
    };
  }
}
