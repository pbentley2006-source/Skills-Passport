import OpenAI from 'openai';

// Initialize OpenAI client (will use environment variable or fallback to demo mode)
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

export interface ExtractedSkills {
  technicalSkills: Array<{
    name: string;
    category: string;
    proficiencyLevel: number;
    yearsExperience?: number;
    confidence: number;
    onetCode?: string;
    onetCategory?: string;
  }>;
  softSkills: Array<{
    name: string;
    level: number;
    confidence: number;
    onetCode?: string;
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
    leadershipProfile: {
      type: 'entrepreneur' | 'intrapreneur' | 'corporate_leader' | 'p_and_l_manager' | 'individual_contributor';
      confidence: number;
      indicators: string[];
    };
  };
  skillsGapAnalysis?: {
    missingSkills: string[];
    developmentAreas: string[];
    strengths: string[];
  };
}

export class SimpleAIService {
  /**
   * Extract skills from CV text using OpenAI or fallback analysis
   */
  static async extractSkillsFromCV(cvText: string): Promise<ExtractedSkills> {
    console.log('🤖 Starting CV analysis...');
    console.log('📄 CV Text Length:', cvText.length);
    console.log('🔑 OpenAI Available:', !!openai);

    if (openai && cvText.length > 50) {
      try {
        return await this.extractWithOpenAI(cvText);
      } catch (error) {
        console.error('❌ OpenAI extraction failed:', error);
        console.log('🔄 Falling back to keyword analysis...');
        return this.extractWithKeywords(cvText);
      }
    } else {
      console.log('🔄 Using keyword analysis (no OpenAI key or short text)...');
      return this.extractWithKeywords(cvText);
    }
  }

  /**
   * Extract skills using OpenAI GPT
   */
  private static async extractWithOpenAI(cvText: string): Promise<ExtractedSkills> {
    const prompt = `
Analyze this CV/Resume and extract structured information. Return ONLY valid JSON with this exact structure:

{
  "technicalSkills": [
    {"name": "skill name", "category": "Programming|Frontend|Backend|Database|Cloud|DevOps|Tools|Framework", "proficiencyLevel": 1-100, "yearsExperience": number or null}
  ],
  "softSkills": [
    {"name": "skill name", "level": 1-100}
  ],
  "experience": [
    {"title": "job title", "company": "company name", "duration": "time period", "description": "role description", "keyAchievements": ["achievement 1", "achievement 2"]}
  ],
  "education": [
    {"degree": "degree name", "field": "field of study or null", "institution": "institution name", "year": "year or null"}
  ],
  "summary": {
    "totalExperience": "X years",
    "seniority": "Junior|Mid|Senior|Lead|Principal",
    "primaryDomain": "main area of expertise"
  }
}

CV Text:
${cvText.substring(0, 3000)}

Return only the JSON object, no other text.`;

    const response = await openai!.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert CV analyzer. Extract structured information and return only valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1500
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    try {
      const extractedData = JSON.parse(content) as ExtractedSkills;
      console.log('✅ OpenAI extraction successful');
      return extractedData;
    } catch (parseError) {
      console.error('❌ Failed to parse OpenAI response:', parseError);
      throw new Error('Invalid JSON response from OpenAI');
    }
  }

  /**
   * Fallback keyword-based extraction
   */
  private static extractWithKeywords(cvText: string): ExtractedSkills {
    const text = cvText.toLowerCase();
    
    // Calculate seniority score first to adjust skill detection
    const seniorityAnalysis = this.analyzeSeniority(text);
    console.log('👔 Seniority Analysis:', seniorityAnalysis);

    // Enhanced technical skills keywords (expanded for senior professionals)
    const techSkills = [
      // Programming Languages
      { keywords: ['javascript', 'js'], name: 'JavaScript', category: 'Programming' },
      { keywords: ['python'], name: 'Python', category: 'Programming' },
      { keywords: ['java'], name: 'Java', category: 'Programming' },
      { keywords: ['c#', 'csharp'], name: 'C#', category: 'Programming' },
      { keywords: ['c++', 'cpp'], name: 'C++', category: 'Programming' },
      { keywords: ['php'], name: 'PHP', category: 'Programming' },
      { keywords: ['ruby'], name: 'Ruby', category: 'Programming' },
      { keywords: ['go', 'golang'], name: 'Go', category: 'Programming' },
      { keywords: ['rust'], name: 'Rust', category: 'Programming' },
      { keywords: ['kotlin'], name: 'Kotlin', category: 'Programming' },
      { keywords: ['swift'], name: 'Swift', category: 'Programming' },
      { keywords: ['typescript'], name: 'TypeScript', category: 'Programming' },
      
      // Frontend Technologies
      { keywords: ['react', 'reactjs'], name: 'React', category: 'Frontend' },
      { keywords: ['angular'], name: 'Angular', category: 'Frontend' },
      { keywords: ['vue', 'vuejs'], name: 'Vue.js', category: 'Frontend' },
      { keywords: ['html'], name: 'HTML', category: 'Frontend' },
      { keywords: ['css'], name: 'CSS', category: 'Frontend' },
      { keywords: ['sass', 'scss'], name: 'Sass', category: 'Frontend' },
      { keywords: ['bootstrap'], name: 'Bootstrap', category: 'Frontend' },
      { keywords: ['tailwind'], name: 'Tailwind CSS', category: 'Frontend' },
      { keywords: ['jquery'], name: 'jQuery', category: 'Frontend' },
      
      // Backend Technologies
      { keywords: ['node', 'nodejs', 'node.js'], name: 'Node.js', category: 'Backend' },
      { keywords: ['express'], name: 'Express', category: 'Backend' },
      { keywords: ['django'], name: 'Django', category: 'Backend' },
      { keywords: ['flask'], name: 'Flask', category: 'Backend' },
      { keywords: ['spring'], name: 'Spring', category: 'Backend' },
      { keywords: ['laravel'], name: 'Laravel', category: 'Backend' },
      { keywords: ['rails'], name: 'Ruby on Rails', category: 'Backend' },
      
      // Databases
      { keywords: ['sql', 'mysql', 'postgresql'], name: 'SQL', category: 'Database' },
      { keywords: ['mongodb'], name: 'MongoDB', category: 'Database' },
      { keywords: ['redis'], name: 'Redis', category: 'Database' },
      { keywords: ['elasticsearch'], name: 'Elasticsearch', category: 'Database' },
      { keywords: ['oracle'], name: 'Oracle', category: 'Database' },
      { keywords: ['sqlite'], name: 'SQLite', category: 'Database' },
      
      // Cloud & DevOps
      { keywords: ['aws', 'amazon web services'], name: 'AWS', category: 'Cloud' },
      { keywords: ['azure'], name: 'Microsoft Azure', category: 'Cloud' },
      { keywords: ['gcp', 'google cloud'], name: 'Google Cloud', category: 'Cloud' },
      { keywords: ['docker'], name: 'Docker', category: 'DevOps' },
      { keywords: ['kubernetes', 'k8s'], name: 'Kubernetes', category: 'DevOps' },
      { keywords: ['jenkins'], name: 'Jenkins', category: 'DevOps' },
      { keywords: ['terraform'], name: 'Terraform', category: 'DevOps' },
      { keywords: ['ansible'], name: 'Ansible', category: 'DevOps' },
      
      // Tools & Methodologies
      { keywords: ['git'], name: 'Git', category: 'Tools' },
      { keywords: ['jira'], name: 'Jira', category: 'Tools' },
      { keywords: ['confluence'], name: 'Confluence', category: 'Tools' },
      { keywords: ['agile'], name: 'Agile', category: 'Methodology' },
      { keywords: ['scrum'], name: 'Scrum', category: 'Methodology' },
      { keywords: ['kanban'], name: 'Kanban', category: 'Methodology' },
      { keywords: ['devops'], name: 'DevOps', category: 'Methodology' },
      
      // Senior-Level Skills
      { keywords: ['architecture', 'system design'], name: 'System Architecture', category: 'Architecture' },
      { keywords: ['microservices'], name: 'Microservices', category: 'Architecture' },
      { keywords: ['api design', 'rest', 'graphql'], name: 'API Design', category: 'Architecture' },
      { keywords: ['performance optimization'], name: 'Performance Optimization', category: 'Architecture' },
      { keywords: ['scalability'], name: 'Scalability', category: 'Architecture' },
      { keywords: ['security'], name: 'Security', category: 'Architecture' },
      
      // Business & Leadership (for senior roles)
      { keywords: ['strategic planning', 'strategy'], name: 'Strategic Planning', category: 'Leadership' },
      { keywords: ['stakeholder management'], name: 'Stakeholder Management', category: 'Leadership' },
      { keywords: ['budget management', 'budgeting'], name: 'Budget Management', category: 'Leadership' },
      { keywords: ['team leadership', 'people management'], name: 'Team Leadership', category: 'Leadership' },
      { keywords: ['change management'], name: 'Change Management', category: 'Leadership' },
      { keywords: ['business development'], name: 'Business Development', category: 'Leadership' },
      { keywords: ['risk management'], name: 'Risk Management', category: 'Leadership' },
      { keywords: ['compliance'], name: 'Compliance', category: 'Leadership' },
      { keywords: ['governance'], name: 'Governance', category: 'Leadership' },
      { keywords: ['mentoring', 'coaching'], name: 'Mentoring & Coaching', category: 'Leadership' },
    ];

    // Soft skills keywords
    const softSkills = [
      { keywords: ['leadership', 'lead', 'manage', 'management'], name: 'Leadership' },
      { keywords: ['communication', 'communicate'], name: 'Communication' },
      { keywords: ['teamwork', 'team', 'collaboration'], name: 'Teamwork' },
      { keywords: ['problem solving', 'analytical'], name: 'Problem Solving' },
      { keywords: ['creative', 'creativity'], name: 'Creativity' },
      { keywords: ['adaptable', 'flexible'], name: 'Adaptability' },
    ];

    // Extract technical skills with confidence scoring and O*NET mapping
    const foundTechSkills = techSkills
      .filter(skill => skill.keywords.some(keyword => text.includes(keyword)))
      .map(skill => {
        const confidence = this.calculateSkillConfidence(skill, text, seniorityAnalysis);
        const onetMapping = this.mapToONET(skill.name, skill.category);
        return {
          name: skill.name,
          category: skill.category,
          proficiencyLevel: this.calculateSkillProficiency(skill, seniorityAnalysis, text),
          yearsExperience: this.estimateSkillExperience(skill, seniorityAnalysis, text),
          confidence,
          onetCode: onetMapping.code,
          onetCategory: onetMapping.category
        };
      });

    // Extract soft skills with confidence scoring
    const foundSoftSkills = softSkills
      .filter(skill => skill.keywords.some(keyword => text.includes(keyword)))
      .map(skill => {
        const confidence = this.calculateSkillConfidence(skill, text, seniorityAnalysis);
        const onetMapping = this.mapToONET(skill.name, 'Soft Skills');
        return {
          name: skill.name,
          level: Math.floor(Math.random() * 20) + 70, // 70-90 range
          confidence,
          onetCode: onetMapping.code
        };
      });

    // Extract experience info with better parsing
    const experience = this.extractExperienceFromText(text);

    // Extract education info
    const educationKeywords = ['university', 'college', 'degree', 'bachelor', 'master', 'phd', 'education'];
    const hasEducation = educationKeywords.some(keyword => text.includes(keyword));
    
    const education = hasEducation ? [
      {
        degree: 'Degree',
        field: 'Relevant Field',
        institution: 'Educational Institution',
        year: '2020'
      }
    ] : [];

    // Determine primary domain with enhanced logic
    let primaryDomain = this.determinePrimaryDomain(foundTechSkills, text, seniorityAnalysis);
    
    // Analyze leadership profile
    const leadershipProfile = this.analyzeLeadershipProfile(text, seniorityAnalysis);

    const result: ExtractedSkills = {
      technicalSkills: foundTechSkills,
      softSkills: foundSoftSkills,
      experience,
      education,
      summary: {
        totalExperience: seniorityAnalysis.totalExperience,
        seniority: seniorityAnalysis.level,
        primaryDomain,
        leadershipProfile
      }
    };

    console.log('✅ Keyword extraction completed');
    console.log('📊 Found technical skills:', foundTechSkills.length);
    console.log('📊 Found soft skills:', foundSoftSkills.length);
    
    return result;
  }

  /**
   * Extract experience information from CV text
   */
  private static extractExperienceFromText(text: string): Array<{
    title: string;
    company: string;
    duration: string;
    description: string;
    keyAchievements: string[];
  }> {
    const experience = [];
    
    // Common job titles to look for
    const jobTitles = [
      'manager', 'director', 'coordinator', 'specialist', 'analyst', 'consultant',
      'developer', 'engineer', 'designer', 'architect', 'lead', 'senior',
      'junior', 'associate', 'assistant', 'executive', 'officer', 'supervisor',
      'administrator', 'technician', 'representative', 'advisor', 'strategist'
    ];

    // Look for job titles in the text
    const foundTitles = jobTitles.filter(title => 
      text.toLowerCase().includes(title)
    );

    // Company indicators
    const companyIndicators = ['ltd', 'inc', 'corp', 'company', 'group', 'organization', 'agency'];
    
    // Duration patterns
    const durationPatterns = [
      /(\d{4})\s*[-–]\s*(\d{4}|present|current)/gi,
      /(\d{1,2})\s*(years?|months?)/gi
    ];

    let companyCount = 1;
    
    if (foundTitles.length > 0) {
      // Create experience entries based on found job titles
      const uniqueTitles = [...new Set(foundTitles)];
      
      for (let i = 0; i < Math.min(uniqueTitles.length, 3); i++) {
        const title = uniqueTitles[i];
        
        // Try to find duration information
        let duration = '2+ years';
        const durationMatch = text.match(durationPatterns[0]);
        if (durationMatch && durationMatch[i]) {
          duration = durationMatch[i];
        }

        // Generate realistic job title
        const capitalizedTitle = title.charAt(0).toUpperCase() + title.slice(1);
        const jobTitle = foundTitles.includes('senior') ? `Senior ${capitalizedTitle}` :
                        foundTitles.includes('junior') ? `Junior ${capitalizedTitle}` :
                        foundTitles.includes('lead') ? `Lead ${capitalizedTitle}` :
                        capitalizedTitle;

        // Extract key achievements and create contextual description
        const achievementWords = ['led', 'managed', 'developed', 'implemented', 'improved', 'created', 'designed', 'built', 'increased', 'reduced', 'coordinated', 'supervised', 'delivered', 'optimized'];
        const foundAchievements = achievementWords.filter(word => text.toLowerCase().includes(word));
        
        // Create more contextual description based on role and found content
        const description = this.generateJobDescription(title, text, foundAchievements);
        
        // Generate specific achievements
        const achievements = this.extractSpecificAchievements(text, foundAchievements);

        experience.push({
          title: jobTitle,
          company: `Company ${String.fromCharCode(64 + companyCount)}`, // Company A, B, C...
          duration: duration,
          description: description,
          keyAchievements: achievements
        });
        
        companyCount++;
      }
    }

    // If no specific titles found, create a generic entry if there are experience indicators
    if (experience.length === 0) {
      const experienceKeywords = ['experience', 'worked', 'employment', 'career', 'position', 'role'];
      const hasExperience = experienceKeywords.some(keyword => text.toLowerCase().includes(keyword));
      
      if (hasExperience) {
        experience.push({
          title: 'Professional Role',
          company: 'Company A',
          duration: '2+ years',
          description: 'Professional experience in relevant field with demonstrated skills and contributions.',
          keyAchievements: ['Contributed to projects and initiatives', 'Developed relevant professional skills']
        });
      }
    }

    console.log('📋 Extracted experience entries:', experience.length);
    return experience;
  }

  /**
   * Generate contextual job description based on role and CV content
   */
  private static generateJobDescription(jobTitle: string, cvText: string, achievements: string[]): string {
    const text = cvText.toLowerCase();
    
    // Role-specific description templates
    const roleDescriptions: { [key: string]: string[] } = {
      'manager': [
        'Led cross-functional teams and strategic initiatives',
        'Oversaw operational excellence and team development',
        'Managed budgets, resources, and stakeholder relationships'
      ],
      'director': [
        'Provided strategic leadership and organizational direction',
        'Drove business growth and operational transformation',
        'Managed executive relationships and high-level initiatives'
      ],
      'analyst': [
        'Conducted data analysis and provided strategic insights',
        'Developed reports and recommendations for decision-making',
        'Analyzed market trends and business performance metrics'
      ],
      'consultant': [
        'Provided expert advisory services to clients',
        'Developed solutions and strategic recommendations',
        'Facilitated organizational change and process improvement'
      ],
      'coordinator': [
        'Coordinated projects and cross-departmental initiatives',
        'Managed schedules, resources, and stakeholder communication',
        'Ensured smooth operations and process efficiency'
      ],
      'specialist': [
        'Applied specialized expertise to complex challenges',
        'Developed and implemented best practices',
        'Provided technical guidance and subject matter expertise'
      ],
      'developer': [
        'Designed and developed software solutions',
        'Collaborated with teams to deliver technical projects',
        'Maintained code quality and system performance'
      ],
      'engineer': [
        'Designed and implemented technical solutions',
        'Applied engineering principles to solve complex problems',
        'Collaborated on system architecture and optimization'
      ]
    };

    // Find the most relevant description based on job title
    let baseDescription = 'Contributed to organizational success through professional expertise and dedicated performance.';
    
    for (const [role, descriptions] of Object.entries(roleDescriptions)) {
      if (jobTitle.toLowerCase().includes(role)) {
        baseDescription = descriptions[Math.floor(Math.random() * descriptions.length)];
        break;
      }
    }

    // Enhance description based on found achievements and context
    const contextualElements = [];
    
    if (achievements.includes('led') || achievements.includes('managed')) {
      contextualElements.push('with strong leadership capabilities');
    }
    if (achievements.includes('developed') || achievements.includes('created')) {
      contextualElements.push('focusing on innovation and development');
    }
    if (achievements.includes('improved') || achievements.includes('optimized')) {
      contextualElements.push('driving continuous improvement');
    }
    if (text.includes('team') || text.includes('collaboration')) {
      contextualElements.push('in collaborative team environments');
    }
    if (text.includes('client') || text.includes('customer')) {
      contextualElements.push('with strong client relationship management');
    }

    // Combine base description with contextual elements
    if (contextualElements.length > 0) {
      const context = contextualElements.slice(0, 2).join(' and ');
      baseDescription += ` ${context}.`;
    }

    return baseDescription;
  }

  /**
   * Extract specific achievements from CV text
   */
  private static extractSpecificAchievements(cvText: string, foundAchievements: string[]): string[] {
    const text = cvText.toLowerCase();
    const achievements = [];

    // Achievement patterns with context
    const achievementPatterns = [
      { words: ['increased', 'improved', 'enhanced'], template: 'Enhanced operational efficiency and performance metrics' },
      { words: ['led', 'managed', 'supervised'], template: 'Led teams and managed key organizational initiatives' },
      { words: ['developed', 'created', 'designed'], template: 'Developed innovative solutions and strategic approaches' },
      { words: ['implemented', 'delivered', 'executed'], template: 'Successfully implemented projects and delivered results' },
      { words: ['reduced', 'optimized', 'streamlined'], template: 'Optimized processes and reduced operational costs' },
      { words: ['coordinated', 'organized'], template: 'Coordinated cross-functional projects and initiatives' }
    ];

    // Look for specific metrics or numbers that might indicate achievements
    const metricPatterns = [
      /(\d+)%/g,  // Percentages
      /\$(\d+)/g, // Dollar amounts
      /(\d+)\s*(million|thousand|k)/gi // Large numbers
    ];

    let hasMetrics = false;
    for (const pattern of metricPatterns) {
      if (text.match(pattern)) {
        hasMetrics = true;
        break;
      }
    }

    // Generate achievements based on found patterns
    for (const pattern of achievementPatterns) {
      if (pattern.words.some(word => foundAchievements.includes(word))) {
        let achievement = pattern.template;
        
        // Add quantifiable element if metrics were found
        if (hasMetrics && Math.random() > 0.5) {
          achievement += ' with measurable impact';
        }
        
        achievements.push(achievement);
        
        if (achievements.length >= 2) break; // Limit to 2 achievements
      }
    }

    // Fallback achievements if none found
    if (achievements.length === 0) {
      const fallbackAchievements = [
        'Contributed to key organizational objectives and initiatives',
        'Demonstrated strong professional competencies and results',
        'Collaborated effectively with teams and stakeholders',
        'Maintained high standards of quality and performance'
      ];
      
      achievements.push(
        fallbackAchievements[Math.floor(Math.random() * fallbackAchievements.length)],
        fallbackAchievements[Math.floor(Math.random() * fallbackAchievements.length)]
      );
    }

    return achievements.slice(0, 2); // Return max 2 achievements
  }

  /**
   * Analyze seniority based on tenure, titles, and scope
   */
  private static analyzeSeniority(cvText: string): {
    score: number;
    level: string;
    totalExperience: string;
    indicators: string[];
  } {
    const text = cvText.toLowerCase();
    let score = 0;
    const indicators: string[] = [];

    // Title-based scoring
    const seniorTitles = [
      { patterns: ['chief', 'cto', 'ceo', 'cfo', 'coo'], points: 50, label: 'C-Level Executive' },
      { patterns: ['vp', 'vice president', 'president'], points: 45, label: 'VP Level' },
      { patterns: ['director', 'head of'], points: 40, label: 'Director Level' },
      { patterns: ['principal', 'staff'], points: 35, label: 'Principal/Staff Level' },
      { patterns: ['senior', 'sr.', 'lead', 'team lead'], points: 25, label: 'Senior Level' },
      { patterns: ['manager', 'supervisor'], points: 20, label: 'Management' },
      { patterns: ['specialist', 'expert'], points: 15, label: 'Specialist' },
      { patterns: ['consultant'], points: 20, label: 'Consultant' },
    ];

    for (const titleGroup of seniorTitles) {
      for (const pattern of titleGroup.patterns) {
        if (text.includes(pattern)) {
          score += titleGroup.points;
          indicators.push(titleGroup.label);
          break; // Only count once per group
        }
      }
    }

    // Tenure-based scoring (look for date ranges and experience mentions)
    const experiencePatterns = [
      /(\d{1,2})\+?\s*years?/gi,
      /(\d{4})\s*[-–]\s*(\d{4}|present|current)/gi,
      /(over|more than)\s*(\d{1,2})\s*years?/gi,
    ];

    let maxYears = 0;
    for (const pattern of experiencePatterns) {
      const matches = text.match(pattern);
      if (matches) {
        for (const match of matches) {
          const yearMatch = match.match(/\d{1,2}/);
          if (yearMatch) {
            const years = parseInt(yearMatch[0]);
            maxYears = Math.max(maxYears, years);
          }
        }
      }
    }

    // Date range calculation
    const dateRanges = text.match(/(\d{4})\s*[-–]\s*(\d{4}|present|current)/gi);
    if (dateRanges) {
      let totalCareerYears = 0;
      for (const range of dateRanges) {
        const parts = range.match(/(\d{4})\s*[-–]\s*(\d{4}|present|current)/i);
        if (parts) {
          const startYear = parseInt(parts[1]);
          const endYear = parts[2].toLowerCase().includes('present') || parts[2].toLowerCase().includes('current') 
            ? new Date().getFullYear() 
            : parseInt(parts[2]);
          totalCareerYears = Math.max(totalCareerYears, endYear - startYear);
        }
      }
      maxYears = Math.max(maxYears, totalCareerYears);
    }

    // Experience scoring
    if (maxYears >= 15) {
      score += 30;
      indicators.push('15+ Years Experience');
    } else if (maxYears >= 10) {
      score += 25;
      indicators.push('10+ Years Experience');
    } else if (maxYears >= 7) {
      score += 20;
      indicators.push('7+ Years Experience');
    } else if (maxYears >= 5) {
      score += 15;
      indicators.push('5+ Years Experience');
    } else if (maxYears >= 3) {
      score += 10;
      indicators.push('3+ Years Experience');
    }

    // Scope and responsibility indicators
    const scopeIndicators = [
      { patterns: ['budget', 'million', 'revenue'], points: 15, label: 'Budget/Revenue Responsibility' },
      { patterns: ['team of', 'managed', 'supervised'], points: 10, label: 'Team Management' },
      { patterns: ['strategic', 'strategy'], points: 10, label: 'Strategic Role' },
      { patterns: ['board', 'executive', 'stakeholder'], points: 15, label: 'Executive Interaction' },
      { patterns: ['acquisition', 'merger', 'ipo'], points: 20, label: 'Major Business Events' },
      { patterns: ['transformation', 'change management'], points: 15, label: 'Organizational Change' },
      { patterns: ['compliance', 'governance', 'audit'], points: 10, label: 'Governance Role' },
    ];

    for (const indicator of scopeIndicators) {
      if (indicator.patterns.some(pattern => text.includes(pattern))) {
        score += indicator.points;
        indicators.push(indicator.label);
      }
    }

    // Determine level and experience description
    let level: string;
    let totalExperience: string;

    if (score >= 80) {
      level = 'Executive';
      totalExperience = maxYears >= 15 ? `${maxYears}+ years` : '15+ years';
    } else if (score >= 60) {
      level = 'Senior';
      totalExperience = maxYears >= 10 ? `${maxYears} years` : '10+ years';
    } else if (score >= 40) {
      level = 'Mid-Senior';
      totalExperience = maxYears >= 7 ? `${maxYears} years` : '7+ years';
    } else if (score >= 25) {
      level = 'Mid';
      totalExperience = maxYears >= 5 ? `${maxYears} years` : '5+ years';
    } else if (score >= 15) {
      level = 'Junior-Mid';
      totalExperience = maxYears >= 3 ? `${maxYears} years` : '3+ years';
    } else {
      level = 'Junior';
      totalExperience = maxYears > 0 ? `${maxYears} years` : '1-2 years';
    }

    return { score, level, totalExperience, indicators };
  }

  /**
   * Calculate skill proficiency based on seniority and context
   */
  private static calculateSkillProficiency(skill: any, seniorityAnalysis: any, cvText: string): number {
    let baseProficiency = 60; // Base proficiency

    // Adjust based on seniority level
    if (seniorityAnalysis.level === 'Executive') baseProficiency = 85;
    else if (seniorityAnalysis.level === 'Senior') baseProficiency = 80;
    else if (seniorityAnalysis.level === 'Mid-Senior') baseProficiency = 75;
    else if (seniorityAnalysis.level === 'Mid') baseProficiency = 70;
    else if (seniorityAnalysis.level === 'Junior-Mid') baseProficiency = 65;

    // Adjust based on skill category for senior roles
    if (seniorityAnalysis.score >= 40) {
      if (skill.category === 'Leadership' || skill.category === 'Architecture') {
        baseProficiency += 10; // Senior people likely have high leadership/architecture skills
      }
    }

    // Add some variation but keep it realistic
    const variation = Math.floor(Math.random() * 15) - 7; // -7 to +7
    const finalProficiency = Math.max(50, Math.min(95, baseProficiency + variation));

    return finalProficiency;
  }

  /**
   * Estimate skill experience based on seniority
   */
  private static estimateSkillExperience(skill: any, seniorityAnalysis: any, cvText: string): number {
    const totalYears = parseInt(seniorityAnalysis.totalExperience) || 5;
    
    // Estimate skill experience as a portion of total experience
    let skillExperience: number;
    
    if (skill.category === 'Leadership' || skill.category === 'Architecture') {
      // Leadership skills typically develop later in career
      skillExperience = Math.max(1, Math.floor(totalYears * 0.6));
    } else if (skill.category === 'Programming' || skill.category === 'Tools') {
      // Technical skills might span most of career
      skillExperience = Math.max(1, Math.floor(totalYears * 0.8));
    } else {
      // Other skills
      skillExperience = Math.max(1, Math.floor(totalYears * 0.7));
    }

    return Math.min(skillExperience, totalYears);
  }

  /**
   * Determine primary domain with enhanced logic
   */
  private static determinePrimaryDomain(skills: any[], cvText: string, seniorityAnalysis: any): string {
    const text = cvText.toLowerCase();
    
    // Count skills by category
    const categoryCount: { [key: string]: number } = {};
    skills.forEach(skill => {
      categoryCount[skill.category] = (categoryCount[skill.category] || 0) + 1;
    });

    // For senior roles, look for leadership indicators
    if (seniorityAnalysis.score >= 60) {
      if (categoryCount['Leadership'] > 0 || text.includes('strategic') || text.includes('executive')) {
        return 'Executive Leadership';
      }
    }

    // Determine primary domain based on skill distribution
    const sortedCategories = Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a);

    if (sortedCategories.length === 0) return 'General Management';

    const primaryCategory = sortedCategories[0][0];
    
    // Map categories to domains
    const domainMapping: { [key: string]: string } = {
      'Programming': 'Software Development',
      'Frontend': 'Frontend Development', 
      'Backend': 'Backend Development',
      'Database': 'Data Management',
      'Cloud': 'Cloud Architecture',
      'DevOps': 'DevOps Engineering',
      'Architecture': 'System Architecture',
      'Leadership': 'Leadership & Management',
      'Tools': 'Technical Operations',
      'Methodology': 'Process & Methodology'
    };

    return domainMapping[primaryCategory] || 'Technology Leadership';
  }

  /**
   * Calculate confidence score for skill detection
   */
  private static calculateSkillConfidence(skill: any, cvText: string, seniorityAnalysis: any): number {
    const text = cvText.toLowerCase();
    let confidence = 50; // Base confidence
    
    // Multiple mentions increase confidence
    const mentionCount = skill.keywords.reduce((count: number, keyword: string) => {
      const regex = new RegExp(keyword, 'gi');
      const matches = text.match(regex);
      return count + (matches ? matches.length : 0);
    }, 0);
    
    confidence += Math.min(mentionCount * 15, 30); // Up to +30 for multiple mentions
    
    // Context relevance (skill appears near relevant terms)
    const contextWords = ['experience', 'skilled', 'proficient', 'expert', 'years', 'worked with'];
    for (const keyword of skill.keywords) {
      for (const contextWord of contextWords) {
        if (text.includes(`${contextWord} ${keyword}`) || text.includes(`${keyword} ${contextWord}`)) {
          confidence += 10;
          break;
        }
      }
    }
    
    // Seniority alignment
    if (seniorityAnalysis.score >= 60 && (skill.category === 'Leadership' || skill.category === 'Architecture')) {
      confidence += 15; // Senior people likely have leadership/architecture skills
    }
    
    // Skill category alignment with detected domain
    if (skill.category === 'Programming' && text.includes('developer')) confidence += 10;
    if (skill.category === 'Leadership' && text.includes('manager')) confidence += 10;
    
    return Math.min(95, Math.max(30, confidence));
  }

  /**
   * Map skills to O*NET taxonomy
   */
  private static mapToONET(skillName: string, category: string): { code?: string; category?: string } {
    // Simplified O*NET mapping - in production, this would use the full O*NET database
    const onetMapping: { [key: string]: { code: string; category: string } } = {
      // Programming Languages
      'JavaScript': { code: '2.B.5.a', category: 'Computer Programming' },
      'Python': { code: '2.B.5.a', category: 'Computer Programming' },
      'Java': { code: '2.B.5.a', category: 'Computer Programming' },
      'TypeScript': { code: '2.B.5.a', category: 'Computer Programming' },
      
      // Technical Skills
      'React': { code: '2.B.5.b', category: 'Web Development' },
      'Node.js': { code: '2.B.5.c', category: 'Server Programming' },
      'SQL': { code: '2.B.5.d', category: 'Database Management' },
      'AWS': { code: '2.B.5.e', category: 'Cloud Computing' },
      'Docker': { code: '2.B.5.f', category: 'Systems Administration' },
      
      // Leadership Skills
      'Leadership': { code: '2.B.1.a', category: 'Management' },
      'Strategic Planning': { code: '2.B.1.b', category: 'Strategic Management' },
      'Team Leadership': { code: '2.B.1.c', category: 'Personnel Management' },
      'Budget Management': { code: '2.B.1.d', category: 'Financial Management' },
      
      // Soft Skills
      'Communication': { code: '2.A.1.a', category: 'Oral Communication' },
      'Problem Solving': { code: '2.A.1.b', category: 'Critical Thinking' },
      'Teamwork': { code: '2.A.1.c', category: 'Coordination' },
      'Adaptability': { code: '2.A.1.d', category: 'Adaptability/Flexibility' },
      
      // Architecture & Design
      'System Architecture': { code: '2.B.5.g', category: 'Systems Architecture' },
      'Microservices': { code: '2.B.5.h', category: 'Distributed Systems' },
      'API Design': { code: '2.B.5.i', category: 'Interface Design' },
    };
    
    const mapping = onetMapping[skillName];
    return mapping || { code: undefined, category: category };
  }

  /**
   * Analyze leadership profile and entrepreneurial indicators
   */
  private static analyzeLeadershipProfile(cvText: string, seniorityAnalysis: any): {
    type: 'entrepreneur' | 'intrapreneur' | 'corporate_leader' | 'p_and_l_manager' | 'individual_contributor';
    confidence: number;
    indicators: string[];
  } {
    const text = cvText.toLowerCase();
    const indicators: string[] = [];
    let scores = {
      entrepreneur: 0,
      intrapreneur: 0,
      corporate_leader: 0,
      p_and_l_manager: 0,
      individual_contributor: 0
    };

    // Entrepreneur indicators
    const entrepreneurPatterns = [
      { patterns: ['founder', 'co-founder', 'started', 'launched'], points: 30, label: 'Company Founder' },
      { patterns: ['startup', 'venture', 'angel investor'], points: 25, label: 'Startup Experience' },
      { patterns: ['raised funding', 'series a', 'series b', 'ipo'], points: 25, label: 'Funding Experience' },
      { patterns: ['business owner', 'self-employed'], points: 20, label: 'Business Ownership' },
      { patterns: ['patent', 'intellectual property'], points: 15, label: 'Innovation' },
    ];

    // Intrapreneur indicators
    const intrapreneurPatterns = [
      { patterns: ['innovation', 'new product', 'product development'], points: 20, label: 'Product Innovation' },
      { patterns: ['business development', 'new market', 'expansion'], points: 20, label: 'Business Development' },
      { patterns: ['transformation', 'digital transformation'], points: 15, label: 'Transformation Leadership' },
      { patterns: ['incubator', 'internal startup', 'skunkworks'], points: 25, label: 'Internal Innovation' },
      { patterns: ['venture capital', 'corporate venture'], points: 15, label: 'Corporate Venturing' },
    ];

    // Corporate Leader indicators
    const corporateLeaderPatterns = [
      { patterns: ['ceo', 'cto', 'cfo', 'coo', 'chief'], points: 30, label: 'C-Level Executive' },
      { patterns: ['vice president', 'vp', 'senior vice president'], points: 25, label: 'VP Level' },
      { patterns: ['director', 'head of', 'general manager'], points: 20, label: 'Director Level' },
      { patterns: ['board', 'board member', 'advisory board'], points: 20, label: 'Board Experience' },
      { patterns: ['merger', 'acquisition', 'm&a'], points: 15, label: 'M&A Experience' },
    ];

    // P&L Manager indicators
    const plManagerPatterns = [
      { patterns: ['p&l', 'profit and loss', 'p & l'], points: 30, label: 'P&L Responsibility' },
      { patterns: ['budget', 'million', 'billion', 'revenue'], points: 25, label: 'Budget Management' },
      { patterns: ['cost center', 'profit center'], points: 20, label: 'Financial Center Management' },
      { patterns: ['financial performance', 'roi', 'return on investment'], points: 15, label: 'Financial Performance' },
      { patterns: ['business unit', 'division', 'region'], points: 15, label: 'Business Unit Leadership' },
    ];

    // Individual Contributor indicators
    const icPatterns = [
      { patterns: ['individual contributor', 'ic', 'specialist'], points: 20, label: 'IC Role' },
      { patterns: ['technical lead', 'tech lead', 'senior engineer'], points: 15, label: 'Technical Leadership' },
      { patterns: ['subject matter expert', 'sme'], points: 15, label: 'Subject Matter Expert' },
      { patterns: ['consultant', 'advisor'], points: 10, label: 'Advisory Role' },
    ];

    // Score each category
    const allPatterns = [
      { category: 'entrepreneur', patterns: entrepreneurPatterns },
      { category: 'intrapreneur', patterns: intrapreneurPatterns },
      { category: 'corporate_leader', patterns: corporateLeaderPatterns },
      { category: 'p_and_l_manager', patterns: plManagerPatterns },
      { category: 'individual_contributor', patterns: icPatterns }
    ];

    for (const category of allPatterns) {
      for (const patternGroup of category.patterns) {
        if (patternGroup.patterns.some(pattern => text.includes(pattern))) {
          scores[category.category as keyof typeof scores] += patternGroup.points;
          indicators.push(patternGroup.label);
        }
      }
    }

    // Adjust scores based on seniority
    if (seniorityAnalysis.score >= 80) {
      scores.corporate_leader += 15;
      scores.p_and_l_manager += 10;
    } else if (seniorityAnalysis.score >= 60) {
      scores.corporate_leader += 10;
      scores.intrapreneur += 10;
    } else if (seniorityAnalysis.score < 30) {
      scores.individual_contributor += 20;
    }

    // Determine primary type
    const maxScore = Math.max(...Object.values(scores));
    const primaryType = Object.entries(scores).find(([_, score]) => score === maxScore)?.[0] || 'individual_contributor';
    
    // Calculate confidence based on score and indicators
    const confidence = Math.min(95, Math.max(30, maxScore + (indicators.length * 5)));

    return {
      type: primaryType as any,
      confidence,
      indicators: indicators.slice(0, 5) // Top 5 indicators
    };
  }

  /**
   * Anonymize CV content
   */
  static anonymizeCV(cvText: string): string {
    let anonymized = cvText;
    
    // Replace common personal info patterns
    anonymized = anonymized.replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, 'Anonymous Professional');
    anonymized = anonymized.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[Phone Number]');
    anonymized = anonymized.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[Email Address]');
    anonymized = anonymized.replace(/\b\d{1,5}\s+[\w\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd)\b/gi, '[Address]');
    
    return anonymized;
  }
}

export default SimpleAIService;
