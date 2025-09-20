import { MockDataGenerator } from '../src/mockDataGenerator';

describe('MockDataGenerator', () => {
  let generator: MockDataGenerator;

  beforeAll(() => {
    generator = new MockDataGenerator();
  });

  describe('generateMockCV', () => {
    it('should generate a complete CV with all required fields', () => {
      const cv = generator.generateMockCV();

      expect(cv.personalInfo).toBeDefined();
      expect(cv.personalInfo.name).toBeTruthy();
      expect(cv.personalInfo.email).toMatch(/\S+@\S+\.\S+/);
      expect(cv.personalInfo.phone).toBeTruthy();
      expect(cv.personalInfo.location).toBeTruthy();

      expect(cv.workExperience).toBeDefined();
      expect(cv.workExperience.length).toBeGreaterThan(0);
      expect(cv.workExperience.length).toBeLessThanOrEqual(5);

      expect(cv.skills).toBeDefined();
      expect(cv.skills.technical.length).toBeGreaterThan(0);
      expect(cv.skills.soft.length).toBeGreaterThan(0);

      expect(cv.education).toBeDefined();
      expect(cv.education.length).toBeGreaterThan(0);

      expect(cv.certifications).toBeDefined();
      expect(Array.isArray(cv.certifications)).toBe(true);
    });

    it('should generate realistic work experience with proper date ordering', () => {
      const cv = generator.generateMockCV();

      // Check that dates are in logical order (most recent first)
      for (let i = 0; i < cv.workExperience.length - 1; i++) {
        const current = new Date(cv.workExperience[i].startDate);
        const next = new Date(cv.workExperience[i + 1].startDate);
        expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
      }

      // Check that current job has no end date
      if (cv.workExperience.length > 0) {
        expect(cv.workExperience[0].endDate).toBeNull();
      }
    });

    it('should generate work experience with responsibilities and achievements', () => {
      const cv = generator.generateMockCV();

      cv.workExperience.forEach(exp => {
        expect(exp.responsibilities).toBeDefined();
        expect(exp.responsibilities.length).toBeGreaterThan(0);
        expect(exp.achievements).toBeDefined();
        expect(exp.achievements.length).toBeGreaterThan(0);
        
        // Check that responsibilities are meaningful strings
        exp.responsibilities.forEach(resp => {
          expect(resp.length).toBeGreaterThan(10);
        });
      });
    });

    it('should generate diverse technical and soft skills', () => {
      const cv = generator.generateMockCV();

      expect(cv.skills.technical.length).toBeGreaterThanOrEqual(8);
      expect(cv.skills.technical.length).toBeLessThanOrEqual(15);
      expect(cv.skills.soft.length).toBeGreaterThanOrEqual(5);
      expect(cv.skills.soft.length).toBeLessThanOrEqual(8);

      // Check for no duplicates
      const allSkills = [...cv.skills.technical, ...cv.skills.soft];
      const uniqueSkills = new Set(allSkills);
      expect(uniqueSkills.size).toBe(allSkills.length);
    });
  });

  describe('generateAnonymizedProfile', () => {
    it('should properly anonymize personal information', () => {
      const cv = generator.generateMockCV();
      const profile = generator.generateAnonymizedProfile(cv);

      expect(profile.candidateId).toMatch(/^CANDIDATE_[A-Z0-9]{6}$/);
      expect(profile.professionalSummary).toBeTruthy();
      expect(profile.professionalSummary).not.toContain(cv.personalInfo.name);
      expect(profile.professionalSummary).not.toContain(cv.personalInfo.email);
    });

    it('should anonymize company names consistently', () => {
      const cv = generator.generateMockCV();
      const profile = generator.generateAnonymizedProfile(cv);

      const companyMappings = new Set<string>();
      profile.workExperience.forEach(exp => {
        expect(exp.anonymizedCompany).toMatch(/^Company [A-Z]$/);
        companyMappings.add(exp.anonymizedCompany);
      });

      // Should have consistent mapping (same company -> same anonymized name)
      const originalCompanies = new Set(cv.workExperience.map(exp => exp.company));
      expect(companyMappings.size).toBeLessThanOrEqual(originalCompanies.size);
    });

    it('should anonymize education institutions', () => {
      const cv = generator.generateMockCV();
      const profile = generator.generateAnonymizedProfile(cv);

      profile.education.forEach(edu => {
        expect(edu.anonymizedInstitution).toMatch(/^University [A-Z]$/);
        expect(edu.type).toBe('DEGREE');
        expect(edu.field).toBeTruthy();
        expect(edu.year).toBeTruthy();
      });
    });

    it('should preserve skills and certifications', () => {
      const cv = generator.generateMockCV();
      const profile = generator.generateAnonymizedProfile(cv);

      expect(profile.skills.length).toBeGreaterThan(0);
      expect(profile.certifications).toEqual(cv.certifications);

      profile.skills.forEach(skill => {
        expect(skill.name).toBeTruthy();
        expect(['TECHNICAL', 'SOFT']).toContain(skill.category);
        expect(skill.proficiencyLevel).toBeGreaterThanOrEqual(1);
        expect(skill.proficiencyLevel).toBeLessThanOrEqual(5);
      });
    });

    it('should generate meaningful professional summary', () => {
      const cv = generator.generateMockCV();
      const profile = generator.generateAnonymizedProfile(cv);

      expect(profile.professionalSummary.length).toBeGreaterThan(50);
      expect(profile.professionalSummary).toMatch(/\d+\+?\s*years?/i);
      expect(profile.professionalSummary).toMatch(/(Senior|Experienced|Mid-level)/i);
    });
  });

  describe('generateTestScenarios', () => {
    it('should generate different career scenarios', () => {
      const scenarios = generator.generateTestScenarios();

      expect(scenarios).toHaveProperty('junior_developer');
      expect(scenarios).toHaveProperty('senior_engineer');
      expect(scenarios).toHaveProperty('data_scientist');
      expect(scenarios).toHaveProperty('product_manager');
      expect(scenarios).toHaveProperty('career_changer');

      // Junior developer should have limited experience
      expect(scenarios.junior_developer.workExperience.length).toBeLessThanOrEqual(2);
      expect(scenarios.junior_developer.skills.technical.length).toBeLessThanOrEqual(6);

      // Senior engineer should have senior titles
      const seniorTitles = scenarios.senior_engineer.workExperience.map(exp => exp.position);
      expect(seniorTitles.some(title => title.includes('Senior'))).toBe(true);

      // Data scientist should have relevant skills
      const dsSkills = scenarios.data_scientist.skills.technical;
      expect(dsSkills).toContain('Python');
      expect(dsSkills).toContain('Machine Learning');

      // Career changer should have diverse roles
      const careerChangerRoles = scenarios.career_changer.workExperience.map(exp => exp.position);
      const uniqueRoleTypes = new Set(careerChangerRoles.map(role => role.split(' ')[0]));
      expect(uniqueRoleTypes.size).toBeGreaterThan(1);
    });
  });

  describe('generateMockCVBatch', () => {
    it('should generate specified number of CVs', () => {
      const count = 5;
      const batch = generator.generateMockCVBatch(count);

      expect(batch).toHaveLength(count);
      batch.forEach(cv => {
        expect(cv.personalInfo).toBeDefined();
        expect(cv.workExperience).toBeDefined();
        expect(cv.skills).toBeDefined();
      });
    });

    it('should generate unique CVs in batch', () => {
      const batch = generator.generateMockCVBatch(3);

      // Check that names are different
      const names = batch.map(cv => cv.personalInfo.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(3);

      // Check that emails are different
      const emails = batch.map(cv => cv.personalInfo.email);
      const uniqueEmails = new Set(emails);
      expect(uniqueEmails.size).toBe(3);
    });
  });

  describe('data quality validation', () => {
    it('should generate realistic email addresses', () => {
      const cv = generator.generateMockCV();
      const email = cv.personalInfo.email;

      expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      expect(email.toLowerCase()).toBe(email); // Should be lowercase
    });

    it('should generate realistic phone numbers', () => {
      const cv = generator.generateMockCV();
      const phone = cv.personalInfo.phone;

      expect(phone).toBeTruthy();
      expect(phone.length).toBeGreaterThan(10);
    });

    it('should generate realistic locations', () => {
      const cv = generator.generateMockCV();
      const location = cv.personalInfo.location;

      expect(location).toMatch(/^.+,\s*.+$/); // Should have city, state format
    });

    it('should generate realistic project data', () => {
      const cv = generator.generateMockCV();

      if (cv.projects) {
        cv.projects.forEach(project => {
          expect(project.name).toBeTruthy();
          expect(project.description).toBeTruthy();
          expect(project.technologies).toBeDefined();
          expect(project.technologies.length).toBeGreaterThan(0);
          expect(project.duration).toMatch(/\d+\s+months?/);
        });
      }
    });

    it('should generate consistent GPA values', () => {
      const cv = generator.generateMockCV();

      cv.education.forEach(edu => {
        if (edu.gpa) {
          const gpa = parseFloat(edu.gpa);
          expect(gpa).toBeGreaterThanOrEqual(3.0);
          expect(gpa).toBeLessThanOrEqual(4.0);
        }
      });
    });
  });
});
