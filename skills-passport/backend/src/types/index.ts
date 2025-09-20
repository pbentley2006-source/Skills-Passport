// Type definitions for Skills Passport backend

export interface User {
  id: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CVUpload {
  id: string;
  userId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  filePath: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ParsedCV {
  id: string;
  cvUploadId: string;
  rawText: string;
  parsedData: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CandidateProfile {
  id: string;
  cvUploadId: string;
  candidateId: string;
  professionalSummary?: string;
  anonymizedData: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Skill {
  id: string;
  name: string;
  category: string;
  description?: string;
  onetCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkExperience {
  id: string;
  candidateProfileId: string;
  anonymizedCompany: string;
  position: string;
  startDate: string;
  endDate?: string;
  responsibilities: string;
  achievements: string;
  createdAt: Date;
  updatedAt: Date;
}

import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export interface ParsedCVData {
  personalInfo: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
  };
  workExperience: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate?: string;
    responsibilities: string[];
    achievements: string[];
  }>;
  skills: Array<{
    name: string;
    category?: string;
    proficiencyLevel?: number;
    yearsExperience?: number;
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field?: string;
    year?: string;
    grade?: string;
  }>;
  certifications: Array<{
    name: string;
    issuer: string;
    year?: string;
  }>;
  projects: Array<{
    name: string;
    description: string;
    technologies: string[];
  }>;
  languages: Array<{
    name: string;
    proficiency: string;
  }>;
}
