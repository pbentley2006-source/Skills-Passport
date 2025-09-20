import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/users/profile
 * Get current user's profile
 */
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User not authenticated' }
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        updatedAt: true,
        profile: {
          select: {
            id: true,
            bio: true,
            location: true,
            website: true,
            linkedinUrl: true,
            githubUrl: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' }
      });
    }

    res.json({
      success: true,
      data: { user }
    });

  } catch (error) {
    logger.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch user profile' }
    });
  }
});

/**
 * PUT /api/users/profile
 * Update current user's profile
 */
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User not authenticated' }
      });
    }

    const {
      firstName,
      lastName,
      bio,
      location,
      website,
      linkedinUrl,
      githubUrl
    } = req.body;

    // Update user basic info
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName })
      }
    });

    // Update or create user profile
    const updatedProfile = await prisma.userProfile.upsert({
      where: { userId },
      update: {
        ...(bio !== undefined && { bio }),
        ...(location !== undefined && { location }),
        ...(website !== undefined && { website }),
        ...(linkedinUrl !== undefined && { linkedinUrl }),
        ...(githubUrl !== undefined && { githubUrl })
      },
      create: {
        userId,
        bio: bio || null,
        location: location || null,
        website: website || null,
        linkedinUrl: linkedinUrl || null,
        githubUrl: githubUrl || null
      }
    });

    res.json({
      success: true,
      data: {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          profile: updatedProfile
        }
      }
    });

  } catch (error) {
    logger.error('Error updating user profile:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update user profile' }
    });
  }
});

/**
 * GET /api/users/dashboard
 * Get dashboard data for current user
 */
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User not authenticated' }
      });
    }

    // Get user's CV uploads
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
      orderBy: { uploadedAt: 'desc' },
      take: 10
    });

    // Get statistics
    const totalUploads = await prisma.cvUpload.count({
      where: { userId }
    });

    const processedUploads = await prisma.cvUpload.count({
      where: {
        userId,
        status: 'PARSED'
      }
    });

    const failedUploads = await prisma.cvUpload.count({
      where: {
        userId,
        status: 'FAILED'
      }
    });

    // Get recent profiles
    const recentProfiles = await prisma.candidateProfile.findMany({
      where: {
        cvUpload: {
          userId
        }
      },
      include: {
        skills: {
          take: 5,
          orderBy: { proficiencyLevel: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 3
    });

    res.json({
      success: true,
      data: {
        uploads,
        statistics: {
          totalUploads,
          processedUploads,
          failedUploads,
          processingUploads: totalUploads - processedUploads - failedUploads
        },
        recentProfiles
      }
    });

  } catch (error) {
    logger.error('Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch dashboard data' }
    });
  }
});

/**
 * DELETE /api/users/account
 * Delete user account and all associated data
 */
router.delete('/account', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User not authenticated' }
      });
    }

    // Get all user's CV uploads to delete files
    const uploads = await prisma.cvUpload.findMany({
      where: { userId },
      select: { filePath: true }
    });

    // Delete user (cascade will handle related records)
    await prisma.user.delete({
      where: { id: userId }
    });

    // Delete uploaded files
    for (const upload of uploads) {
      if (upload.filePath) {
        try {
          const FileService = await import('../services/fileService');
          await FileService.FileService.deleteFile(upload.filePath);
        } catch (error) {
          logger.error('Error deleting file during account deletion:', error);
        }
      }
    }

    res.json({
      success: true,
      data: { message: 'Account deleted successfully' }
    });

  } catch (error) {
    logger.error('Error deleting user account:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to delete account' }
    });
  }
});

export default router;
