// ============================================================
// AutoApply AI — Asset Controller
// ============================================================

import {
  Controller, Get, Post, Patch, Delete, UseGuards, Request,
  UseInterceptors, UploadedFile, Body, Param, ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AssetService } from './asset.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('assets')
@UseGuards(JwtAuthGuard)
export class AssetController {
  constructor(private readonly assetService: AssetService) {}

  @Post('resumes/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }),
  )
  async uploadResume(
    @Request() req: any,
    @UploadedFile() file: Express.Multer.File,
    @Body('name') name: string,
    @Body('isPrimary') isPrimary?: string,
  ) {
    const parsePrimary = isPrimary === 'true';
    return this.assetService.uploadResume(req.user.id, file, name || file.originalname, parsePrimary);
  }

  @Get('resumes')
  async getResumes(@Request() req: any) {
    return this.assetService.getResumes(req.user.id);
  }

  @Get('resumes/:id')
  async getResumeDetail(@Request() req: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.assetService.getResumeDetail(req.user.id, id);
  }

  @Patch('resumes/:id/profile')
  async updateProfile(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any,
  ) {
    return this.assetService.updateProfileData(req.user.id, id, body);
  }

  @Delete('resumes/:id')
  async deleteResume(@Request() req: any, @Param('id', ParseUUIDPipe) id: string) {
    await this.assetService.deleteResume(req.user.id, id);
    return { success: true, message: 'Resume variant deleted successfully' };
  }
}
