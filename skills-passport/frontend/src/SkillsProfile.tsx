import React, { useState, useEffect } from 'react';
import SkillsRadarChart from './components/SkillsRadarChart';
import SkillsBreakdown from './components/SkillsBreakdown';
import SkillsGapAnalysis from './components/SkillsGapAnalysis';
import MarketInsightsDashboard from './components/MarketInsightsDashboard';
import SimpleSkillsTable from './components/SimpleSkillsTable';

interface SkillsProfileProps {
  onBack: () => void;
}

interface Skill {
  name: string;
  level: number;
  category: string;
  yearsExperience?: number;
  confidence?: number;
  onetCode?: string;
  proficiencyLevel?: number; // For technical skills
}


const SkillsProfile: React.FC<SkillsProfileProps> = ({ onBack }) => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [experienceData, setExperienceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    fetchExtractedSkills();
  }, []);

  const fetchExtractedSkills = async () => {
    setLoading(true);
    setError('');
    
    try {
      const uploadId = localStorage.getItem('lastUploadId');
      const isDemoMode = localStorage.getItem('demoMode') === 'true';
      
      if (!uploadId) {
        setError('No upload found. Please upload a CV first.');
        return;
      }

      // If in demo mode, skip API call and use demo data
      if (isDemoMode) {
        console.log('🎭 Demo mode active, using enhanced demo data');
        
        // Enhanced demo data with Phase 2 features
        const demoSkills = getDemoSkills();
        const demoExperience = getDemoExperience();
        const demoSummary = getDemoSummary();
        
        setSkills(demoSkills);
        setExperienceData(demoExperience);
        setSummary(demoSummary);
        return;
      }

      const response = await fetch(`/api/cvs/${uploadId}/skills`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Fetched skills data:', result.data);
        
        if (result.data && result.data.skills) {
          // Combine technical and soft skills with proper field mapping
          const technicalSkills = (result.data.skills.technicalSkills || []).map((skill: any) => ({
            ...skill,
            level: skill.proficiencyLevel // Map proficiencyLevel to level for consistency
          }));
          
          const softSkills = (result.data.skills.softSkills || []).map((skill: any) => ({
            ...skill,
            category: skill.category || 'Soft Skills', // Ensure category exists
            proficiencyLevel: skill.level // Map level to proficiencyLevel for consistency
          }));
          
          // Combine all skills
          const allSkills = [...technicalSkills, ...softSkills];
          
          console.log('🔍 Combined skills data:', allSkills);
          console.log('📊 Technical skills count:', technicalSkills.length);
          console.log('📊 Soft skills count:', softSkills.length);
          
          setSkills(allSkills);
          setExperienceData(result.data.skills.experience || []);
          setSummary(result.data.skills.summary || null);
        }
      } else {
        console.log('❌ API call failed, using demo data');
        // Fallback to demo data
        const demoSkills = getDemoSkills();
        const demoExperience = getDemoExperience();
        const demoSummary = getDemoSummary();
        
        setSkills(demoSkills);
        setExperienceData(demoExperience);
        setSummary(demoSummary);
      }
    } catch (error) {
      console.error('❌ Error fetching skills:', error);
      setError('Failed to load skills data. Showing demo data.');
      setSkills(getDemoSkills());
      setExperienceData(getDemoExperience());
      setSummary(getDemoSummary());
    } finally {
      setLoading(false);
    }
  };

  const getDemoSkills = (): Skill[] => [
    { name: 'JavaScript', level: 90, category: 'Programming' },
    { name: 'React', level: 85, category: 'Frontend' },
    { name: 'Node.js', level: 80, category: 'Backend' },
    { name: 'TypeScript', level: 75, category: 'Programming' },
    { name: 'Python', level: 70, category: 'Programming' },
    { name: 'SQL', level: 85, category: 'Database' },
    { name: 'AWS', level: 65, category: 'Cloud' },
    { name: 'Docker', level: 70, category: 'DevOps' },
    { name: 'Git', level: 90, category: 'Tools' },
    { name: 'Agile', level: 80, category: 'Methodology' }
  ];

  const getDemoExperience = () => [
    {
      title: 'Senior Software Engineer',
      company: 'Company A',
      duration: '2021 - Present',
      description: 'Led development of scalable web applications using React and Node.js. Mentored junior developers and implemented CI/CD pipelines.',
      keyAchievements: ['Led team of 5 developers', 'Improved system performance by 40%']
    },
    {
      title: 'Software Engineer',
      company: 'Company B', 
      duration: '2019 - 2021',
      description: 'Developed full-stack applications and improved system performance by 40%. Collaborated with cross-functional teams on product features.',
      keyAchievements: ['Built 3 major features', 'Reduced load times by 50%']
    }
  ];

  const getDemoSummary = () => ({
    totalExperience: '5+ years',
    seniority: 'Senior',
    primaryDomain: 'Software Development'
  });

  const experience = experienceData.length > 0 ? experienceData : [
    {
      title: 'Senior Software Engineer',
      company: 'Company A',
      duration: '2021 - Present',
      description: 'Led development of scalable web applications using React and Node.js. Mentored junior developers and implemented CI/CD pipelines.'
    },
    {
      title: 'Software Engineer',
      company: 'Company B', 
      duration: '2019 - 2021',
      description: 'Developed full-stack applications and improved system performance by 40%. Collaborated with cross-functional teams on product features.'
    },
    {
      title: 'Junior Developer',
      company: 'Company C',
      duration: '2018 - 2019',
      description: 'Built responsive web interfaces and learned modern development practices. Contributed to open-source projects.'
    }
  ];

  const getSkillColor = (level: number) => {
    if (level >= 80) return '#16a34a'; // Green
    if (level >= 60) return '#d97706'; // Orange
    return '#ef4444'; // Red
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Programming': '#2563eb',
      'Frontend': '#7c3aed',
      'Backend': '#dc2626',
      'Database': '#059669',
      'Cloud': '#0891b2',
      'DevOps': '#ea580c',
      'Tools': '#6b7280',
      'Methodology': '#9333ea'
    };
    return colors[category] || '#6b7280';
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        <button
          onClick={onBack}
          style={{
            backgroundColor: 'transparent',
            border: '1px solid #d1d5db',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </button>
        <h1 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#111827',
          margin: '0'
        }}>
          Skills Profile
        </h1>
      </header>

      {/* Main Content */}
      <main style={{ padding: '24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          {/* Loading State */}
          {loading && (
            <div style={{ 
              textAlign: 'center', 
              padding: '48px',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: '18px', color: '#6b7280' }}>
                Loading your skills profile...
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div style={{ 
              textAlign: 'center', 
              padding: '48px',
              backgroundColor: '#fef2f2',
              borderRadius: '8px',
              border: '1px solid #fecaca',
              marginBottom: '24px'
            }}>
              <div style={{ fontSize: '18px', color: '#dc2626', marginBottom: '8px' }}>
                ⚠️ {error}
              </div>
              <button 
                onClick={fetchExtractedSkills}
                style={{
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Retry
              </button>
            </div>
          )}

          {/* Skills Content */}
          {!loading && (
            <div>
          {/* Profile Overview */}
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                backgroundColor: '#dbeafe',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="32" height="32" fill="none" stroke="#2563eb" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: '#111827',
                  margin: '0 0 4px 0'
                }}>
                  Anonymous Professional Profile
                </h2>
                <p style={{
                  fontSize: '16px',
                  color: '#6b7280',
                  margin: '0'
                }}>
                  Senior Software Engineer • 5+ years experience • Tech Industry
                </p>
              </div>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginTop: '16px'
            }}>
              <div style={{
                padding: '16px',
                backgroundColor: '#f0f9ff',
                borderRadius: '6px',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: '#2563eb',
                  margin: '0 0 4px 0'
                }}>
                  {skills.length}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#6b7280'
                }}>
                  Skills Identified
                </div>
              </div>
              <div style={{
                padding: '16px',
                backgroundColor: '#f0fdf4',
                borderRadius: '6px',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: '#16a34a',
                  margin: '0 0 4px 0'
                }}>
                  {Math.round(skills.reduce((acc, skill) => acc + skill.level, 0) / skills.length)}%
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#6b7280'
                }}>
                  Avg. Proficiency
                </div>
              </div>
              <div style={{
                padding: '16px',
                backgroundColor: '#fefce8',
                borderRadius: '6px',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: '#d97706',
                  margin: '0 0 4px 0'
                }}>
                  {experience.length}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#6b7280'
                }}>
                  Positions
                </div>
              </div>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: '24px'
          }}>
            {/* Skills Section */}
            <div style={{
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#111827',
                margin: '0 0 20px 0'
              }}>
                Technical Skills
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {skills.map((skill, index) => (
                  <div key={index}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          fontSize: '14px',
                          fontWeight: '500',
                          color: '#111827'
                        }}>
                          {skill.name}
                        </span>
                        <span style={{
                          fontSize: '12px',
                          padding: '2px 8px',
                          backgroundColor: getCategoryColor(skill.category),
                          color: 'white',
                          borderRadius: '12px'
                        }}>
                          {skill.category}
                        </span>
                      </div>
                      <span style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: getSkillColor(skill.level)
                      }}>
                        {skill.level}%
                      </span>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '8px',
                      backgroundColor: '#e5e7eb',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${skill.level}%`,
                        height: '100%',
                        backgroundColor: getSkillColor(skill.level),
                        borderRadius: '4px'
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Experience Section */}
            <div style={{
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#111827',
                margin: '0 0 20px 0'
              }}>
                Experience
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {experience.map((exp, index) => (
                  <div key={index} style={{
                    paddingBottom: '20px',
                    borderBottom: index < experience.length - 1 ? '1px solid #e5e7eb' : 'none'
                  }}>
                    <h4 style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#111827',
                      margin: '0 0 4px 0'
                    }}>
                      {exp.title}
                    </h4>
                    <div style={{
                      fontSize: '14px',
                      color: '#2563eb',
                      fontWeight: '500',
                      margin: '0 0 4px 0'
                    }}>
                      {exp.company}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      margin: '0 0 8px 0'
                    }}>
                      {exp.duration}
                    </div>
                    <p style={{
                      fontSize: '14px',
                      color: '#374151',
                      margin: '0',
                      lineHeight: '1.4'
                    }}>
                      {exp.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Skills Radar Chart */}
          <div style={{ marginTop: '24px' }}>
            <SkillsRadarChart 
              skills={skills.map(skill => ({
                name: skill.name,
                category: skill.category,
                proficiencyLevel: (skill.proficiencyLevel || skill.level) / 20, // Convert 0-100 to 0-5 scale
                yearsExperience: skill.yearsExperience
              }))}
              title="Skills Radar Analysis"
              height={400}
              maxValue={5}
              showLegend={true}
            />
          </div>

          {/* Skills Data Table */}
          <div style={{ marginTop: '24px' }}>
            <SimpleSkillsTable 
              skills={skills}
              title="Detailed Skills Analysis"
            />
          </div>

          {/* Skills Analytics Breakdown */}
          <SkillsBreakdown 
            skills={skills}
            summary={summary}
          />

          {/* Skills Gap Analysis */}
          <SkillsGapAnalysis 
            userSkills={skills.map(skill => ({
              name: skill.name,
              level: skill.level,
              category: skill.category,
              confidence: skill.confidence || 75,
              onetCode: skill.onetCode
            }))}
          />

          {/* Market Insights Dashboard */}
          <MarketInsightsDashboard 
            userSkills={skills.map(skill => ({
              name: skill.name,
              level: skill.level,
              category: skill.category
            }))}
            leadershipProfile={summary?.leadershipProfile}
          />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SkillsProfile;
