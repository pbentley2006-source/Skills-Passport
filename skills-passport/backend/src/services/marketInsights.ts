export interface MarketInsight {
  skill: string;
  category: string;
  demandScore: number; // 0-100
  salaryRange: {
    min: number;
    max: number;
    median: number;
    currency: string;
  };
  growthTrend: number; // Percentage growth year-over-year
  jobOpenings: number;
  topCompanies: string[];
  relatedSkills: string[];
  certifications: string[];
  regions: Array<{
    name: string;
    demand: number;
    salary: number;
  }>;
}

export interface CareerPathway {
  currentRole: string;
  nextRoles: Array<{
    title: string;
    timeToAchieve: string;
    requiredSkills: string[];
    salaryIncrease: number;
    probability: number;
  }>;
}

export interface SkillRecommendation {
  skill: string;
  reason: string;
  impact: number; // 0-100 potential career impact
  difficulty: number; // 0-100 learning difficulty
  timeToLearn: string;
  resources: Array<{
    type: 'course' | 'certification' | 'book' | 'practice';
    name: string;
    provider: string;
    url?: string;
    cost?: string;
  }>;
}

export class MarketInsightsService {
  /**
   * Get market insights for user's skills
   */
  static getMarketInsights(userSkills: Array<{ name: string; category: string; level: number }>): MarketInsight[] {
    // In production, this would connect to real market data APIs
    // For now, we'll use realistic mock data based on current market trends
    
    const marketData: { [key: string]: Partial<MarketInsight> } = {
      // Programming Languages
      'JavaScript': {
        demandScore: 95,
        salaryRange: { min: 70000, max: 150000, median: 95000, currency: 'USD' },
        growthTrend: 12,
        jobOpenings: 45000,
        topCompanies: ['Google', 'Meta', 'Netflix', 'Airbnb', 'Stripe'],
        relatedSkills: ['React', 'Node.js', 'TypeScript', 'Vue.js'],
        certifications: ['AWS Certified Developer', 'Google Cloud Professional'],
        regions: [
          { name: 'San Francisco', demand: 98, salary: 130000 },
          { name: 'New York', demand: 92, salary: 115000 },
          { name: 'Austin', demand: 88, salary: 95000 },
          { name: 'Remote', demand: 85, salary: 90000 }
        ]
      },
      'Python': {
        demandScore: 92,
        salaryRange: { min: 75000, max: 160000, median: 105000, currency: 'USD' },
        growthTrend: 18,
        jobOpenings: 38000,
        topCompanies: ['Google', 'Tesla', 'Netflix', 'Spotify', 'Dropbox'],
        relatedSkills: ['Django', 'Flask', 'Pandas', 'TensorFlow', 'AWS'],
        certifications: ['Python Institute PCAP', 'AWS Machine Learning'],
        regions: [
          { name: 'San Francisco', demand: 95, salary: 140000 },
          { name: 'Seattle', demand: 90, salary: 125000 },
          { name: 'Boston', demand: 85, salary: 110000 }
        ]
      },
      'React': {
        demandScore: 90,
        salaryRange: { min: 65000, max: 140000, median: 90000, currency: 'USD' },
        growthTrend: 15,
        jobOpenings: 32000,
        topCompanies: ['Facebook', 'Airbnb', 'Uber', 'WhatsApp', 'Instagram'],
        relatedSkills: ['JavaScript', 'Redux', 'Next.js', 'GraphQL'],
        certifications: ['React Developer Certification', 'Frontend Masters'],
        regions: [
          { name: 'San Francisco', demand: 95, salary: 125000 },
          { name: 'New York', demand: 88, salary: 105000 },
          { name: 'Los Angeles', demand: 82, salary: 95000 }
        ]
      },
      'AWS': {
        demandScore: 88,
        salaryRange: { min: 80000, max: 180000, median: 120000, currency: 'USD' },
        growthTrend: 25,
        jobOpenings: 28000,
        topCompanies: ['Amazon', 'Netflix', 'Capital One', 'GE', 'NASA'],
        relatedSkills: ['Docker', 'Kubernetes', 'Terraform', 'Python'],
        certifications: ['AWS Solutions Architect', 'AWS DevOps Engineer'],
        regions: [
          { name: 'Seattle', demand: 98, salary: 150000 },
          { name: 'Virginia', demand: 92, salary: 130000 },
          { name: 'San Francisco', demand: 90, salary: 145000 }
        ]
      },
      // Leadership Skills
      'Strategic Planning': {
        demandScore: 85,
        salaryRange: { min: 120000, max: 300000, median: 180000, currency: 'USD' },
        growthTrend: 8,
        jobOpenings: 15000,
        topCompanies: ['McKinsey', 'BCG', 'Bain', 'Deloitte', 'PwC'],
        relatedSkills: ['Leadership', 'Business Development', 'Change Management'],
        certifications: ['PMP', 'Strategic Management', 'MBA'],
        regions: [
          { name: 'New York', demand: 95, salary: 220000 },
          { name: 'San Francisco', demand: 88, salary: 200000 },
          { name: 'Chicago', demand: 82, salary: 170000 }
        ]
      },
      'Leadership': {
        demandScore: 82,
        salaryRange: { min: 100000, max: 250000, median: 150000, currency: 'USD' },
        growthTrend: 10,
        jobOpenings: 22000,
        topCompanies: ['Google', 'Microsoft', 'Apple', 'Amazon', 'Tesla'],
        relatedSkills: ['Team Management', 'Strategic Planning', 'Communication'],
        certifications: ['Leadership Certificate', 'Executive MBA', 'Scrum Master'],
        regions: [
          { name: 'San Francisco', demand: 92, salary: 180000 },
          { name: 'New York', demand: 90, salary: 165000 },
          { name: 'Seattle', demand: 85, salary: 155000 }
        ]
      }
    };

    return userSkills
      .map(skill => {
        const data = marketData[skill.name];
        if (!data) return null;

        return {
          skill: skill.name,
          category: skill.category,
          demandScore: data.demandScore || 50,
          salaryRange: data.salaryRange || { min: 50000, max: 100000, median: 75000, currency: 'USD' },
          growthTrend: data.growthTrend || 5,
          jobOpenings: data.jobOpenings || 1000,
          topCompanies: data.topCompanies || ['Various Companies'],
          relatedSkills: data.relatedSkills || [],
          certifications: data.certifications || [],
          regions: data.regions || [{ name: 'National Average', demand: 50, salary: 75000 }]
        } as MarketInsight;
      })
      .filter(Boolean) as MarketInsight[];
  }

  /**
   * Generate skill recommendations based on user profile
   */
  static generateSkillRecommendations(
    userSkills: Array<{ name: string; category: string; level: number }>,
    leadershipProfile: { type: string; confidence: number },
    targetRole?: string
  ): SkillRecommendation[] {
    const currentSkillNames = userSkills.map(s => s.name.toLowerCase());
    const recommendations: SkillRecommendation[] = [];

    // Recommendations based on leadership profile
    if (leadershipProfile.type === 'entrepreneur' || leadershipProfile.type === 'corporate_leader') {
      if (!currentSkillNames.includes('strategic planning')) {
        recommendations.push({
          skill: 'Strategic Planning',
          reason: 'Essential for executive leadership and business growth',
          impact: 90,
          difficulty: 70,
          timeToLearn: '3-6 months',
          resources: [
            { type: 'course', name: 'Strategic Management', provider: 'Coursera', cost: '$49/month' },
            { type: 'book', name: 'Good Strategy Bad Strategy', provider: 'Richard Rumelt' },
            { type: 'certification', name: 'Strategic Management Certificate', provider: 'Cornell' }
          ]
        });
      }
    }

    // Technical skill recommendations
    if (currentSkillNames.includes('javascript') && !currentSkillNames.includes('typescript')) {
      recommendations.push({
        skill: 'TypeScript',
        reason: 'High demand complement to JavaScript, 25% salary increase potential',
        impact: 75,
        difficulty: 40,
        timeToLearn: '2-4 weeks',
        resources: [
          { type: 'course', name: 'TypeScript Fundamentals', provider: 'Frontend Masters', cost: '$39/month' },
          { type: 'practice', name: 'TypeScript Exercises', provider: 'GitHub', cost: 'Free' },
          { type: 'certification', name: 'Microsoft TypeScript', provider: 'Microsoft' }
        ]
      });
    }

    if (currentSkillNames.includes('react') && !currentSkillNames.includes('next.js')) {
      recommendations.push({
        skill: 'Next.js',
        reason: 'Popular React framework, high demand for full-stack development',
        impact: 70,
        difficulty: 50,
        timeToLearn: '3-4 weeks',
        resources: [
          { type: 'course', name: 'Next.js Complete Guide', provider: 'Udemy', cost: '$89.99' },
          { type: 'practice', name: 'Next.js Tutorial', provider: 'Vercel', cost: 'Free' }
        ]
      });
    }

    // Cloud and DevOps recommendations
    if (userSkills.some(s => s.category === 'Programming') && !currentSkillNames.includes('aws')) {
      recommendations.push({
        skill: 'AWS',
        reason: 'Cloud skills essential for modern development, 30% salary premium',
        impact: 85,
        difficulty: 60,
        timeToLearn: '2-3 months',
        resources: [
          { type: 'certification', name: 'AWS Solutions Architect', provider: 'Amazon', cost: '$150' },
          { type: 'course', name: 'AWS Fundamentals', provider: 'AWS Training', cost: 'Free' },
          { type: 'practice', name: 'AWS Free Tier', provider: 'Amazon', cost: 'Free' }
        ]
      });
    }

    // AI/ML recommendations for senior technical roles
    if (leadershipProfile.confidence > 70 && currentSkillNames.includes('python')) {
      recommendations.push({
        skill: 'Machine Learning',
        reason: 'AI/ML skills demand up 150%, future-proofing for senior roles',
        impact: 95,
        difficulty: 80,
        timeToLearn: '4-6 months',
        resources: [
          { type: 'course', name: 'Machine Learning Specialization', provider: 'Coursera', cost: '$49/month' },
          { type: 'certification', name: 'TensorFlow Developer', provider: 'Google', cost: '$100' },
          { type: 'book', name: 'Hands-On Machine Learning', provider: "O'Reilly" }
        ]
      });
    }

    return recommendations.slice(0, 5); // Top 5 recommendations
  }

  /**
   * Generate career pathway suggestions
   */
  static generateCareerPathways(
    userSkills: Array<{ name: string; category: string; level: number }>,
    currentRole: string,
    leadershipProfile: { type: string; confidence: number }
  ): CareerPathway {
    const hasLeadershipSkills = userSkills.some(s => s.category === 'Leadership');
    const hasTechnicalSkills = userSkills.some(s => s.category === 'Programming');
    
    let nextRoles = [];

    if (leadershipProfile.type === 'corporate_leader' || leadershipProfile.confidence > 80) {
      nextRoles = [
        {
          title: 'VP of Engineering',
          timeToAchieve: '2-3 years',
          requiredSkills: ['Strategic Planning', 'Budget Management', 'Team Leadership'],
          salaryIncrease: 40,
          probability: 75
        },
        {
          title: 'Chief Technology Officer',
          timeToAchieve: '3-5 years',
          requiredSkills: ['Technology Strategy', 'Board Communication', 'Innovation Management'],
          salaryIncrease: 80,
          probability: 60
        }
      ];
    } else if (leadershipProfile.type === 'entrepreneur') {
      nextRoles = [
        {
          title: 'Startup Founder',
          timeToAchieve: '1-2 years',
          requiredSkills: ['Business Development', 'Fundraising', 'Product Strategy'],
          salaryIncrease: 100,
          probability: 45
        },
        {
          title: 'Innovation Director',
          timeToAchieve: '2-3 years',
          requiredSkills: ['Innovation Management', 'Venture Capital', 'Strategic Partnerships'],
          salaryIncrease: 50,
          probability: 70
        }
      ];
    } else if (hasTechnicalSkills && hasLeadershipSkills) {
      nextRoles = [
        {
          title: 'Engineering Manager',
          timeToAchieve: '1-2 years',
          requiredSkills: ['Team Leadership', 'Project Management', 'Technical Strategy'],
          salaryIncrease: 25,
          probability: 85
        },
        {
          title: 'Principal Engineer',
          timeToAchieve: '2-3 years',
          requiredSkills: ['System Architecture', 'Technical Leadership', 'Mentoring'],
          salaryIncrease: 30,
          probability: 75
        }
      ];
    } else {
      nextRoles = [
        {
          title: 'Senior Specialist',
          timeToAchieve: '1-2 years',
          requiredSkills: ['Advanced Technical Skills', 'Domain Expertise'],
          salaryIncrease: 20,
          probability: 80
        },
        {
          title: 'Team Lead',
          timeToAchieve: '2-3 years',
          requiredSkills: ['Leadership', 'Communication', 'Project Management'],
          salaryIncrease: 25,
          probability: 70
        }
      ];
    }

    return {
      currentRole: currentRole || 'Current Position',
      nextRoles
    };
  }

  /**
   * Get industry trends and predictions
   */
  static getIndustryTrends(): Array<{
    category: string;
    trend: string;
    impact: number;
    timeframe: string;
    skills: string[];
  }> {
    return [
      {
        category: 'Artificial Intelligence',
        trend: 'AI/ML integration across all industries',
        impact: 95,
        timeframe: '2024-2026',
        skills: ['Machine Learning', 'Python', 'TensorFlow', 'Data Science']
      },
      {
        category: 'Cloud Computing',
        trend: 'Multi-cloud and serverless adoption',
        impact: 85,
        timeframe: '2024-2025',
        skills: ['AWS', 'Azure', 'Kubernetes', 'Terraform']
      },
      {
        category: 'Cybersecurity',
        trend: 'Zero-trust security models',
        impact: 80,
        timeframe: '2024-2027',
        skills: ['Security Architecture', 'Identity Management', 'Compliance']
      },
      {
        category: 'Remote Leadership',
        trend: 'Hybrid work management skills',
        impact: 75,
        timeframe: '2024-2026',
        skills: ['Virtual Team Management', 'Digital Communication', 'Async Leadership']
      },
      {
        category: 'Sustainability',
        trend: 'ESG and sustainable technology',
        impact: 70,
        timeframe: '2024-2028',
        skills: ['Sustainable Development', 'ESG Strategy', 'Green Technology']
      }
    ];
  }
}

export default MarketInsightsService;
