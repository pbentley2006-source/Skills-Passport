import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

interface AnonymizationResult {
  professionalSummary: string;
  workExperience: Array<{
    anonymizedCompany: string;
    position: string;
    startDate: string;
    endDate?: string;
    responsibilities: string[];
    achievements: string[];
  }>;
  skills: Array<{
    name: string;
    category: string;
    proficiencyLevel: number;
    yearsExperience?: number;
    context?: string;
  }>;
  education: Array<{
    degree: string;
    field: string;
    year: string;
    anonymizedInstitution: string;
    gpa?: string;
  }>;
  certifications: string[];
  projects?: Array<{
    name: string;
    description: string;
    technologies: string[];
    duration?: string;
  }>;
}

export class AnonymizationEngine {
  private prisma: PrismaClient;
  private companyMappings: Map<string, string> = new Map();
  private institutionMappings: Map<string, string> = new Map();
  private locationMappings: Map<string, string> = new Map();

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Anonymize CV data while preserving professional value
   */
  async anonymizeCV(cvData: any): Promise<AnonymizationResult> {
    try {
      logger.info('Starting CV anonymization');

      // Load existing mappings
      await this.loadExistingMappings();

      // Anonymize each section
      const anonymizedWorkExperience = await this.anonymizeWorkExperience(cvData.workExperience || []);
      const anonymizedEducation = await this.anonymizeEducation(cvData.education || []);
      const anonymizedProjects = await this.anonymizeProjects(cvData.projects || []);
      const professionalSummary = this.generateProfessionalSummary(cvData, anonymizedWorkExperience);
      const processedSkills = this.processSkills(cvData.skills || {});

      // Save new mappings
      await this.saveMappings();

      const result: AnonymizationResult = {
        professionalSummary,
        workExperience: anonymizedWorkExperience,
        skills: processedSkills,
        education: anonymizedEducation,
        certifications: cvData.certifications || [],
        projects: anonymizedProjects
      };

      logger.info('CV anonymization completed successfully', {
        workExperienceCount: anonymizedWorkExperience.length,
        skillsCount: processedSkills.length,
        educationCount: anonymizedEducation.length
      });

      return result;

    } catch (error) {
      logger.error('CV anonymization failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Load existing anonymization mappings from database
   */
  private async loadExistingMappings(): Promise<void> {
    const [companyMappings, anonymizationMappings] = await Promise.all([
      this.prisma.companyMapping.findMany(),
      this.prisma.anonymizationMapping.findMany()
    ]);

    // Load company mappings
    companyMappings.forEach(mapping => {
      this.companyMappings.set(mapping.originalName, mapping.anonymizedName);
    });

    // Load other mappings
    anonymizationMappings.forEach(mapping => {
      switch (mapping.type) {
        case 'INSTITUTION':
          this.institutionMappings.set(mapping.originalValue, mapping.anonymizedValue);
          break;
        case 'LOCATION':
          this.locationMappings.set(mapping.originalValue, mapping.anonymizedValue);
          break;
      }
    });
  }

  /**
   * Save new mappings to database
   */
  private async saveMappings(): Promise<void> {
    // Save company mappings
    for (const [original, anonymized] of this.companyMappings.entries()) {
      await this.prisma.companyMapping.upsert({
        where: { originalName: original },
        update: {},
        create: {
          originalName: original,
          anonymizedName: anonymized,
          industry: this.inferIndustry(original),
          size: this.inferCompanySize(original)
        }
      });
    }

    // Save other mappings
    const mappingsToSave = [
      ...Array.from(this.institutionMappings.entries()).map(([original, anonymized]) => ({
        originalValue: original,
        anonymizedValue: anonymized,
        type: 'INSTITUTION' as const
      })),
      ...Array.from(this.locationMappings.entries()).map(([original, anonymized]) => ({
        originalValue: original,
        anonymizedValue: anonymized,
        type: 'LOCATION' as const
      }))
    ];

    for (const mapping of mappingsToSave) {
      await this.prisma.anonymizationMapping.upsert({
        where: {
          originalValue_type: {
            originalValue: mapping.originalValue,
            type: mapping.type
          }
        },
        update: {},
        create: mapping
      });
    }
  }

  /**
   * Anonymize work experience section
   */
  private async anonymizeWorkExperience(workExperience: any[]): Promise<AnonymizationResult['workExperience']> {
    return workExperience.map(exp => {
      const anonymizedCompany = this.getAnonymizedCompany(exp.company);
      
      return {
        anonymizedCompany,
        position: exp.position, // Keep position titles as they're valuable
        startDate: exp.startDate,
        endDate: exp.endDate,
        responsibilities: this.anonymizeResponsibilities(exp.responsibilities || []),
        achievements: this.anonymizeAchievements(exp.achievements || [])
      };
    });
  }

  /**
   * Get or create anonymized company name
   */
  private getAnonymizedCompany(originalCompany: string): string {
    if (!originalCompany) return 'Company A';

    const normalized = originalCompany.trim();
    
    if (this.companyMappings.has(normalized)) {
      return this.companyMappings.get(normalized)!;
    }

    // Generate new anonymized name
    const existingCount = this.companyMappings.size;
    const anonymizedName = `Company ${String.fromCharCode(65 + existingCount)}`;
    
    this.companyMappings.set(normalized, anonymizedName);
    return anonymizedName;
  }

  /**
   * Anonymize responsibilities while preserving technical content
   */
  private anonymizeResponsibilities(responsibilities: string[]): string[] {
    return responsibilities.map(resp => {
      let anonymized = resp;
      
      // Remove specific company references but keep generic ones
      anonymized = this.removeSpecificReferences(anonymized);
      
      // Remove specific project names but keep generic descriptions
      anonymized = this.anonymizeProjectReferences(anonymized);
      
      // Remove specific client names
      anonymized = this.anonymizeClientReferences(anonymized);
      
      return anonymized;
    });
  }

  /**
   * Anonymize achievements while preserving metrics
   */
  private anonymizeAchievements(achievements: string[]): string[] {
    return achievements.map(achievement => {
      let anonymized = achievement;
      
      // Keep quantifiable results but remove specific references
      anonymized = this.removeSpecificReferences(anonymized);
      anonymized = this.anonymizeProjectReferences(anonymized);
      
      return anonymized;
    });
  }

  /**
   * Remove specific company/product references
   */
  private removeSpecificReferences(text: string): string {
    // Remove specific product names but keep generic terms
    const productPatterns = [
      /\b[A-Z][a-zA-Z]*\s+(Platform|System|Application|Tool|Service)\b/g,
      /\b(Project|System|Platform)\s+[A-Z][a-zA-Z]*\b/g
    ];

    let result = text;
    productPatterns.forEach(pattern => {
      result = result.replace(pattern, (match) => {
        if (match.includes('Platform')) return 'internal platform';
        if (match.includes('System')) return 'internal system';
        if (match.includes('Application')) return 'web application';
        if (match.includes('Tool')) return 'internal tool';
        if (match.includes('Service')) return 'web service';
        return 'internal project';
      });
    });

    return result;
  }

  /**
   * Anonymize project references
   */
  private anonymizeProjectReferences(text: string): string {
    // Replace specific project names with generic terms
    return text.replace(/\b(Project|Initiative)\s+[A-Z][a-zA-Z]*\b/g, 'key project')
               .replace(/\b[A-Z][a-zA-Z]*\s+(Project|Initiative)\b/g, 'major initiative');
  }

  /**
   * Anonymize client references
   */
  private anonymizeClientReferences(text: string): string {
    return text.replace(/\b(client|customer)\s+[A-Z][a-zA-Z]*\b/gi, 'key client')
               .replace(/\bfor\s+[A-Z][a-zA-Z]+(\s+[A-Z][a-zA-Z]+)?\b/g, 'for major client');
  }

  /**
   * Anonymize education section
   */
  private async anonymizeEducation(education: any[]): Promise<AnonymizationResult['education']> {
    return education.map((edu, index) => {
      const anonymizedInstitution = this.getAnonymizedInstitution(edu.institution, index);
      
      return {
        degree: edu.degree,
        field: edu.field,
        year: edu.year,
        anonymizedInstitution,
        gpa: edu.gpa
      };
    });
  }

  /**
   * Get or create anonymized institution name
   */
  private getAnonymizedInstitution(originalInstitution: string, index: number): string {
    if (!originalInstitution) return `University ${String.fromCharCode(65 + index)}`;

    const normalized = originalInstitution.trim();
    
    if (this.institutionMappings.has(normalized)) {
      return this.institutionMappings.get(normalized)!;
    }

    // Generate new anonymized name
    const existingCount = this.institutionMappings.size;
    const anonymizedName = `University ${String.fromCharCode(65 + existingCount)}`;
    
    this.institutionMappings.set(normalized, anonymizedName);
    return anonymizedName;
  }

  /**
   * Anonymize projects section
   */
  private async anonymizeProjects(projects: any[]): Promise<AnonymizationResult['projects']> {
    if (!projects || projects.length === 0) return [];

    return projects.map(project => ({
      name: this.anonymizeProjectName(project.name),
      description: this.anonymizeProjectDescription(project.description),
      technologies: project.technologies || [], // Keep technologies as they're valuable
      duration: project.duration
    }));
  }

  /**
   * Anonymize project names
   */
  private anonymizeProjectName(name: string): string {
    if (!name) return 'Internal Project';
    
    // Keep generic project types but remove specific names
    const genericTypes = ['E-commerce', 'Mobile App', 'Web Platform', 'Data Analytics', 'API', 'Dashboard'];
    
    for (const type of genericTypes) {
      if (name.toLowerCase().includes(type.toLowerCase())) {
        return type + ' Project';
      }
    }
    
    return 'Software Project';
  }

  /**
   * Anonymize project descriptions
   */
  private anonymizeProjectDescription(description: string): string {
    if (!description) return '';
    
    let anonymized = description;
    anonymized = this.removeSpecificReferences(anonymized);
    anonymized = this.anonymizeClientReferences(anonymized);
    
    return anonymized;
  }

  /**
   * Process and categorize skills
   */
  private processSkills(skills: any): AnonymizationResult['skills'] {
    const allSkills = [
      ...(skills.technical || []).map((skill: string) => ({
        name: skill,
        category: 'TECHNICAL',
        proficiencyLevel: this.estimateProficiency(skill, 'technical'),
        yearsExperience: this.estimateYearsExperience(skill)
      })),
      ...(skills.soft || []).map((skill: string) => ({
        name: skill,
        category: 'SOFT',
        proficiencyLevel: this.estimateProficiency(skill, 'soft'),
        yearsExperience: this.estimateYearsExperience(skill)
      })),
      ...(skills.languages || []).map((skill: string) => ({
        name: skill,
        category: 'LANGUAGE',
        proficiencyLevel: this.estimateProficiency(skill, 'language'),
        yearsExperience: this.estimateYearsExperience(skill)
      }))
    ];

    return allSkills;
  }

  /**
   * Estimate skill proficiency (1-5 scale)
   */
  private estimateProficiency(skill: string, category: string): number {
    // This is a simplified estimation - in practice, you'd use the SkillsMatcher
    // and context from work experience to make better estimates
    
    const commonSkills = ['JavaScript', 'Python', 'Java', 'SQL', 'HTML', 'CSS'];
    const advancedSkills = ['Machine Learning', 'Kubernetes', 'System Architecture'];
    
    if (advancedSkills.some(advanced => skill.toLowerCase().includes(advanced.toLowerCase()))) {
      return 4; // Advanced
    }
    
    if (commonSkills.some(common => skill.toLowerCase().includes(common.toLowerCase()))) {
      return 3; // Intermediate
    }
    
    return 3; // Default to intermediate
  }

  /**
   * Estimate years of experience with skill
   */
  private estimateYearsExperience(skill: string): number {
    // This would be better estimated from work experience context
    return Math.floor(Math.random() * 5) + 1; // 1-5 years
  }

  /**
   * Generate professional summary
   */
  private generateProfessionalSummary(cvData: any, workExperience: any[]): string {
    const totalYears = this.calculateTotalExperience(workExperience);
    const primarySkills = (cvData.skills?.technical || []).slice(0, 3).join(', ');
    const seniority = totalYears >= 8 ? 'Senior' : totalYears >= 5 ? 'Experienced' : totalYears >= 2 ? 'Mid-level' : 'Junior';
    
    let summary = `${seniority} professional with ${totalYears}+ years of experience`;
    
    if (primarySkills) {
      summary += ` in software development. Expertise in ${primarySkills}`;
    }
    
    summary += ' with a proven track record of delivering high-quality solutions and contributing to successful project outcomes.';
    
    if (workExperience.length > 0) {
      summary += ` Experience across ${workExperience.length} organizations, demonstrating adaptability and diverse industry knowledge.`;
    }
    
    return summary;
  }

  /**
   * Calculate total years of experience
   */
  private calculateTotalExperience(workExperience: any[]): number {
    let totalMonths = 0;
    
    workExperience.forEach(exp => {
      const start = new Date(exp.startDate + '-01'); // Add day if missing
      const end = exp.endDate ? new Date(exp.endDate + '-01') : new Date();
      
      const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
      totalMonths += Math.max(months, 0);
    });
    
    return Math.max(Math.round(totalMonths / 12), 1);
  }

  /**
   * Infer industry from company name (basic implementation)
   */
  private inferIndustry(companyName: string): string {
    const name = companyName.toLowerCase();
    
    if (name.includes('tech') || name.includes('software') || name.includes('digital')) {
      return 'Technology';
    }
    if (name.includes('bank') || name.includes('finance') || name.includes('capital')) {
      return 'Financial Services';
    }
    if (name.includes('health') || name.includes('medical') || name.includes('pharma')) {
      return 'Healthcare';
    }
    if (name.includes('retail') || name.includes('commerce') || name.includes('shop')) {
      return 'Retail';
    }
    
    return 'Other';
  }

  /**
   * Infer company size (basic implementation)
   */
  private inferCompanySize(companyName: string): string {
    // This would ideally use external data sources
    return 'Unknown';
  }
}
