import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/skills/profile/:profileId
 * Get skills for a specific profile
 */
router.get('/profile/:profileId', authenticateToken, async (req, res) => {
  try {
    const { profileId } = req.params;
    const userId = req.user?.id;

    // Verify user owns this profile
    const profile = await prisma.candidateProfile.findFirst({
      where: {
        id: profileId,
        cvUpload: {
          userId
        }
      }
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: { message: 'Profile not found' }
      });
    }

    const skills = await prisma.skill.findMany({
      where: { profileId },
      orderBy: [
        { type: 'asc' },
        { proficiencyLevel: 'desc' }
      ]
    });

    // Group skills by type and category
    const groupedSkills = {
      technical: skills
        .filter(s => s.type === 'TECHNICAL')
        .reduce((acc, skill) => {
          const category = skill.category || 'Other';
          if (!acc[category]) acc[category] = [];
          acc[category].push(skill);
          return acc;
        }, {} as Record<string, any[]>),
      soft: skills.filter(s => s.type === 'SOFT')
    };

    res.json({
      success: true,
      data: {
        skills,
        groupedSkills,
        statistics: {
          totalSkills: skills.length,
          technicalSkills: skills.filter(s => s.type === 'TECHNICAL').length,
          softSkills: skills.filter(s => s.type === 'SOFT').length,
          averageProficiency: Math.round(
            skills.reduce((sum, s) => sum + s.proficiencyLevel, 0) / skills.length
          )
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching profile skills:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch skills' }
    });
  }
});

/**
 * GET /api/skills/categories
 * Get all skill categories
 */
router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.skill.findMany({
      select: { category: true },
      distinct: ['category'],
      where: {
        category: { not: null }
      }
    });

    const categoryList = categories
      .map(c => c.category)
      .filter(Boolean)
      .sort();

    res.json({
      success: true,
      data: { categories: categoryList }
    });

  } catch (error) {
    logger.error('Error fetching skill categories:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch skill categories' }
    });
  }
});

/**
 * GET /api/skills/trending
 * Get trending skills across all profiles
 */
router.get('/trending', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;

    const trendingSkills = await prisma.skill.groupBy({
      by: ['name', 'category'],
      _count: {
        name: true
      },
      _avg: {
        proficiencyLevel: true
      },
      orderBy: {
        _count: {
          name: 'desc'
        }
      },
      take: limit
    });

    const formattedSkills = trendingSkills.map(skill => ({
      name: skill.name,
      category: skill.category,
      count: skill._count.name,
      averageProficiency: Math.round(skill._avg.proficiencyLevel || 0)
    }));

    res.json({
      success: true,
      data: { trendingSkills: formattedSkills }
    });

  } catch (error) {
    logger.error('Error fetching trending skills:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch trending skills' }
    });
  }
});

/**
 * GET /api/skills/search
 * Search for skills by name
 */
router.get('/search', async (req, res) => {
  try {
    const { q, category, limit = 10 } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        success: false,
        error: { message: 'Search query is required' }
      });
    }

    const skills = await prisma.skill.findMany({
      where: {
        name: {
          contains: q,
          mode: 'insensitive'
        },
        ...(category && { category: category as string })
      },
      select: {
        name: true,
        category: true,
        proficiencyLevel: true
      },
      distinct: ['name', 'category'],
      take: parseInt(limit as string),
      orderBy: {
        name: 'asc'
      }
    });

    res.json({
      success: true,
      data: { skills }
    });

  } catch (error) {
    logger.error('Error searching skills:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to search skills' }
    });
  }
});

/**
 * GET /api/skills/analytics/:profileId
 * Get skills analytics for a profile
 */
router.get('/analytics/:profileId', authenticateToken, async (req, res) => {
  try {
    const { profileId } = req.params;
    const userId = req.user?.id;

    // Verify user owns this profile
    const profile = await prisma.candidateProfile.findFirst({
      where: {
        id: profileId,
        cvUpload: {
          userId
        }
      }
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: { message: 'Profile not found' }
      });
    }

    const skills = await prisma.skill.findMany({
      where: { profileId }
    });

    // Calculate analytics
    const analytics = {
      skillDistribution: skills.reduce((acc, skill) => {
        const category = skill.category || 'Other';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      
      proficiencyDistribution: {
        expert: skills.filter(s => s.proficiencyLevel >= 80).length,
        advanced: skills.filter(s => s.proficiencyLevel >= 60 && s.proficiencyLevel < 80).length,
        intermediate: skills.filter(s => s.proficiencyLevel >= 40 && s.proficiencyLevel < 60).length,
        beginner: skills.filter(s => s.proficiencyLevel < 40).length
      },

      topSkills: skills
        .sort((a, b) => b.proficiencyLevel - a.proficiencyLevel)
        .slice(0, 10)
        .map(s => ({
          name: s.name,
          category: s.category,
          proficiencyLevel: s.proficiencyLevel,
          yearsExperience: s.yearsExperience
        })),

      skillGaps: await getSkillGaps(skills),
      
      benchmarking: await getBenchmarkData(skills)
    };

    res.json({
      success: true,
      data: { analytics }
    });

  } catch (error) {
    logger.error('Error fetching skills analytics:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch skills analytics' }
    });
  }
});

/**
 * Helper function to identify skill gaps
 */
async function getSkillGaps(userSkills: any[]): Promise<string[]> {
  try {
    // Get trending skills in the same categories
    const userCategories = [...new Set(userSkills.map(s => s.category).filter(Boolean))];
    
    const trendingInCategories = await prisma.skill.groupBy({
      by: ['name'],
      where: {
        category: { in: userCategories },
        name: { notIn: userSkills.map(s => s.name) }
      },
      _count: { name: true },
      orderBy: { _count: { name: 'desc' } },
      take: 5
    });

    return trendingInCategories.map(s => s.name);
  } catch (error) {
    logger.error('Error calculating skill gaps:', error);
    return [];
  }
}

/**
 * Helper function to get benchmark data
 */
async function getBenchmarkData(userSkills: any[]): Promise<any> {
  try {
    const benchmarks = {};
    
    for (const skill of userSkills.slice(0, 5)) { // Top 5 skills
      const avgProficiency = await prisma.skill.aggregate({
        where: { name: skill.name },
        _avg: { proficiencyLevel: true }
      });

      benchmarks[skill.name] = {
        userLevel: skill.proficiencyLevel,
        marketAverage: Math.round(avgProficiency._avg.proficiencyLevel || 0),
        percentile: await calculatePercentile(skill.name, skill.proficiencyLevel)
      };
    }

    return benchmarks;
  } catch (error) {
    logger.error('Error calculating benchmark data:', error);
    return {};
  }
}

/**
 * Helper function to calculate percentile for a skill
 */
async function calculatePercentile(skillName: string, userLevel: number): Promise<number> {
  try {
    const totalCount = await prisma.skill.count({
      where: { name: skillName }
    });

    const lowerCount = await prisma.skill.count({
      where: {
        name: skillName,
        proficiencyLevel: { lt: userLevel }
      }
    });

    return totalCount > 0 ? Math.round((lowerCount / totalCount) * 100) : 50;
  } catch (error) {
    logger.error('Error calculating percentile:', error);
    return 50;
  }
}

export default router;
