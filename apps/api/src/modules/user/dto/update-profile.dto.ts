// ============================================================
// AutoApply AI — Update Profile DTO
// Only allows safe fields. Prevents privilege escalation via
// passwordHash, role, or tier overwrite.
// ============================================================

import { IsOptional, IsString, MinLength, MaxLength, IsUrl } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  timezone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  locale?: string;

  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'avatarUrl must be a valid URL' })
  avatarUrl?: string;
}
