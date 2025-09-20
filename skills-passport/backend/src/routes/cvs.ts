import express from 'express';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { FileService } from '../services/fileService';
import { AIService } from '../services/aiService';
import { logger } from '../utils/logger';

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOCX, and TXT files are allowed.'));
    }
  }
});

/**
 * POST /api/cvs/upload
 * Upload and process a CV file
 */
router.post('/upload', authenticateToken, upload.single('cv'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { message: 'No file uploaded' }
      });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User not authenticated' }
      });
    }

    // Validate file
    const validation = FileService.validateFile(req.file);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: { message: validation.error }
      });
    }

    // Process the uploaded file
    const processedFile = await FileService.processUploadedFile(req.file);

    // Create CV upload record
    const cvUpload = await prisma.cvUpload.create({
      data: {
        userId,
        filename: processedFile.originalName,
        originalFilename: processedFile.originalName,
        fileSize: processedFile.size,
        mimeType: processedFile.mimetype,
        filePath: processedFile.path,
        status: 'UPLOADED'
      }
    });

    // Start background processing
    processCV(cvUpload.id, processedFile.text).catch(error => {
      logger.error('Background CV processing failed:', error);
    });

    res.json({
      success: true,
      data: {
        uploadId: cvUpload.id,
        filename: processedFile.originalName,
        status: 'UPLOADED',
        message: 'CV uploaded successfully. Processing will begin shortly.'
      }
    });

  } catch (error) {
    logger.error('CV upload error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to upload CV' }
    });
  }
});

/**
 * GET /api/cvs/user/uploads
 * Get user's CV uploads
 */
router.get('/user/uploads', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User not authenticated' }
      });
    }

    const uploads = await prisma.cvUpload.findMany({
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
      orderBy: { uploadedAt: 'desc' }
    });

    res.json({
      success: true,
      data: { uploads }
    });

  } catch (error) {
    logger.error('Error fetching user uploads:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch uploads' }
    });
  }
});

/**
 * GET /api/cvs/:uploadId/status
 * Get CV processing status
 */
router.get('/:uploadId/status', authenticateToken, async (req, res) => {
  try {
    const { uploadId } = req.params;
    const userId = req.user?.id;

    const upload = await prisma.cvUpload.findFirst({
      where: {
        id: uploadId,
        userId
      },
      include: {
        profile: {
          select: {
            id: true,
            candidateId: true,
            createdAt: true
          }
        }
      }
    });

    if (!upload) {
      return res.status(404).json({
        success: false,
        error: { message: 'Upload not found' }
      });
    }

    res.json({
      success: true,
      data: {
        id: upload.id,
        filename: upload.filename,
        status: upload.status,
        uploadedAt: upload.uploadedAt,
        profile: upload.profile
      }
    });

  } catch (error) {
    logger.error('Error fetching upload status:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch upload status' }
    });
  }
});

/**
 * GET /api/cvs/:uploadId/profile
 * Get processed profile for a CV upload
 */
router.get('/:uploadId/profile', authenticateToken, async (req, res) => {
  try {
    const { uploadId } = req.params;
    const userId = req.user?.id;

    const upload = await prisma.cvUpload.findFirst({
      where: {
        id: uploadId,
        userId
      },
      include: {
        profile: {
          include: {
            skills: true,
            experience: true,
            education: true
          }
        }
      }
    });

    if (!upload) {
      return res.status(404).json({
        success: false,
        error: { message: 'Upload not found' }
      });
    }

    if (!upload.profile) {
      return res.status(404).json({
        success: false,
        error: { message: 'Profile not yet generated' }
      });
    }

    res.json({
      success: true,
      data: { profile: upload.profile }
    });

  } catch (error) {
    logger.error('Error fetching profile:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch profile' }
    });
  }
});

/**
 * DELETE /api/cvs/:uploadId
 * Delete a CV upload and associated data
 */
router.delete('/:uploadId', authenticateToken, async (req, res) => {
  try {
    const { uploadId } = req.params;
    const userId = req.user?.id;

    const upload = await prisma.cvUpload.findFirst({
      where: {
        id: uploadId,
        userId
      }
    });

    if (!upload) {
      return res.status(404).json({
        success: false,
        error: { message: 'Upload not found' }
      });
    }

    // Delete file from disk
    if (upload.filePath) {
      await FileService.deleteFile(upload.filePath);
    }

    // Delete from database (cascade will handle related records)
    await prisma.cvUpload.delete({
      where: { id: uploadId }
    });

    res.json({
      success: true,
      data: { message: 'CV upload deleted successfully' }
    });

  } catch (error) {
    logger.error('Error deleting upload:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to delete upload' }
    });
  }
});

/**
 * Background function to process CV
 */
async function processCV(uploadId: string, cvText: string): Promise<void> {
  try {
    logger.info(`Starting CV processing for upload ${uploadId}`);

    // Update status to processing
    await prisma.cvUpload.update({
      where: { id: uploadId },
      data: { status: 'PROCESSING' }
    });

    // Extract skills and information using AI
    const extractedData = await AIService.extractSkillsFromCV(cvText);

    // Anonymize the CV content
    const anonymizedCV = await AIService.anonymizeCV(cvText, extractedData);

    // Generate career insights
    const careerInsights = await AIService.generateCareerInsights(extractedData);

    // Create candidate profile
    const profile = await prisma.candidateProfile.create({
      data: {
        candidateId: `ANON_${Date.now()}`,
        anonymizedCV,
        rawSkillsData: JSON.stringify(extractedData),
        careerInsights: JSON.stringify(careerInsights),
        totalExperience: extractedData.summary.totalExperience,
        seniority: extractedData.summary.seniority,
        primaryDomain: extractedData.summary.primaryDomain
      }
    });

    // Create skills records
    for (const skill of extractedData.technicalSkills) {
      await prisma.skill.create({
        data: {
          profileId: profile.id,
          name: skill.name,
          category: skill.category,
          proficiencyLevel: skill.proficiencyLevel,
          yearsExperience: skill.yearsExperience,
          type: 'TECHNICAL'
        }
      });
    }

    for (const skill of extractedData.softSkills) {
      await prisma.skill.create({
        data: {
          profileId: profile.id,
          name: skill.name,
          proficiencyLevel: skill.level,
          type: 'SOFT'
        }
      });
    }

    // Update CV upload with profile reference and status
    await prisma.cvUpload.update({
      where: { id: uploadId },
      data: {
        status: 'PARSED',
        profileId: profile.id
      }
    });

    logger.info(`Successfully processed CV for upload ${uploadId}`);

  } catch (error) {
    logger.error(`Error processing CV for upload ${uploadId}:`, error);

    // Update status to failed
    await prisma.cvUpload.update({
      where: { id: uploadId },
      data: { status: 'FAILED' }
    });
  }
}

export default router;
