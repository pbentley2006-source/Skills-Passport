import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/profiles/:id
 * Get anonymized candidate profile
 */
router.get('/:id', async (req, res, next) => {
  try {
    const profileId = req.params.id;

    const profile = await prisma.candidateProfile.findUnique({
      where: { id: profileId },
      include: {
        skills: {
          include: {
            skill: true
          }
        },
        workExperiences: true,
        achievements: true,
        qualifications: true
      }
    });

    if (!profile) {
      throw createError('Profile not found', 404);
    }

    res.json({
      success: true,
      data: {
        candidateId: profile.candidateId,
        professionalSummary: profile.professionalSummary,
        workExperience: profile.workExperiences,
        skills: profile.skills.map(cs => ({
          name: cs.skill.name,
          category: cs.skill.category,
          proficiencyLevel: cs.proficiencyLevel,
          yearsExperience: cs.yearsExperience,
          context: cs.context
        })),
        achievements: profile.achievements,
        qualifications: profile.qualifications,
        createdAt: profile.createdAt
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/profiles/candidate/:candidateId
 * Get profile by candidate ID (public endpoint)
 */
router.get('/candidate/:candidateId', async (req, res, next) => {
  try {
    const candidateId = req.params.candidateId;

    const profile = await prisma.candidateProfile.findUnique({
      where: { candidateId },
      include: {
        skills: {
          include: {
            skill: true
          }
        },
        workExperiences: true,
        achievements: true,
        qualifications: true
      }
    });

    if (!profile) {
      throw createError('Candidate profile not found', 404);
    }

    res.json({
      success: true,
      data: {
        candidateId: profile.candidateId,
        professionalSummary: profile.professionalSummary,
        workExperience: profile.workExperiences,
        skills: profile.skills.map(cs => ({
          name: cs.skill.name,
          category: cs.skill.category,
          proficiencyLevel: cs.proficiencyLevel,
          yearsExperience: cs.yearsExperience
        })),
        achievements: profile.achievements,
        qualifications: profile.qualifications,
        createdAt: profile.createdAt
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/profiles/:id
 * Update candidate profile (authenticated)
 */
router.put('/:id', authenticateToken, async (req, res, next) => {
  try {
    const profileId = req.params.id;
    const userId = req.user.id;
    const { professionalSummary } = req.body;

    // Verify ownership
    const profile = await prisma.candidateProfile.findFirst({
      where: {
        id: profileId,
        cvUpload: {
          userId
        }
      }
    });

    if (!profile) {
      throw createError('Profile not found or access denied', 404);
    }

    // Update profile
    const updatedProfile = await prisma.candidateProfile.update({
      where: { id: profileId },
      data: {
        professionalSummary: professionalSummary || profile.professionalSummary
      }
    });

    logger.info('Profile updated', { profileId, userId });

    res.json({
      success: true,
      data: {
        candidateId: updatedProfile.candidateId,
        professionalSummary: updatedProfile.professionalSummary,
        message: 'Profile updated successfully'
      }
    });

  } catch (error) {
    next(error);
  }
});

export { router as profileRoutes };
