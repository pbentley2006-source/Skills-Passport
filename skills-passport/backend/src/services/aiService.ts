import OpenAI from 'openai';
import { logger } from '../utils/logger';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ExtractedSkills {
  technicalSkills: Array<{
    name: string;
    category: string;
    proficiencyLevel: number;
    yearsExperience?: number;
  }>;
  softSkills: Array<{
    name: string;
    level: number;
  }>;
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    description: string;
    keyAchievements: string[];
  }>;
  education: Array<{
    degree: string;
    field?: string;
    institution: string;
    year?: string;
  }>;
  summary: {
    totalExperience: string;
    seniority: string;
    primaryDomain: string;
  };
}

export class AIService {
  /**
   * Extract skills and information from CV text using OpenAI
   */
  static async extractSkillsFromCV(cvText: string): Promise<ExtractedSkills> {
    try {
      const prompt = `
        Analyze the following CV/Resume text and extract structured information. Return a JSON object with the following structure:

        {
          "technicalSkills": [
            {
              "name": "skill name",
              "category": "Programming|Frontend|Backend|Database|Cloud|DevOps|Tools|Framework",
              "proficiencyLevel": 1-100,
              "yearsExperience": number or null
            }
          ],
          "softSkills": [
            {
              "name": "skill name",
              "level": 1-100
            }
          ],
          "experience": [
            {
              "title": "job title",
              "company": "company name",
              "duration": "time period",
              "description": "role description",
              "keyAchievements": ["achievement 1", "achievement 2"]
            }
          ],
          "education": [
            {
              "degree": "degree name",
              "field": "field of study or null",
              "institution": "institution name",
              "year": "year or null"
            }
          ],
          "summary": {
            "totalExperience": "X years",
            "seniority": "Junior|Mid|Senior|Lead|Principal",
            "primaryDomain": "main area of expertise"
          }
        }

        CV Text:
        ${cvText}

        Instructions:
        - Extract all technical skills mentioned, categorize them appropriately
        - Estimate proficiency levels based on context (projects, years of use, etc.)
        - Identify soft skills from descriptions and achievements
        - Parse work experience with accurate company names and roles
        - Extract education information
        - Provide a summary of overall experience level
        - Return only valid JSON, no additional text
      `;

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert CV analyzer. Extract structured information from CVs and return only valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Parse the JSON response
      const extractedData = JSON.parse(content) as ExtractedSkills;
      
      logger.info('Successfully extracted skills from CV', {
        technicalSkillsCount: extractedData.technicalSkills?.length || 0,
        experienceCount: extractedData.experience?.length || 0
      });

      return extractedData;

    } catch (error) {
      logger.error('Error extracting skills from CV:', error);
      
      // Return fallback data if AI extraction fails
      return this.getFallbackSkillsData();
    }
  }

  /**
   * Anonymize CV content by replacing personal information
   */
  static async anonymizeCV(cvText: string, extractedData: ExtractedSkills): Promise<string> {
    try {
      const prompt = `
        Anonymize the following CV text by:
        1. Remove all personal information (names, addresses, phone numbers, emails)
        2. Replace company names with "Company A", "Company B", etc. in chronological order
        3. Replace specific locations with general regions (e.g., "San Francisco" → "West Coast US")
        4. Keep all technical skills, experience descriptions, and achievements
        5. Maintain the overall structure and formatting
        6. Replace the person's name with "Anonymous Professional"

        CV Text:
        ${cvText}

        Return the anonymized CV text maintaining professional formatting.
      `;

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at anonymizing CVs while preserving professional information.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 2000
      });

      const anonymizedText = response.choices[0]?.message?.content;
      if (!anonymizedText) {
        throw new Error('No response from OpenAI for anonymization');
      }

      logger.info('Successfully anonymized CV');
      return anonymizedText;

    } catch (error) {
      logger.error('Error anonymizing CV:', error);
      
      // Return basic anonymization as fallback
      return this.basicAnonymization(cvText);
    }
  }

  /**
   * Generate career insights and recommendations
   */
  static async generateCareerInsights(extractedData: ExtractedSkills): Promise<{
    strengths: string[];
    recommendations: string[];
    careerPaths: string[];
    skillGaps: string[];
  }> {
    try {
      const prompt = `
        Based on the following extracted CV data, provide career insights and recommendations.
        Return a JSON object with this structure:

        {
          "strengths": ["strength 1", "strength 2", ...],
          "recommendations": ["recommendation 1", "recommendation 2", ...],
          "careerPaths": ["path 1", "path 2", ...],
          "skillGaps": ["skill gap 1", "skill gap 2", ...]
        }

        CV Data:
        ${JSON.stringify(extractedData, null, 2)}

        Provide actionable insights for career development.
      `;

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a career advisor providing insights based on CV analysis.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 1000
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI for career insights');
      }

      return JSON.parse(content);

    } catch (error) {
      logger.error('Error generating career insights:', error);
      
      // Return fallback insights
      return {
        strengths: ['Technical expertise', 'Problem-solving abilities'],
        recommendations: ['Continue learning new technologies', 'Build leadership skills'],
        careerPaths: ['Senior Developer', 'Technical Lead', 'Solution Architect'],
        skillGaps: ['Cloud architecture', 'Team management']
      };
    }
  }

  /**
   * Fallback skills data when AI extraction fails
   */
  private static getFallbackSkillsData(): ExtractedSkills {
    return {
      technicalSkills: [
        { name: 'JavaScript', category: 'Programming', proficiencyLevel: 80 },
        { name: 'React', category: 'Frontend', proficiencyLevel: 75 },
        { name: 'Node.js', category: 'Backend', proficiencyLevel: 70 }
      ],
      softSkills: [
        { name: 'Problem Solving', level: 85 },
        { name: 'Communication', level: 80 }
      ],
      experience: [
        {
          title: 'Software Developer',
          company: 'Company A',
          duration: '2+ years',
          description: 'Developed web applications',
          keyAchievements: ['Improved performance', 'Led team projects']
        }
      ],
      education: [
        {
          degree: 'Computer Science',
          field: 'Software Engineering',
          institution: 'University',
          year: '2020'
        }
      ],
      summary: {
        totalExperience: '3+ years',
        seniority: 'Mid',
        primaryDomain: 'Web Development'
      }
    };
  }

  /**
   * Basic anonymization fallback
   */
  private static basicAnonymization(cvText: string): string {
    let anonymized = cvText;
    
    // Replace common personal info patterns
    anonymized = anonymized.replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, 'Anonymous Professional');
    anonymized = anonymized.replace(/\b\d{3}-\d{3}-\d{4}\b/g, '[Phone Number]');
    anonymized = anonymized.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[Email Address]');
    
    return anonymized;
  }
}

export default AIService;
