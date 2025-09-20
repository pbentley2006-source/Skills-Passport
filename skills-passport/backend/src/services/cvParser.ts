import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import OpenAI from 'openai';
import { logger } from '../utils/logger';
import { createError } from '../middleware/errorHandler';

interface ParsedCVData {
  rawText: string;
  structured: {
    personalInfo: {
      name?: string;
      email?: string;
      phone?: string;
      location?: string;
      linkedin?: string;
    };
    workExperience: Array<{
      company: string;
      position: string;
      startDate: string;
      endDate?: string;
      responsibilities: string[];
      achievements: string[];
    }>;
    skills: {
      technical: string[];
      soft: string[];
      languages: string[];
    };
    education: Array<{
      institution: string;
      degree: string;
      field: string;
      year: string;
      gpa?: string;
    }>;
    certifications: string[];
    projects?: Array<{
      name: string;
      description: string;
      technologies: string[];
      duration?: string;
    }>;
  };
}

export class CVParser {
  private openai: OpenAI;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Parse CV file and extract structured data
   */
  async parseCV(filePath: string, mimeType: string): Promise<ParsedCVData> {
    try {
      logger.info('Starting CV parsing', { filePath, mimeType });

      // Extract text from file
      const rawText = await this.extractTextFromFile(filePath, mimeType);

      if (!rawText || rawText.trim().length < 50) {
        throw createError('CV file appears to be empty or corrupted', 400);
      }

      // Use OpenAI to structure the data
      const structured = await this.structureDataWithAI(rawText);

      // Validate and clean the structured data
      const cleanedData = this.validateAndCleanData(structured);

      logger.info('CV parsing completed successfully', { 
        textLength: rawText.length,
        hasPersonalInfo: !!cleanedData.personalInfo.name,
        workExperienceCount: cleanedData.workExperience.length,
        skillsCount: cleanedData.skills.technical.length + cleanedData.skills.soft.length
      });

      return {
        rawText,
        structured: cleanedData
      };

    } catch (error) {
      logger.error('CV parsing failed', { filePath, error: error.message });
      throw error;
    }
  }

  /**
   * Extract text from different file formats
   */
  private async extractTextFromFile(filePath: string, mimeType: string): Promise<string> {
    try {
      switch (mimeType) {
        case 'application/pdf':
          return await this.extractFromPDF(filePath);
        
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        case 'application/msword':
          return await this.extractFromWord(filePath);
        
        case 'text/plain':
          return await this.extractFromText(filePath);
        
        default:
          throw createError(`Unsupported file type: ${mimeType}`, 400);
      }
    } catch (error) {
      logger.error('Text extraction failed', { filePath, mimeType, error: error.message });
      throw createError('Failed to extract text from file', 500);
    }
  }

  /**
   * Extract text from PDF file
   */
  private async extractFromPDF(filePath: string): Promise<string> {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  }

  /**
   * Extract text from Word document
   */
  private async extractFromWord(filePath: string): Promise<string> {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  /**
   * Extract text from plain text file
   */
  private async extractFromText(filePath: string): Promise<string> {
    return fs.readFileSync(filePath, 'utf-8');
  }

  /**
   * Use OpenAI to structure the CV data
   */
  private async structureDataWithAI(rawText: string): Promise<any> {
    const prompt = this.buildParsingPrompt(rawText);

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert CV parser. Extract structured information from CVs and return valid JSON only. Do not include any explanatory text, just the JSON response.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 4000
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Parse JSON response
      try {
        return JSON.parse(content);
      } catch (parseError) {
        // Try to extract JSON from response if it's wrapped in text
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        throw new Error('Invalid JSON response from AI');
      }

    } catch (error) {
      logger.error('OpenAI parsing failed', { error: error.message });
      
      // Fallback to basic parsing if AI fails
      return this.fallbackParsing(rawText);
    }
  }

  /**
   * Build the parsing prompt for OpenAI
   */
  private buildParsingPrompt(cvText: string): string {
    return `
Analyze the following CV and extract structured information in JSON format. Follow this exact schema:

{
  "personalInfo": {
    "name": "string",
    "email": "string", 
    "phone": "string",
    "location": "string",
    "linkedin": "string"
  },
  "workExperience": [
    {
      "company": "string",
      "position": "string",
      "startDate": "string (YYYY-MM or YYYY)",
      "endDate": "string (YYYY-MM or YYYY) or null if current",
      "responsibilities": ["string"],
      "achievements": ["string"]
    }
  ],
  "skills": {
    "technical": ["string"],
    "soft": ["string"],
    "languages": ["string"]
  },
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "field": "string",
      "year": "string",
      "gpa": "string"
    }
  ],
  "certifications": ["string"],
  "projects": [
    {
      "name": "string",
      "description": "string",
      "technologies": ["string"],
      "duration": "string"
    }
  ]
}

Important guidelines:
- Extract only information that is explicitly mentioned
- Use null for missing optional fields
- Standardize date formats to YYYY-MM or YYYY
- Separate technical skills (programming, tools, technologies) from soft skills (communication, leadership)
- Include programming languages in technical skills, human languages in languages array
- Extract key achievements and quantifiable results
- If a section is not found, use empty arrays or null values

CV Content:
${cvText}
`;
  }

  /**
   * Fallback parsing when AI fails
   */
  private fallbackParsing(rawText: string): any {
    logger.warn('Using fallback parsing method');

    const lines = rawText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Basic extraction patterns
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
    
    const email = rawText.match(emailRegex)?.[0] || null;
    const phone = rawText.match(phoneRegex)?.[0] || null;

    // Extract potential skills (basic keyword matching)
    const technicalKeywords = ['JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'AWS', 'Docker'];
    const foundTechnicalSkills = technicalKeywords.filter(skill => 
      rawText.toLowerCase().includes(skill.toLowerCase())
    );

    return {
      personalInfo: {
        name: null,
        email,
        phone,
        location: null,
        linkedin: null
      },
      workExperience: [],
      skills: {
        technical: foundTechnicalSkills,
        soft: [],
        languages: []
      },
      education: [],
      certifications: [],
      projects: []
    };
  }

  /**
   * Validate and clean the structured data
   */
  private validateAndCleanData(data: any): any {
    const cleaned = {
      personalInfo: {
        name: this.cleanString(data.personalInfo?.name),
        email: this.cleanEmail(data.personalInfo?.email),
        phone: this.cleanString(data.personalInfo?.phone),
        location: this.cleanString(data.personalInfo?.location),
        linkedin: this.cleanString(data.personalInfo?.linkedin)
      },
      workExperience: this.cleanWorkExperience(data.workExperience || []),
      skills: {
        technical: this.cleanSkillsArray(data.skills?.technical || []),
        soft: this.cleanSkillsArray(data.skills?.soft || []),
        languages: this.cleanSkillsArray(data.skills?.languages || [])
      },
      education: this.cleanEducation(data.education || []),
      certifications: this.cleanSkillsArray(data.certifications || []),
      projects: this.cleanProjects(data.projects || [])
    };

    return cleaned;
  }

  private cleanString(value: any): string | null {
    if (typeof value !== 'string' || !value.trim()) return null;
    return value.trim();
  }

  private cleanEmail(value: any): string | null {
    const cleaned = this.cleanString(value);
    if (!cleaned) return null;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(cleaned) ? cleaned.toLowerCase() : null;
  }

  private cleanSkillsArray(skills: any[]): string[] {
    if (!Array.isArray(skills)) return [];
    
    return skills
      .filter(skill => typeof skill === 'string' && skill.trim().length > 0)
      .map(skill => skill.trim())
      .filter((skill, index, arr) => arr.indexOf(skill) === index) // Remove duplicates
      .slice(0, 50); // Limit to reasonable number
  }

  private cleanWorkExperience(experiences: any[]): any[] {
    if (!Array.isArray(experiences)) return [];

    return experiences
      .filter(exp => exp && typeof exp === 'object')
      .map(exp => ({
        company: this.cleanString(exp.company) || 'Unknown Company',
        position: this.cleanString(exp.position) || 'Unknown Position',
        startDate: this.cleanString(exp.startDate) || '',
        endDate: this.cleanString(exp.endDate),
        responsibilities: this.cleanSkillsArray(exp.responsibilities || []),
        achievements: this.cleanSkillsArray(exp.achievements || [])
      }))
      .slice(0, 10); // Limit to reasonable number
  }

  private cleanEducation(education: any[]): any[] {
    if (!Array.isArray(education)) return [];

    return education
      .filter(edu => edu && typeof edu === 'object')
      .map(edu => ({
        institution: this.cleanString(edu.institution) || 'Unknown Institution',
        degree: this.cleanString(edu.degree) || 'Unknown Degree',
        field: this.cleanString(edu.field) || '',
        year: this.cleanString(edu.year) || '',
        gpa: this.cleanString(edu.gpa)
      }))
      .slice(0, 5); // Limit to reasonable number
  }

  private cleanProjects(projects: any[]): any[] {
    if (!Array.isArray(projects)) return [];

    return projects
      .filter(proj => proj && typeof proj === 'object')
      .map(proj => ({
        name: this.cleanString(proj.name) || 'Unnamed Project',
        description: this.cleanString(proj.description) || '',
        technologies: this.cleanSkillsArray(proj.technologies || []),
        duration: this.cleanString(proj.duration)
      }))
      .slice(0, 10); // Limit to reasonable number
  }
}
