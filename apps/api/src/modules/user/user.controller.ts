// ============================================================
// AutoApply AI — User Controller (Production Hardened)
// ============================================================

import { Controller, Get, Patch, Body, UseGuards, Request, Delete } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  async getProfile(@Request() req: any) {
    const user = await this.userService.findOne(req.user.id);
    return this.sanitizeUser(user);
  }

  @Patch('profile')
  async updateProfile(@Request() req: any, @Body() dto: UpdateProfileDto) {
    const updatedUser = await this.userService.updateProfile(req.user.id, dto);
    return this.sanitizeUser(updatedUser);
  }

  @Patch('onboarding/complete')
  async completeOnboarding(@Request() req: any) {
    const updatedUser = await this.userService.setOnboardingComplete(req.user.id);
    return this.sanitizeUser(updatedUser);
  }

  @Delete('account')
  async deleteAccount(@Request() req: any) {
    await this.userService.remove(req.user.id);
    return { success: true, message: 'Account deleted successfully' };
  }

  private sanitizeUser(user: any) {
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
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
