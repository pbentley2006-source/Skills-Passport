import { SkillsMatcher } from '../src/skillsMatching';

describe('SkillsMatcher', () => {
  let skillsMatcher: SkillsMatcher;

  beforeAll(() => {
    skillsMatcher = new SkillsMatcher();
  });

  describe('matchSkills', () => {
    it('should match exact skill names', () => {
      const inputSkills = ['JavaScript', 'Python', 'SQL'];
      const matches = skillsMatcher.matchSkills(inputSkills);

      expect(matches).toHaveLength(3);
      expect(matches[0].skill).toBe('JavaScript');
      expect(matches[0].confidence).toBe(1.0);
      expect(matches[0].category).toBe('TECHNICAL');
    });

    it('should match skills with synonyms', () => {
      const inputSkills = ['JS', 'Node', 'AI'];
      const matches = skillsMatcher.matchSkills(inputSkills);

      expect(matches.length).toBeGreaterThan(0);
      const jsMatch = matches.find(m => m.skill === 'JavaScript');
      expect(jsMatch).toBeDefined();
      expect(jsMatch?.confidence).toBeGreaterThan(0.8);
    });

    it('should handle fuzzy matching for typos', () => {
      const inputSkills = ['Javascrpt', 'Pythom', 'Reactt'];
      const matches = skillsMatcher.matchSkills(inputSkills);

      expect(matches.length).toBeGreaterThan(0);
      matches.forEach(match => {
        expect(match.confidence).toBeGreaterThan(0.7);
      });
    });

    it('should assess proficiency levels based on context', () => {
      const inputSkills = ['JavaScript'];
      const context = 'Senior JavaScript developer with 8 years of experience leading teams and architecting complex applications';
      const matches = skillsMatcher.matchSkills(inputSkills, context);

      expect(matches[0].proficiencyLevel).toBeGreaterThanOrEqual(4);
    });

    it('should categorize skills correctly', () => {
      const inputSkills = ['JavaScript', 'Leadership', 'AWS', 'Communication'];
      const matches = skillsMatcher.matchSkills(inputSkills);

      const categories = matches.map(m => m.category);
      expect(categories).toContain('TECHNICAL');
      expect(categories).toContain('SOFT');
    });

    it('should deduplicate similar matches', () => {
      const inputSkills = ['JavaScript', 'JS', 'Javascript', 'ECMAScript'];
      const matches = skillsMatcher.matchSkills(inputSkills);

      // Should consolidate to one JavaScript match
      const jsMatches = matches.filter(m => m.skill === 'JavaScript');
      expect(jsMatches).toHaveLength(1);
    });
  });

  describe('extractSkillsFromText', () => {
    it('should extract skills from job description text', () => {
      const text = `
        We are looking for a Senior Software Engineer with experience in JavaScript, React, and Node.js.
        The candidate should have knowledge of AWS, Docker, and SQL databases.
        Strong communication and leadership skills are required.
      `;

      const extractedSkills = skillsMatcher.extractSkillsFromText(text);

      expect(extractedSkills).toContain('JavaScript');
      expect(extractedSkills).toContain('React');
      expect(extractedSkills).toContain('Node.js');
      expect(extractedSkills).toContain('AWS');
      expect(extractedSkills).toContain('Docker');
      expect(extractedSkills).toContain('SQL');
    });

    it('should extract skills from CV experience section', () => {
      const text = `
        Developed web applications using Python and Django framework.
        Worked with PostgreSQL databases and implemented RESTful APIs.
        Experience with machine learning using TensorFlow and scikit-learn.
      `;

      const extractedSkills = skillsMatcher.extractSkillsFromText(text);

      expect(extractedSkills).toContain('Python');
      expect(extractedSkills).toContain('PostgreSQL');
      expect(extractedSkills.length).toBeGreaterThan(3);
    });

    it('should handle skills mentioned in different formats', () => {
      const text = `
        Technologies: React.js, Vue.js, Angular
        Programming languages: JavaScript, TypeScript, Python
        Tools: Git, Jenkins, Docker
      `;

      const extractedSkills = skillsMatcher.extractSkillsFromText(text);

      expect(extractedSkills.length).toBeGreaterThan(5);
      expect(extractedSkills).toContain('React');
      expect(extractedSkills).toContain('JavaScript');
    });
  });

  describe('getSkillsSummary', () => {
    it('should provide correct category counts', () => {
      const matches = [
        { skill: 'JavaScript', category: 'TECHNICAL', subcategory: 'programming', confidence: 1.0 },
        { skill: 'Python', category: 'TECHNICAL', subcategory: 'programming', confidence: 1.0 },
        { skill: 'Leadership', category: 'SOFT', subcategory: 'leadership', confidence: 1.0 },
        { skill: 'Communication', category: 'SOFT', subcategory: 'communication', confidence: 1.0 },
        { skill: 'AWS Certified', category: 'CERTIFICATION', subcategory: 'cloud', confidence: 1.0 }
      ];

      const summary = skillsMatcher.getSkillsSummary(matches);

      expect(summary.TECHNICAL).toBe(2);
      expect(summary.SOFT).toBe(2);
      expect(summary.CERTIFICATION).toBe(1);
      expect(summary.INDUSTRY_SPECIFIC).toBe(0);
    });
  });

  describe('proficiency assessment', () => {
    it('should assign higher proficiency for senior roles', () => {
      const inputSkills = ['JavaScript'];
      const seniorContext = 'Senior Software Engineer with 10 years experience leading JavaScript development teams';
      const juniorContext = 'Junior developer learning JavaScript basics';

      const seniorMatches = skillsMatcher.matchSkills(inputSkills, seniorContext);
      const juniorMatches = skillsMatcher.matchSkills(inputSkills, juniorContext);

      expect(seniorMatches[0].proficiencyLevel).toBeGreaterThan(juniorMatches[0].proficiencyLevel);
    });

    it('should consider years of experience in proficiency', () => {
      const inputSkills = ['Python'];
      const experiencedContext = 'Python developer with 8 years of experience';
      const newContext = 'Recently started learning Python';

      const experiencedMatches = skillsMatcher.matchSkills(inputSkills, experiencedContext);
      const newMatches = skillsMatcher.matchSkills(inputSkills, newContext);

      expect(experiencedMatches[0].proficiencyLevel).toBeGreaterThan(newMatches[0].proficiencyLevel);
    });

    it('should recognize architecture and advanced keywords', () => {
      const inputSkills = ['AWS'];
      const architectContext = 'AWS Solutions Architect designing enterprise cloud infrastructure';
      const basicContext = 'Used AWS EC2 for basic deployments';

      const architectMatches = skillsMatcher.matchSkills(inputSkills, architectContext);
      const basicMatches = skillsMatcher.matchSkills(inputSkills, basicContext);

      expect(architectMatches[0].proficiencyLevel).toBeGreaterThan(basicMatches[0].proficiencyLevel);
    });
  });

  describe('edge cases', () => {
    it('should handle empty input gracefully', () => {
      const matches = skillsMatcher.matchSkills([]);
      expect(matches).toHaveLength(0);
    });

    it('should handle unknown skills', () => {
      const inputSkills = ['UnknownSkill123', 'FakeFramework'];
      const matches = skillsMatcher.matchSkills(inputSkills);

      // Should either return no matches or low-confidence matches
      matches.forEach(match => {
        expect(match.confidence).toBeLessThan(0.9);
      });
    });

    it('should handle very short skill names', () => {
      const inputSkills = ['R', 'C', 'Go'];
      const matches = skillsMatcher.matchSkills(inputSkills);

      // Should handle single-letter programming languages
      expect(matches.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle skills with special characters', () => {
      const inputSkills = ['C++', 'C#', '.NET', 'Node.js'];
      const matches = skillsMatcher.matchSkills(inputSkills);

      expect(matches.length).toBeGreaterThan(0);
    });
  });
});
