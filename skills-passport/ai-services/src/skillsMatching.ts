import fs from 'fs';
import path from 'path';

interface SkillMatch {
  skill: string;
  category: string;
  subcategory: string;
  confidence: number;
  onetCode?: string;
  proficiencyLevel?: number;
}

interface SkillTaxonomy {
  technical_skills: any;
  soft_skills: any;
  industry_specific: any;
  certifications: any[];
  skill_matching_rules: {
    fuzzy_matching: {
      threshold: number;
      algorithms: string[];
    };
    synonym_groups: Record<string, string[]>;
    context_keywords: Record<string, string[]>;
  };
}

export class SkillsMatcher {
  private taxonomy: SkillTaxonomy;
  private skillsIndex: Map<string, any> = new Map();

  constructor() {
    this.loadTaxonomy();
    this.buildSkillsIndex();
  }

  private loadTaxonomy(): void {
    const taxonomyPath = path.join(__dirname, '../data/onet-skills-taxonomy.json');
    const taxonomyData = fs.readFileSync(taxonomyPath, 'utf-8');
    this.taxonomy = JSON.parse(taxonomyData);
  }

  private buildSkillsIndex(): void {
    // Index technical skills
    Object.entries(this.taxonomy.technical_skills).forEach(([category, skills]) => {
      (skills as any[]).forEach(skill => {
        this.indexSkill(skill, 'TECHNICAL', category);
      });
    });

    // Index soft skills
    Object.entries(this.taxonomy.soft_skills).forEach(([category, skills]) => {
      (skills as any[]).forEach(skill => {
        this.indexSkill(skill, 'SOFT', category);
      });
    });

    // Index industry-specific skills
    Object.entries(this.taxonomy.industry_specific).forEach(([category, skills]) => {
      (skills as any[]).forEach(skill => {
        this.indexSkill(skill, 'INDUSTRY_SPECIFIC', category);
      });
    });

    // Index certifications
    this.taxonomy.certifications.forEach(cert => {
      this.indexSkill(cert, 'CERTIFICATION', cert.subcategory);
    });
  }

  private indexSkill(skill: any, category: string, subcategory: string): void {
    const key = skill.name.toLowerCase();
    this.skillsIndex.set(key, { ...skill, category, subcategory });

    // Index related terms
    if (skill.related_terms) {
      skill.related_terms.forEach((term: string) => {
        this.skillsIndex.set(term.toLowerCase(), { ...skill, category, subcategory });
      });
    }
  }

  /**
   * Match a list of free-text skills to standardized categories
   */
  public matchSkills(inputSkills: string[], context?: string): SkillMatch[] {
    const matches: SkillMatch[] = [];

    inputSkills.forEach(inputSkill => {
      const match = this.matchSingleSkill(inputSkill, context);
      if (match) {
        matches.push(match);
      }
    });

    return this.deduplicateMatches(matches);
  }

  /**
   * Match a single skill to the taxonomy
   */
  private matchSingleSkill(inputSkill: string, context?: string): SkillMatch | null {
    const normalizedInput = inputSkill.toLowerCase().trim();

    // 1. Exact match
    const exactMatch = this.skillsIndex.get(normalizedInput);
    if (exactMatch) {
      return {
        skill: exactMatch.name,
        category: exactMatch.category,
        subcategory: exactMatch.subcategory,
        confidence: 1.0,
        onetCode: exactMatch.onet_code,
        proficiencyLevel: this.assessProficiency(inputSkill, context, exactMatch)
      };
    }

    // 2. Synonym matching
    const synonymMatch = this.findSynonymMatch(normalizedInput);
    if (synonymMatch) {
      return {
        skill: synonymMatch.name,
        category: synonymMatch.category,
        subcategory: synonymMatch.subcategory,
        confidence: 0.9,
        onetCode: synonymMatch.onet_code,
        proficiencyLevel: this.assessProficiency(inputSkill, context, synonymMatch)
      };
    }

    // 3. Fuzzy matching
    const fuzzyMatch = this.findFuzzyMatch(normalizedInput);
    if (fuzzyMatch && fuzzyMatch.confidence >= this.taxonomy.skill_matching_rules.fuzzy_matching.threshold) {
      return {
        skill: fuzzyMatch.skill.name,
        category: fuzzyMatch.skill.category,
        subcategory: fuzzyMatch.skill.subcategory,
        confidence: fuzzyMatch.confidence,
        onetCode: fuzzyMatch.skill.onet_code,
        proficiencyLevel: this.assessProficiency(inputSkill, context, fuzzyMatch.skill)
      };
    }

    // 4. Partial matching for compound skills
    const partialMatch = this.findPartialMatch(normalizedInput);
    if (partialMatch) {
      return {
        skill: partialMatch.name,
        category: partialMatch.category,
        subcategory: partialMatch.subcategory,
        confidence: 0.7,
        onetCode: partialMatch.onet_code,
        proficiencyLevel: this.assessProficiency(inputSkill, context, partialMatch)
      };
    }

    return null;
  }

  private findSynonymMatch(input: string): any | null {
    for (const [canonical, synonyms] of Object.entries(this.taxonomy.skill_matching_rules.synonym_groups)) {
      if (synonyms.includes(input) || input.includes(canonical)) {
        return this.skillsIndex.get(canonical);
      }
    }
    return null;
  }

  private findFuzzyMatch(input: string): { skill: any; confidence: number } | null {
    let bestMatch: { skill: any; confidence: number } | null = null;

    for (const [key, skill] of this.skillsIndex.entries()) {
      const confidence = this.calculateSimilarity(input, key);
      if (confidence > (bestMatch?.confidence || 0)) {
        bestMatch = { skill, confidence };
      }
    }

    return bestMatch;
  }

  private findPartialMatch(input: string): any | null {
    for (const [key, skill] of this.skillsIndex.entries()) {
      if (input.includes(key) || key.includes(input)) {
        return skill;
      }
    }
    return null;
  }

  private calculateSimilarity(str1: string, str2: string): number {
    // Simple Levenshtein distance-based similarity
    const distance = this.levenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);
    return maxLength === 0 ? 1 : 1 - distance / maxLength;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Assess proficiency level based on context
   */
  private assessProficiency(skill: string, context?: string, taxonomySkill?: any): number {
    if (!context || !taxonomySkill?.proficiency_indicators) {
      return 3; // Default to intermediate
    }

    const contextLower = context.toLowerCase();
    let score = 1;

    // Check for leadership indicators
    const leadershipKeywords = this.taxonomy.skill_matching_rules.context_keywords.leadership || [];
    if (leadershipKeywords.some(keyword => contextLower.includes(keyword))) {
      score += 1;
    }

    // Check for years of experience
    const yearsMatch = contextLower.match(/(\d+)\s*(?:years?|yrs?)/);
    if (yearsMatch) {
      const years = parseInt(yearsMatch[1]);
      if (years >= 5) score += 1;
      if (years >= 10) score += 1;
    }

    // Check for advanced indicators
    const advancedKeywords = ['architect', 'senior', 'lead', 'expert', 'advanced'];
    if (advancedKeywords.some(keyword => contextLower.includes(keyword))) {
      score += 1;
    }

    // Check for specific proficiency indicators from taxonomy
    Object.entries(taxonomySkill.proficiency_indicators).forEach(([level, indicators]) => {
      const levelScore = level === 'beginner' ? 1 : level === 'intermediate' ? 2 : 
                        level === 'advanced' ? 4 : 5;
      
      if ((indicators as string[]).some(indicator => 
        contextLower.includes(indicator.toLowerCase()))) {
        score = Math.max(score, levelScore);
      }
    });

    return Math.min(Math.max(score, 1), 5);
  }

  /**
   * Remove duplicate matches and merge similar ones
   */
  private deduplicateMatches(matches: SkillMatch[]): SkillMatch[] {
    const uniqueMatches = new Map<string, SkillMatch>();

    matches.forEach(match => {
      const key = `${match.skill}-${match.category}`;
      const existing = uniqueMatches.get(key);

      if (!existing || match.confidence > existing.confidence) {
        uniqueMatches.set(key, match);
      }
    });

    return Array.from(uniqueMatches.values())
      .sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Extract skills from job description or CV text
   */
  public extractSkillsFromText(text: string): string[] {
    const skills: string[] = [];
    const textLower = text.toLowerCase();

    // Extract skills mentioned in the taxonomy
    for (const [key, skill] of this.skillsIndex.entries()) {
      if (textLower.includes(key)) {
        skills.push(skill.name);
      }
    }

    // Extract potential skills using patterns
    const skillPatterns = [
      /(?:experience with|skilled in|proficient in|expertise in|knowledge of)\s+([^,.;]+)/gi,
      /(?:technologies?|tools?|languages?|frameworks?):\s*([^.]+)/gi,
      /(?:using|worked with|implemented|developed with)\s+([A-Z][a-zA-Z0-9+#\s]+)/g
    ];

    skillPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const extractedSkills = match[1]
          .split(/[,;]/)
          .map(s => s.trim())
          .filter(s => s.length > 2 && s.length < 50);
        
        skills.push(...extractedSkills);
      }
    });

    return [...new Set(skills)]; // Remove duplicates
  }

  /**
   * Get skill categories summary
   */
  public getSkillsSummary(matches: SkillMatch[]): Record<string, number> {
    const summary: Record<string, number> = {
      TECHNICAL: 0,
      SOFT: 0,
      INDUSTRY_SPECIFIC: 0,
      CERTIFICATION: 0
    };

    matches.forEach(match => {
      summary[match.category] = (summary[match.category] || 0) + 1;
    });

    return summary;
  }
}
