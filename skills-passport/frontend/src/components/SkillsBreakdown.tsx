import React from 'react';

interface Skill {
  name: string;
  level: number;
  category: string;
  yearsExperience?: number;
}

interface SkillsBreakdownProps {
  skills: Skill[];
  summary?: {
    totalExperience: string;
    seniority: string;
    primaryDomain: string;
  };
}

const SkillsBreakdown: React.FC<SkillsBreakdownProps> = ({ skills, summary }) => {
  // Group skills by category
  const skillsByCategory = skills.reduce((acc, skill) => {
    if (!acc[skill.category]) {
      acc[skill.category] = [];
    }
    acc[skill.category].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

  // Calculate category averages
  const categoryStats = Object.entries(skillsByCategory).map(([category, categorySkills]) => {
    const avgLevel = categorySkills.reduce((sum, skill) => sum + skill.level, 0) / categorySkills.length;
    const topSkill = categorySkills.reduce((top, skill) => skill.level > top.level ? skill : top);
    
    return {
      category,
      avgLevel: Math.round(avgLevel),
      skillCount: categorySkills.length,
      topSkill: topSkill.name,
      topSkillLevel: topSkill.level
    };
  }).sort((a, b) => b.avgLevel - a.avgLevel);

  const getSkillColor = (level: number) => {
    if (level >= 80) return '#16a34a'; // Green
    if (level >= 60) return '#d97706'; // Orange
    return '#ef4444'; // Red
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Programming': '#3b82f6',
      'Frontend': '#8b5cf6',
      'Backend': '#ef4444',
      'Database': '#10b981',
      'Cloud': '#06b6d4',
      'DevOps': '#f59e0b',
      'Tools': '#6b7280',
      'Methodology': '#8b5cf6',
      'Soft Skills': '#ec4899'
    };
    return colors[category] || '#6b7280';
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
        margin: '0 0 20px 0'
      }}>
        Skills Analytics
      </h3>

      {/* Summary Cards */}
      {summary && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div style={{
            backgroundColor: '#f8fafc',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e40af' }}>
              {summary.totalExperience}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>
              Total Experience
            </div>
          </div>
          
          <div style={{
            backgroundColor: '#f8fafc',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#059669' }}>
              {summary.seniority}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>
              Seniority Level
            </div>
          </div>
          
          <div style={{
            backgroundColor: '#f8fafc',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#7c3aed' }}>
              {summary.primaryDomain}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>
              Primary Domain
            </div>
          </div>
        </div>
      )}

      {/* Category Breakdown */}
      <div style={{ marginBottom: '24px' }}>
        <h4 style={{
          fontSize: '16px',
          fontWeight: '600',
          color: '#374151',
          marginBottom: '16px'
        }}>
          Skills by Category
        </h4>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {categoryStats.map((stat, index) => (
            <div key={index} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px',
              backgroundColor: '#f9fafb',
              borderRadius: '6px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: getCategoryColor(stat.category)
                }} />
                <div>
                  <div style={{ fontWeight: '500', color: '#111827' }}>
                    {stat.category}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    {stat.skillCount} skills • Top: {stat.topSkill}
                  </div>
                </div>
              </div>
              
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: getSkillColor(stat.avgLevel)
                }}>
                  {stat.avgLevel}%
                </div>
                <div style={{ fontSize: '10px', color: '#9ca3af' }}>
                  avg proficiency
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Skills */}
      <div>
        <h4 style={{
          fontSize: '16px',
          fontWeight: '600',
          color: '#374151',
          marginBottom: '16px'
        }}>
          Top Skills
        </h4>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '12px'
        }}>
          {skills
            .sort((a, b) => b.level - a.level)
            .slice(0, 6)
            .map((skill, index) => (
              <div key={index} style={{
                padding: '12px',
                backgroundColor: '#f8fafc',
                borderRadius: '6px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <span style={{ fontWeight: '500', color: '#111827' }}>
                    {skill.name}
                  </span>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: getSkillColor(skill.level)
                  }}>
                    {skill.level}%
                  </span>
                </div>
                
                <div style={{
                  width: '100%',
                  height: '4px',
                  backgroundColor: '#e5e7eb',
                  borderRadius: '2px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${skill.level}%`,
                    height: '100%',
                    backgroundColor: getSkillColor(skill.level),
                    borderRadius: '2px'
                  }} />
                </div>
                
                <div style={{
                  fontSize: '11px',
                  color: '#6b7280',
                  marginTop: '4px'
                }}>
                  {skill.category}
                  {skill.yearsExperience && ` • ${skill.yearsExperience}y exp`}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default SkillsBreakdown;
