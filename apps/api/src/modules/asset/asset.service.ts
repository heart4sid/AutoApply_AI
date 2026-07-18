// ============================================================
// AutoApply AI — Asset Service
// ============================================================

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResumeVariantEntity } from './entities/resume-variant.entity';
import { ParsedProfileEntity } from './entities/parsed-profile.entity';
import { ParserService } from './parser.service';
import * as fs from 'fs';

@Injectable()
export class AssetService {
  constructor(
    @InjectRepository(ResumeVariantEntity)
    private readonly variantRepo: Repository<ResumeVariantEntity>,
    @InjectRepository(ParsedProfileEntity)
    private readonly profileRepo: Repository<ParsedProfileEntity>,
    private readonly parserService: ParserService,
  ) {}

  // ── Upload and Parse Resume ──
  async uploadResume(
    userId: string,
    file: Express.Multer.File,
    name: string,
    isPrimary = false,
  ): Promise<ResumeVariantEntity> {
    // If primary, set all other user resumes to non-primary
    if (isPrimary) {
      await this.variantRepo.update({ userId }, { isPrimary: false });
    }

    // Create the variant entity
    const variant = this.variantRepo.create({
      userId,
      name,
      fileName: file.originalname,
      filePath: file.path,
      mimeType: file.mimetype,
      fileSize: file.size,
      isPrimary,
    });

    const savedVariant = await this.variantRepo.save(variant);

    try {
      // Run the parsing pipeline
      const parsedData = await this.parserService.parseResume(file.path, file.mimetype);

      // Save parsed data
      const parsedProfile = this.profileRepo.create({
        variantId: savedVariant.id,
        userId,
        data: parsedData,
      });

      await this.profileRepo.save(parsedProfile);

      // Update variant status, score, skills
      savedVariant.atsScore = this.parserService.calculateAtsScore(parsedData);
      savedVariant.skills = parsedData.skills?.map((s: any) => s.name) || [];
      await this.variantRepo.save(savedVariant);
    } catch (err) {
      console.error('Parsing failed during upload pipeline:', err);
      // We still keep the uploaded file, but ATS score remains 0
    }

    return savedVariant;
  }

  // ── Find user variants ──
  async getResumes(userId: string): Promise<ResumeVariantEntity[]> {
    return this.variantRepo.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  // ── Find single variant with details ──
  async getResumeDetail(userId: string, variantId: string) {
    const variant = await this.variantRepo.findOne({ where: { id: variantId, userId } });
    if (!variant) {
      throw new NotFoundException('Resume variant not found');
    }

    const profile = await this.profileRepo.findOne({
      where: { variantId },
      order: { createdAt: 'DESC' },
    });

    return {
      variant,
      profile: profile ? profile.data : null,
    };
  }

  // ── Update Parsed Profile Data ──
  async updateProfileData(userId: string, variantId: string, profileData: any) {
    const variant = await this.variantRepo.findOne({ where: { id: variantId, userId } });
    if (!variant) {
      throw new NotFoundException('Resume variant not found');
    }

    // Create new profile version
    const existingProfile = await this.profileRepo.findOne({
      where: { variantId },
      order: { version: 'DESC' },
    });

    const nextVersion = existingProfile ? existingProfile.version + 1 : 1;

    const newProfile = this.profileRepo.create({
      variantId,
      userId,
      version: nextVersion,
      data: profileData,
    });

    await this.profileRepo.save(newProfile);

    // Update variant metrics
    variant.atsScore = this.parserService.calculateAtsScore(profileData);
    variant.skills = profileData.skills?.map((s: any) => s.name) || [];
    variant.version = nextVersion;
    
    return this.variantRepo.save(variant);
  }

  // ── Delete Variant ──
  async deleteResume(userId: string, variantId: string): Promise<void> {
    const variant = await this.variantRepo.findOne({ where: { id: variantId, userId } });
    if (!variant) {
      throw new NotFoundException('Resume variant not found');
    }

    // Remove local file
    try {
      if (fs.existsSync(variant.filePath)) {
        fs.unlinkSync(variant.filePath);
      }
    } catch (e) {
      console.warn('Could not delete local file path:', variant.filePath, e);
    }

    await this.variantRepo.remove(variant);
  }
}
