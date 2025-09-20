import { faker } from '@faker-js/faker';

export interface MockCV {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
  };
  workExperience: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate: string | null;
    responsibilities: string[];
    achievements: string[];
    location: string;
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
    location: string;
  }>;
  certifications: string[];
  projects?: Array<{
    name: string;
    description: string;
    technologies: string[];
    duration: string;
  }>;
}

export interface MockAnonymizedProfile {
  candidateId: string;
  professionalSummary: string;
  workExperience: Array<{
    anonymizedCompany: string;
    position: string;
    duration: string;
    responsibilities: string[];
    achievements: string[];
  }>;
  skills: Array<{
    name: string;
    category: string;
    proficiencyLevel: number;
    yearsExperience?: number;
  }>;
  education: Array<{
    type: string;
    level: string;
    field: string;
    year: string;
    anonymizedInstitution: string;
  }>;
  certifications: string[];
}

export class MockDataGenerator {
  private companies = [
    'TechCorp Solutions', 'Global Dynamics Inc', 'Innovation Labs', 'Digital Ventures',
    'NextGen Systems', 'CloudFirst Technologies', 'DataDriven Analytics', 'SmartScale Solutions',
    'AgileWorks Consulting', 'FutureProof Industries', 'Quantum Computing Corp', 'AI Innovations Ltd',
    'CyberSecure Systems', 'GreenTech Solutions', 'FinanceFlow Technologies', 'HealthTech Innovations'
  ];

  private universities = [
    'Stanford University', 'MIT', 'Harvard University', 'UC Berkeley', 'Carnegie Mellon',
    'University of Washington', 'Georgia Tech', 'University of Texas', 'NYU', 'Columbia University',
    'University of Michigan', 'UCLA', 'Princeton University', 'Yale University', 'Caltech'
  ];

  private technicalSkills = [
    'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'AWS', 'Docker', 'Kubernetes',
    'SQL', 'MongoDB', 'PostgreSQL', 'Git', 'Jenkins', 'Terraform', 'GraphQL', 'TypeScript',
    'Angular', 'Vue.js', 'Spring Boot', 'Django', 'Flask', 'Express.js', 'Redis', 'Elasticsearch',
    'Machine Learning', 'TensorFlow', 'PyTorch', 'Pandas', 'NumPy', 'Scikit-learn'
  ];

  private softSkills = [
    'Leadership', 'Communication', 'Problem Solving', 'Team Collaboration', 'Project Management',
    'Critical Thinking', 'Adaptability', 'Time Management', 'Mentoring', 'Strategic Planning',
    'Stakeholder Management', 'Agile Methodologies', 'Cross-functional Collaboration'
  ];

  private jobTitles = [
    'Software Engineer', 'Senior Software Engineer', 'Lead Software Engineer', 'Principal Engineer',
    'Full Stack Developer', 'Frontend Developer', 'Backend Developer', 'DevOps Engineer',
    'Data Scientist', 'Machine Learning Engineer', 'Product Manager', 'Engineering Manager',
    'Technical Lead', 'Solutions Architect', 'Cloud Architect', 'Security Engineer'
  ];

  private certifications = [
    'AWS Certified Solutions Architect', 'Google Cloud Professional', 'Certified Kubernetes Administrator',
    'PMP Certification', 'Certified Scrum Master', 'Azure Solutions Architect', 'CISSP',
    'Certified Ethical Hacker', 'TensorFlow Developer Certificate', 'Oracle Certified Professional'
  ];

  /**
   * Generate a realistic mock CV
   */
  public generateMockCV(): MockCV {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email({ firstName, lastName });

    return {
      personalInfo: {
        name: `${firstName} ${lastName}`,
        email,
        phone: faker.phone.number(),
        location: `${faker.location.city()}, ${faker.location.state()}`,
        linkedin: `linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}`
      },
      workExperience: this.generateWorkExperience(),
      skills: {
        technical: faker.helpers.arrayElements(this.technicalSkills, { min: 8, max: 15 }),
        soft: faker.helpers.arrayElements(this.softSkills, { min: 5, max: 8 }),
        languages: faker.helpers.arrayElements(['English', 'Spanish', 'French', 'German', 'Mandarin', 'Japanese'], { min: 1, max: 3 })
      },
      education: this.generateEducation(),
      certifications: faker.helpers.arrayElements(this.certifications, { min: 1, max: 4 }),
      projects: this.generateProjects()
    };
  }

  private generateWorkExperience(): MockCV['workExperience'] {
    const experiences = [];
    const numExperiences = faker.number.int({ min: 2, max: 5 });
    let currentDate = new Date();

    for (let i = 0; i < numExperiences; i++) {
      const startDate = new Date(currentDate);
      startDate.setFullYear(currentDate.getFullYear() - faker.number.int({ min: 1, max: 4 }));
      
      const endDate = i === 0 ? null : new Date(startDate);
      if (endDate) {
        endDate.setFullYear(startDate.getFullYear() + faker.number.int({ min: 1, max: 3 }));
      }

      const company = faker.helpers.arrayElement(this.companies);
      const position = faker.helpers.arrayElement(this.jobTitles);

      experiences.push({
        company,
        position,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate?.toISOString().split('T')[0] || null,
        responsibilities: this.generateResponsibilities(position),
        achievements: this.generateAchievements(),
        location: `${faker.location.city()}, ${faker.location.state()}`
      });

      currentDate = startDate;
    }

    return experiences;
  }

  private generateResponsibilities(position: string): string[] {
    const baseResponsibilities = [
      'Developed and maintained web applications using modern frameworks',
      'Collaborated with cross-functional teams to deliver high-quality software',
      'Participated in code reviews and maintained coding standards',
      'Worked with stakeholders to gather requirements and define technical specifications'
    ];

    const roleSpecificResponsibilities: Record<string, string[]> = {
      'Software Engineer': [
        'Implemented new features and bug fixes in production systems',
        'Wrote unit tests and integration tests to ensure code quality',
        'Optimized application performance and database queries'
      ],
      'Senior Software Engineer': [
        'Led technical design discussions and architecture decisions',
        'Mentored junior developers and conducted technical interviews',
        'Designed and implemented scalable microservices architecture'
      ],
      'Lead Software Engineer': [
        'Managed technical roadmap and sprint planning',
        'Coordinated with product managers and designers on feature development',
        'Established development best practices and coding standards'
      ],
      'DevOps Engineer': [
        'Managed CI/CD pipelines and deployment automation',
        'Monitored system performance and implemented alerting solutions',
        'Maintained cloud infrastructure using Infrastructure as Code'
      ],
      'Data Scientist': [
        'Built machine learning models for predictive analytics',
        'Analyzed large datasets to extract business insights',
        'Collaborated with engineering teams to deploy ML models to production'
      ]
    };

    const specific = roleSpecificResponsibilities[position] || [];
    return [...baseResponsibilities, ...specific].slice(0, faker.number.int({ min: 4, max: 7 }));
  }

  private generateAchievements(): string[] {
    const achievements = [
      'Reduced application load time by 40% through performance optimization',
      'Led migration to cloud infrastructure, reducing costs by 25%',
      'Implemented automated testing suite, increasing code coverage to 90%',
      'Mentored 3 junior developers, with 2 receiving promotions',
      'Delivered critical project 2 weeks ahead of schedule',
      'Improved system reliability, achieving 99.9% uptime',
      'Designed architecture that scaled to handle 10x traffic increase',
      'Won company hackathon with innovative ML-powered feature',
      'Reduced bug reports by 60% through improved testing practices',
      'Led successful migration of legacy system to modern tech stack'
    ];

    return faker.helpers.arrayElements(achievements, { min: 2, max: 4 });
  }

  private generateEducation(): MockCV['education'] {
    const degrees = ['Bachelor of Science', 'Master of Science', 'Bachelor of Arts', 'Master of Business Administration'];
    const fields = [
      'Computer Science', 'Software Engineering', 'Information Technology', 'Data Science',
      'Electrical Engineering', 'Mathematics', 'Physics', 'Business Administration'
    ];

    const numDegrees = faker.number.int({ min: 1, max: 2 });
    const education = [];

    for (let i = 0; i < numDegrees; i++) {
      education.push({
        institution: faker.helpers.arrayElement(this.universities),
        degree: faker.helpers.arrayElement(degrees),
        field: faker.helpers.arrayElement(fields),
        year: faker.date.past({ years: 10 }).getFullYear().toString(),
        gpa: faker.number.float({ min: 3.0, max: 4.0, fractionDigits: 2 }).toString(),
        location: `${faker.location.city()}, ${faker.location.state()}`
      });
    }

    return education;
  }

  private generateProjects(): MockCV['projects'] {
    const projectNames = [
      'E-commerce Platform', 'Task Management System', 'Real-time Chat Application',
      'Data Analytics Dashboard', 'Mobile Banking App', 'Social Media Platform',
      'Inventory Management System', 'Customer Support Portal', 'Learning Management System'
    ];

    const numProjects = faker.number.int({ min: 2, max: 4 });
    const projects = [];

    for (let i = 0; i < numProjects; i++) {
      projects.push({
        name: faker.helpers.arrayElement(projectNames),
        description: faker.lorem.sentences(2),
        technologies: faker.helpers.arrayElements(this.technicalSkills, { min: 3, max: 6 }),
        duration: `${faker.number.int({ min: 2, max: 12 })} months`
      });
    }

    return projects;
  }

  /**
   * Generate anonymized profile from CV
   */
  public generateAnonymizedProfile(cv: MockCV, candidateId?: string): MockAnonymizedProfile {
    const companyMappings = new Map<string, string>();
    let companyCounter = 1;

    // Create company mappings
    cv.workExperience.forEach(exp => {
      if (!companyMappings.has(exp.company)) {
        companyMappings.set(exp.company, `Company ${String.fromCharCode(64 + companyCounter)}`);
        companyCounter++;
      }
    });

    return {
      candidateId: candidateId || `CANDIDATE_${faker.string.alphanumeric(6).toUpperCase()}`,
      professionalSummary: this.generateProfessionalSummary(cv),
      workExperience: cv.workExperience.map(exp => ({
        anonymizedCompany: companyMappings.get(exp.company)!,
        position: exp.position,
        duration: this.calculateDuration(exp.startDate, exp.endDate),
        responsibilities: exp.responsibilities,
        achievements: exp.achievements
      })),
      skills: this.mapSkillsToStandardized(cv.skills),
      education: cv.education.map((edu, index) => ({
        type: 'DEGREE',
        level: edu.degree,
        field: edu.field,
        year: edu.year,
        anonymizedInstitution: `University ${String.fromCharCode(65 + index)}`
      })),
      certifications: cv.certifications
    };
  }

  private generateProfessionalSummary(cv: MockCV): string {
    const totalYears = this.calculateTotalExperience(cv.workExperience);
    const primarySkills = cv.skills.technical.slice(0, 3).join(', ');
    const seniority = totalYears >= 8 ? 'Senior' : totalYears >= 5 ? 'Experienced' : 'Mid-level';

    return `${seniority} professional with ${totalYears}+ years of experience in software development. ` +
           `Expertise in ${primarySkills} with a strong background in building scalable applications. ` +
           `Proven track record of delivering high-quality solutions and leading technical initiatives.`;
  }

  private calculateTotalExperience(workExperience: MockCV['workExperience']): number {
    let totalMonths = 0;
    
    workExperience.forEach(exp => {
      const start = new Date(exp.startDate);
      const end = exp.endDate ? new Date(exp.endDate) : new Date();
      const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
      totalMonths += months;
    });

    return Math.round(totalMonths / 12);
  }

  private calculateDuration(startDate: string, endDate: string | null): string {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    
    if (months < 12) {
      return `${months} months`;
    } else {
      const years = Math.floor(months / 12);
      const remainingMonths = months % 12;
      return remainingMonths > 0 ? `${years} years ${remainingMonths} months` : `${years} years`;
    }
  }

  private mapSkillsToStandardized(skills: MockCV['skills']): MockAnonymizedProfile['skills'] {
    const allSkills = [...skills.technical, ...skills.soft];
    
    return allSkills.map(skill => ({
      name: skill,
      category: skills.technical.includes(skill) ? 'TECHNICAL' : 'SOFT',
      proficiencyLevel: faker.number.int({ min: 2, max: 5 }),
      yearsExperience: faker.number.int({ min: 1, max: 8 })
    }));
  }

  /**
   * Generate multiple mock CVs for testing
   */
  public generateMockCVBatch(count: number): MockCV[] {
    return Array.from({ length: count }, () => this.generateMockCV());
  }

  /**
   * Generate test data for different scenarios
   */
  public generateTestScenarios(): Record<string, MockCV> {
    return {
      'junior_developer': this.generateJuniorDeveloper(),
      'senior_engineer': this.generateSeniorEngineer(),
      'data_scientist': this.generateDataScientist(),
      'product_manager': this.generateProductManager(),
      'career_changer': this.generateCareerChanger()
    };
  }

  private generateJuniorDeveloper(): MockCV {
    const cv = this.generateMockCV();
    cv.workExperience = cv.workExperience.slice(0, 2); // Limit experience
    cv.skills.technical = cv.skills.technical.slice(0, 6); // Fewer skills
    cv.certifications = cv.certifications.slice(0, 1); // Fewer certifications
    return cv;
  }

  private generateSeniorEngineer(): MockCV {
    const cv = this.generateMockCV();
    cv.workExperience = cv.workExperience.map(exp => ({
      ...exp,
      position: exp.position.includes('Senior') ? exp.position : `Senior ${exp.position}`
    }));
    cv.skills.technical.push('System Architecture', 'Team Leadership', 'Technical Mentoring');
    return cv;
  }

  private generateDataScientist(): MockCV {
    const cv = this.generateMockCV();
    cv.skills.technical = [
      'Python', 'R', 'SQL', 'Machine Learning', 'TensorFlow', 'PyTorch',
      'Pandas', 'NumPy', 'Scikit-learn', 'Jupyter', 'Statistics', 'Data Visualization'
    ];
    cv.workExperience = cv.workExperience.map(exp => ({
      ...exp,
      position: 'Data Scientist'
    }));
    return cv;
  }

  private generateProductManager(): MockCV {
    const cv = this.generateMockCV();
    cv.skills.technical = ['SQL', 'Analytics', 'A/B Testing', 'Tableau', 'JIRA', 'Confluence'];
    cv.skills.soft.push('Product Strategy', 'Market Research', 'User Research', 'Roadmap Planning');
    cv.workExperience = cv.workExperience.map(exp => ({
      ...exp,
      position: 'Product Manager'
    }));
    return cv;
  }

  private generateCareerChanger(): MockCV {
    const cv = this.generateMockCV();
    // Mix of different industries/roles
    cv.workExperience[0].position = 'Software Engineer';
    cv.workExperience[1].position = 'Business Analyst';
    cv.workExperience[2] = {
      ...cv.workExperience[2],
      position: 'Marketing Coordinator'
    };
    return cv;
  }
}
