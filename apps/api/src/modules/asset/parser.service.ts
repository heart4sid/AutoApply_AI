// ============================================================
// AutoApply AI — AI Parser Service (Gemini API Integration)
// ============================================================

import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import pdfParse from 'pdf-parse';
import * as fs from 'fs';

@Injectable()
export class ParserService {
  private ai: GoogleGenAI | null = null;
  private readonly modelName: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    this.modelName = this.config.get<string>('GEMINI_MODEL', 'gemini-2.5-flash');

    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
    }
  }

  // ── Parse Resume Content ──
  async parseResume(filePath: string, mimeType: string): Promise<any> {
    let textContent = '';

    try {
      if (mimeType === 'application/pdf') {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse(dataBuffer);
        textContent = data.text;
      } else {
        // Fallback or text/docx reading
        textContent = fs.readFileSync(filePath, 'utf-8');
      }
    } catch (e) {
      console.warn('PDF reading failed or file is plain text. Reading raw bytes directly.', e);
      textContent = fs.readFileSync(filePath, 'utf-8');
    }

    if (!this.ai) {
      console.log('Gemini API key is not configured. Running fallback mock parsing.');
      return this.getMockParsedProfile();
    }

    try {
      const prompt = `
        You are an expert ATS (Applicant Tracking System) parser. Your task is to extract structured information from the following resume text and format it strictly matching the JSON schema provided below. Do not add markdown wrapping or formatting like \`\`\`json. Return only pure JSON string.

        Resume Text:
        ${textContent}

        Target JSON Schema:
        {
          "name": "string",
          "email": "string",
          "phone": "string or null",
          "linkedinUrl": "string or null",
          "location": "string or null",
          "summary": "string",
          "workExperience": [
            {
              "id": "unique string uuid-like key",
              "company": "string",
              "title": "string",
              "location": "string or null",
              "startDate": "YYYY-MM",
              "endDate": "YYYY-MM or null",
              "current": boolean,
              "bullets": ["bullet point 1", "bullet point 2"]
            }
          ],
          "education": [
            {
              "id": "unique string uuid-like key",
              "institution": "string",
              "degree": "string",
              "field": "string",
              "startDate": "YYYY-MM or null",
              "endDate": "YYYY-MM or null",
              "gpa": "string or null"
            }
          ],
          "skills": [
            {
              "name": "string skill name normalized",
              "category": "technical | soft | tool | language"
            }
          ],
          "certifications": [
            {
              "name": "string",
              "issuer": "string",
              "date": "YYYY-MM or null",
              "url": "string or null"
            }
          ],
          "projects": [
            {
              "name": "string",
              "description": "string",
              "technologies": ["string"],
              "url": "string or null"
            }
          ],
          "languages": ["string"]
        }
      `;

      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const parsedText = response.text;
      if (!parsedText) {
        throw new InternalServerErrorException('AI returned an empty response');
      }

      return JSON.parse(parsedText);
    } catch (error) {
      console.error('Error during AI parsing with Gemini:', error);
      throw new InternalServerErrorException('Resume parsing failed: ' + error.message);
    }
  }

  // ── Calculate ATS Score ──
  calculateAtsScore(profile: any): number {
    let score = 50; // base score

    if (profile.email) score += 5;
    if (profile.phone) score += 5;
    if (profile.linkedinUrl) score += 5;
    if (profile.summary && profile.summary.length > 50) score += 5;
    
    // Add points for robust experience details
    if (profile.workExperience && profile.workExperience.length > 0) {
      score += 15;
      const totalBullets = profile.workExperience.reduce((acc: number, job: any) => acc + (job.bullets?.length || 0), 0);
      if (totalBullets > 5) score += 5;
    }

    if (profile.education && profile.education.length > 0) score += 5;
    if (profile.skills && profile.skills.length > 5) score += 5;

    return Math.min(score, 100);
  }

  // ── Fallback mock profile data ──
  private getMockParsedProfile() {
    return {
      name: 'Priya Sharma',
      email: 'priya.sharma@email.com',
      phone: '+91 98765 43210',
      linkedinUrl: 'https://linkedin.com/in/priyasharma',
      location: 'Bengaluru, Karnataka, India',
      summary: 'Passionate and result-oriented Software Developer with 2+ years of experience specializing in node backend development and API systems.',
      workExperience: [
        {
          id: 'exp-1',
          company: 'Razorpay',
          title: 'Junior Backend Developer',
          location: 'Bengaluru, India',
          startDate: '2024-06',
          current: true,
          bullets: [
            'Built scalable Node.js/TypeScript REST APIs handling thousands of transactions daily.',
            'Collaborated with product teams to design modular systems using PostgreSQL and Redis.',
            'Improved microservices response times by 35% using caching and query optimizations.',
          ],
        },
      ],
      education: [
        {
          id: 'edu-1',
          institution: 'PES University',
          degree: 'B.Tech',
          field: 'Computer Science and Engineering',
          startDate: '2020-08',
          endDate: '2024-05',
          gpa: '8.4/10',
        },
      ],
      skills: [
        { name: 'TypeScript', category: 'technical' },
        { name: 'Node.js', category: 'technical' },
        { name: 'NestJS', category: 'technical' },
        { name: 'PostgreSQL', category: 'technical' },
        { name: 'Redis', category: 'technical' },
        { name: 'Docker', category: 'tool' },
        { name: 'Git', category: 'tool' },
        { name: 'Problem Solving', category: 'soft' },
      ],
      certifications: [
        { name: 'AWS Certified Cloud Practitioner', issuer: 'Amazon Web Services', date: '2025-01' },
      ],
      projects: [
        {
          name: 'Task Scheduler API',
          description: 'A Redis-backed background job processing backend designed for transactional queues.',
          technologies: ['Node.js', 'Redis', 'BullMQ'],
        },
      ],
      languages: ['English', 'Hindi'],
    };
  }
}
