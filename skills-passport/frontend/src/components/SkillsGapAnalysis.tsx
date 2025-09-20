import React, { useState } from 'react';

interface Skill {
  name: string;
  level: number;
  category: string;
  confidence: number;
  onetCode?: string;
}

interface SkillsGapAnalysisProps {
  userSkills: Skill[];
}

const SkillsGapAnalysis: React.FC<SkillsGapAnalysisProps> = ({ userSkills }) => {
  const [jobDescription, setJobDescription] = useState('');
  const [analysis, setAnalysis] = useState<{
    missingSkills: Array<{ name: string; importance: number; category: string }>;
    matchingSkills: Array<{ name: string; userLevel: number; requiredLevel: number }>;
    overallMatch: number;
    recommendations: string[];
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const analyzeSkillsGap = async () => {
    if (!jobDescription.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/skills/gap-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          jobDescription,
          userSkills
        })
      });

      if (response.ok) {
        const result = await response.json();
        setAnalysis(result.data);
      } else {
        // Fallback analysis if API fails
        setAnalysis(performClientSideAnalysis(jobDescription, userSkills));
      }
    } catch (error) {
      console.error('Gap analysis error:', error);
      // Fallback to client-side analysis
      setAnalysis(performClientSideAnalysis(jobDescription, userSkills));
    } finally {
      setLoading(false);
    }
  };

  const performClientSideAnalysis = (jobDesc: string, skills: Skill[]) => {
    const text = jobDesc.toLowerCase();
    
    // Common job requirement patterns
    const requiredSkills = [
      { name: 'JavaScript', category: 'Programming', keywords: ['javascript', 'js'] },
      { name: 'Python', category: 'Programming', keywords: ['python'] },
      { name: 'React', category: 'Frontend', keywords: ['react', 'reactjs'] },
      { name: 'Node.js', category: 'Backend', keywords: ['node', 'nodejs'] },
      { name: 'SQL', category: 'Database', keywords: ['sql', 'database'] },
      { name: 'AWS', category: 'Cloud', keywords: ['aws', 'amazon web services', 'cloud'] },
      { name: 'Leadership', category: 'Soft Skills', keywords: ['leadership', 'lead', 'manage'] },
      { name: 'Communication', category: 'Soft Skills', keywords: ['communication', 'communicate'] },
      { name: 'Project Management', category: 'Management', keywords: ['project management', 'agile', 'scrum'] },
    ];

    const userSkillsMap = new Map(skills.map(s => [s.name.toLowerCase(), s]));
    const missingSkills: Array<{ name: string; importance: number; category: string }> = [];
    const matchingSkills: Array<{ name: string; userLevel: number; requiredLevel: number }> = [];

    for (const reqSkill of requiredSkills) {
      const isRequired = reqSkill.keywords.some(keyword => text.includes(keyword));
      if (isRequired) {
        const userSkill = userSkillsMap.get(reqSkill.name.toLowerCase());
        if (userSkill) {
          matchingSkills.push({
            name: reqSkill.name,
            userLevel: userSkill.level,
            requiredLevel: 75 // Assume 75% proficiency required
          });
        } else {
          missingSkills.push({
            name: reqSkill.name,
            importance: 80,
            category: reqSkill.category
          });
        }
      }
    }

    const overallMatch = matchingSkills.length / (matchingSkills.length + missingSkills.length) * 100;
    
    const recommendations = [
      missingSkills.length > 0 ? `Focus on developing: ${missingSkills.slice(0, 3).map(s => s.name).join(', ')}` : '',
      matchingSkills.some(s => s.userLevel < s.requiredLevel) ? 'Strengthen existing skills to meet job requirements' : '',
      overallMatch > 70 ? 'Strong match - highlight relevant experience' : 'Consider additional training or certifications'
    ].filter(Boolean);

    return {
      missingSkills,
      matchingSkills,
      overallMatch: Math.round(overallMatch),
      recommendations
    };
  };

  const getMatchColor = (match: number) => {
    if (match >= 80) return '#16a34a'; // Green
    if (match >= 60) return '#d97706'; // Orange
    return '#ef4444'; // Red
  };

  return (
    <div style={{
      backgroundColor: 'white',
      padding: '24px',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      marginTop: '24px'
    }}>
      <h3 style={{
        fontSize: '20px',
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: '16px'
      }}>
        Skills Gap Analysis
      </h3>

      {/* Job Description Input */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: '500',
          color: '#374151',
          marginBottom: '8px'
        }}>
          Paste Job Description or Requirements:
        </label>
        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the job description here to analyze skill gaps..."
          style={{
            width: '100%',
            minHeight: '120px',
            padding: '12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
            fontFamily: 'inherit',
            resize: 'vertical'
          }}
        />
        <button
          onClick={analyzeSkillsGap}
          disabled={!jobDescription.trim() || loading}
          style={{
            marginTop: '12px',
            backgroundColor: jobDescription.trim() && !loading ? '#3b82f6' : '#9ca3af',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: jobDescription.trim() && !loading ? 'pointer' : 'not-allowed'
          }}
        >
          {loading ? 'Analyzing...' : 'Analyze Skills Gap'}
        </button>
      </div>

      {/* Analysis Results */}
      {analysis && (
        <div>
          {/* Overall Match Score */}
          <div style={{
            backgroundColor: '#f8fafc',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '24px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '48px',
              fontWeight: 'bold',
              color: getMatchColor(analysis.overallMatch),
              marginBottom: '8px'
            }}>
              {analysis.overallMatch}%
            </div>
            <div style={{
              fontSize: '16px',
              color: '#6b7280',
              fontWeight: '500'
            }}>
              Skills Match Score
            </div>
          </div>

          {/* Matching Skills */}
          {analysis.matchingSkills.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '12px'
              }}>
                ✅ Matching Skills ({analysis.matchingSkills.length})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {analysis.matchingSkills.map((skill, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    backgroundColor: '#f0f9ff',
                    borderRadius: '6px',
                    border: '1px solid #bae6fd'
                  }}>
                    <span style={{ fontWeight: '500', color: '#0c4a6e' }}>
                      {skill.name}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        Your Level: {skill.userLevel}%
                      </span>
                      <span style={{
                        fontSize: '12px',
                        color: skill.userLevel >= skill.requiredLevel ? '#16a34a' : '#d97706'
                      }}>
                        Required: {skill.requiredLevel}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Missing Skills */}
          {analysis.missingSkills.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '12px'
              }}>
                ⚠️ Missing Skills ({analysis.missingSkills.length})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {analysis.missingSkills.map((skill, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    backgroundColor: '#fef2f2',
                    borderRadius: '6px',
                    border: '1px solid #fecaca'
                  }}>
                    <span style={{ fontWeight: '500', color: '#991b1b' }}>
                      {skill.name}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        {skill.category}
                      </span>
                      <span style={{
                        fontSize: '12px',
                        backgroundColor: '#dc2626',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '3px'
                      }}>
                        High Priority
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {analysis.recommendations.length > 0 && (
            <div>
              <h4 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '12px'
              }}>
                💡 Recommendations
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {analysis.recommendations.map((rec, index) => (
                  <div key={index} style={{
                    padding: '12px',
                    backgroundColor: '#f0fdf4',
                    borderRadius: '6px',
                    border: '1px solid #bbf7d0',
                    fontSize: '14px',
                    color: '#166534'
                  }}>
                    {rec}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SkillsGapAnalysis;
