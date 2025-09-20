import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/skills/taxonomy
 * Get skills taxonomy data
 */
router.get('/taxonomy', async (req, res, next) => {
  try {
    const category = req.query.category as string;
    
    const whereClause = category ? { category: category.toUpperCase() } : {};
    
    const skills = await prisma.skill.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
      take: 100
    });

    const groupedSkills = skills.reduce((acc, skill) => {
      if (!acc[skill.category]) {
        acc[skill.category] = [];
      }
      acc[skill.category].push(skill);
      return acc;
    }, {} as Record<string, any[]>);

    res.json({
      success: true,
      data: {
        skills: groupedSkills,
        total: skills.length
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/skills/search
 * Search skills by name
 */
router.get('/search', async (req, res, next) => {
  try {
    const query = req.query.q as string;
    
    if (!query || query.length < 2) {
      throw createError('Search query must be at least 2 characters', 400);
    }

    const skills = await prisma.skill.findMany({
      where: {
        name: {
          contains: query,
          mode: 'insensitive'
        }
      },
      orderBy: { name: 'asc' },
      take: 20
    });

    res.json({
      success: true,
      data: {
        skills,
        query
      }
    });

  } catch (error) {
    next(error);
  }
});

export { router as skillRoutes };
