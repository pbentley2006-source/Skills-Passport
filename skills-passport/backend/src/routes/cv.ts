import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { CVParser } from '../services/cvParser';
import { AnonymizationEngine } from '../services/anonymizationEngine';
import { logger } from '../utils/logger';
import { createError } from '../middleware/errorHandler';

const router = express.Router();
const prisma = new PrismaClient();
const cvParser = new CVParser();
const anonymizer = new AnonymizationEngine();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOCX, DOC, and TXT files are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') // 10MB default
  }
});

/**
 * POST /api/cvs/upload
 * Upload and process a CV file
 */
router.post('/upload', authenticateToken, upload.single('cv'), async (req, res, next) => {
  try {
    if (!req.file) {
      throw createError('No file uploaded', 400);
    }

    const userId = req.user.id;
    const file = req.file;

    logger.info('CV upload started', {
      userId,
      filename: file.originalname,
      size: file.size,
      mimetype: file.mimetype
    });

    // Save upload record to database
    const cvUpload = await prisma.cvUpload.create({
      data: {
        userId,
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        filePath: file.path,
        status: 'UPLOADED'
      }
    });

    // Start async processing
    processCV(cvUpload.id).catch(error => {
      logger.error('CV processing failed', { cvUploadId: cvUpload.id, error: error.message });
    });

    res.status(201).json({
      success: true,
      data: {
        uploadId: cvUpload.id,
        filename: file.originalname,
        status: 'UPLOADED',
        message: 'CV uploaded successfully. Processing will begin shortly.'
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/cvs/:id/status
 * Get processing status of uploaded CV
 */
router.get('/:id/status', authenticateToken, async (req, res, next) => {
  try {
    const cvUploadId = req.params.id;
    const userId = req.user.id;

    const cvUpload = await prisma.cvUpload.findFirst({
      where: {
        id: cvUploadId,
        userId
      },
      include: {
        parsedCv: true,
        profile: true
      }
    });

    if (!cvUpload) {
      throw createError('CV upload not found', 404);
    }

    res.json({
      success: true,
      data: {
        id: cvUpload.id,
        status: cvUpload.status,
        filename: cvUpload.originalName,
        uploadedAt: cvUpload.createdAt,
        hasParsedData: !!cvUpload.parsedCv,
        hasProfile: !!cvUpload.profile,
        profileId: cvUpload.profile?.id
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/cvs/:id/parsed
 * Get parsed CV data
 */
router.get('/:id/parsed', authenticateToken, async (req, res, next) => {
  try {
    const cvUploadId = req.params.id;
    const userId = req.user.id;

    const cvUpload = await prisma.cvUpload.findFirst({
      where: {
        id: cvUploadId,
        userId
      },
      include: {
        parsedCv: true
      }
    });

    if (!cvUpload) {
      throw createError('CV upload not found', 404);
    }

    if (!cvUpload.parsedCv) {
      throw createError('CV has not been parsed yet', 404);
    }

    res.json({
      success: true,
      data: {
        id: cvUpload.parsedCv.id,
        parsedData: cvUpload.parsedCv.parsedData,
        createdAt: cvUpload.parsedCv.createdAt
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/cvs/:id/generate-profile
 * Generate anonymized profile from parsed CV
 */
router.post('/:id/generate-profile', authenticateToken, async (req, res, next) => {
  try {
    const cvUploadId = req.params.id;
    const userId = req.user.id;

    const cvUpload = await prisma.cvUpload.findFirst({
      where: {
        id: cvUploadId,
        userId
      },
      include: {
        parsedCv: true,
        profile: true
      }
    });

    if (!cvUpload) {
      throw createError('CV upload not found', 404);
    }

    if (!cvUpload.parsedCv) {
      throw createError('CV must be parsed before generating profile', 400);
    }

    if (cvUpload.profile) {
      // Return existing profile
      return res.json({
        success: true,
        data: {
          profileId: cvUpload.profile.id,
          candidateId: cvUpload.profile.candidateId,
          message: 'Profile already exists'
        }
      });
    }

    // Generate anonymized profile
    const parsedData = cvUpload.parsedCv.parsedData as any;
    const anonymizedData = await anonymizer.anonymizeCV(parsedData);
    
    // Generate unique candidate ID
    const candidateId = await generateUniqueCandidateId();

    // Create candidate profile
    const profile = await prisma.candidateProfile.create({
      data: {
        cvUploadId: cvUpload.id,
        candidateId,
        professionalSummary: anonymizedData.professionalSummary,
        anonymizedData: anonymizedData
      }
    });

    // Create skills, work experiences, etc.
    await createProfileRelatedData(profile.id, anonymizedData);

    logger.info('Profile generated successfully', {
      profileId: profile.id,
      candidateId,
      userId
    });

    res.status(201).json({
      success: true,
      data: {
        profileId: profile.id,
        candidateId,
        message: 'Anonymized profile generated successfully'
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/cvs/user/uploads
 * Get all CV uploads for the authenticated user
 */
router.get('/user/uploads', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [uploads, total] = await Promise.all([
      prisma.cvUpload.findMany({
        where: { userId },
        include: {
          profile: {
            select: {
              id: true,
              candidateId: true,
              createdAt: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.cvUpload.count({ where: { userId } })
    ]);

    res.json({
      success: true,
      data: {
        uploads: uploads.map(upload => ({
          id: upload.id,
          filename: upload.originalName,
          status: upload.status,
          uploadedAt: upload.createdAt,
          profile: upload.profile ? {
            id: upload.profile.id,
            candidateId: upload.profile.candidateId,
            createdAt: upload.profile.createdAt
          } : null
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * Async function to process uploaded CV
 */
async function processCV(cvUploadId: string): Promise<void> {
  try {
    // Update status to processing
    await prisma.cvUpload.update({
      where: { id: cvUploadId },
      data: { status: 'PROCESSING' }
    });

    const cvUpload = await prisma.cvUpload.findUnique({
      where: { id: cvUploadId }
    });

    if (!cvUpload) {
      throw new Error('CV upload not found');
    }

    // Parse the CV file
    const parsedData = await cvParser.parseCV(cvUpload.filePath, cvUpload.mimeType);

    // Save parsed data
    await prisma.parsedCv.create({
      data: {
        cvUploadId: cvUpload.id,
        rawText: parsedData.rawText,
        parsedData: parsedData.structured
      }
    });

    // Update status to parsed
    await prisma.cvUpload.update({
      where: { id: cvUploadId },
      data: { status: 'PARSED' }
    });

    logger.info('CV processed successfully', { cvUploadId });

  } catch (error) {
    logger.error('CV processing failed', { cvUploadId, error: error.message });
    
    await prisma.cvUpload.update({
      where: { id: cvUploadId },
      data: { status: 'FAILED' }
    });
  }
}

/**
 * Generate unique candidate ID
 */
async function generateUniqueCandidateId(): Promise<string> {
  let candidateId: string;
  let isUnique = false;

  while (!isUnique) {
    const randomNum = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
    candidateId = `CANDIDATE_${randomNum}`;

    const existing = await prisma.candidateProfile.findUnique({
      where: { candidateId }
    });

    if (!existing) {
      isUnique = true;
    }
  }

  return candidateId!;
}

/**
 * Create profile-related data (skills, work experience, etc.)
 */
async function createProfileRelatedData(profileId: string, anonymizedData: any): Promise<void> {
  // Create work experiences
  if (anonymizedData.workExperience) {
    const workExperiences = anonymizedData.workExperience.map((exp: any) => ({
      candidateProfileId: profileId,
      anonymizedCompany: exp.anonymizedCompany,
      position: exp.position,
      startDate: exp.startDate,
      endDate: exp.endDate,
      responsibilities: exp.responsibilities,
      achievements: exp.achievements
    }));

    await prisma.workExperience.createMany({
      data: workExperiences
    });
  }

  // Create qualifications
  if (anonymizedData.education) {
    const qualifications = anonymizedData.education.map((edu: any) => ({
      candidateProfileId: profileId,
      type: 'DEGREE' as const,
      title: edu.degree,
      anonymizedInstitution: edu.anonymizedInstitution,
      field: edu.field,
      year: edu.year,
      grade: edu.gpa
    }));

    await prisma.qualification.createMany({
      data: qualifications
    });
  }

  // Create skills (this would integrate with the skills matching service)
  if (anonymizedData.skills) {
    // This is a simplified version - in practice, you'd use the SkillsMatcher
    for (const skillData of anonymizedData.skills) {
      // Find or create skill
      let skill = await prisma.skill.findFirst({
        where: { name: skillData.name }
      });

      if (!skill) {
        skill = await prisma.skill.create({
          data: {
            name: skillData.name,
            category: skillData.category || 'TECHNICAL',
            description: `${skillData.name} skill`
          }
        });
      }

      // Create candidate skill
      await prisma.candidateSkill.create({
        data: {
          candidateProfileId: profileId,
          skillId: skill.id,
          proficiencyLevel: skillData.proficiencyLevel || 3,
          yearsExperience: skillData.yearsExperience,
          context: skillData.context
        }
      });
    }
  }
}

export { router as cvRoutes };
