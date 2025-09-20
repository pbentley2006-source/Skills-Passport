import React, { useState, useEffect } from 'react';

interface MarketInsight {
  skill: string;
  category: string;
  demandScore: number;
  salaryRange: {
    min: number;
    max: number;
    median: number;
    currency: string;
  };
  growthTrend: number;
  jobOpenings: number;
  topCompanies: string[];
  relatedSkills: string[];
  regions: Array<{
    name: string;
    demand: number;
    salary: number;
  }>;
}

interface SkillRecommendation {
  skill: string;
  reason: string;
  impact: number;
  difficulty: number;
  timeToLearn: string;
  resources: Array<{
    type: string;
    name: string;
    provider: string;
    cost?: string;
  }>;
}

interface CareerPathway {
  currentRole: string;
  nextRoles: Array<{
    title: string;
    timeToAchieve: string;
    requiredSkills: string[];
    salaryIncrease: number;
    probability: number;
  }>;
}

interface MarketInsightsDashboardProps {
  userSkills: Array<{
    name: string;
    category: string;
    level: number;
  }>;
  leadershipProfile?: {
    type: string;
    confidence: number;
  };
}

const MarketInsightsDashboard: React.FC<MarketInsightsDashboardProps> = ({ 
  userSkills, 
  leadershipProfile 
}) => {
  const [insights, setInsights] = useState<MarketInsight[]>([]);
  const [recommendations, setRecommendations] = useState<SkillRecommendation[]>([]);
  const [careerPathways, setCareerPathways] = useState<CareerPathway | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'insights' | 'recommendations' | 'pathways'>('insights');

  useEffect(() => {
    fetchMarketData();
  }, [userSkills]);

  const fetchMarketData = async () => {
    setLoading(true);
    try {
      // In production, this would call the real API
      // For now, we'll simulate the data
      const mockInsights = generateMockInsights(userSkills);
      const mockRecommendations = generateMockRecommendations(userSkills, leadershipProfile);
      const mockPathways = generateMockPathways(userSkills, leadershipProfile);

      setInsights(mockInsights);
      setRecommendations(mockRecommendations);
      setCareerPathways(mockPathways);
    } catch (error) {
      console.error('Error fetching market data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockInsights = (skills: any[]): MarketInsight[] => {
    const mockData: { [key: string]: Partial<MarketInsight> } = {
      'JavaScript': {
        demandScore: 95,
        salaryRange: { min: 70000, max: 150000, median: 95000, currency: 'USD' },
        growthTrend: 12,
        jobOpenings: 45000,
        topCompanies: ['Google', 'Meta', 'Netflix', 'Airbnb'],
        relatedSkills: ['React', 'Node.js', 'TypeScript'],
        regions: [
          { name: 'San Francisco', demand: 98, salary: 130000 },
          { name: 'New York', demand: 92, salary: 115000 },
          { name: 'Remote', demand: 85, salary: 90000 }
        ]
      },
      'Leadership': {
        demandScore: 82,
        salaryRange: { min: 100000, max: 250000, median: 150000, currency: 'USD' },
        growthTrend: 10,
        jobOpenings: 22000,
        topCompanies: ['Google', 'Microsoft', 'Apple', 'Amazon'],
        relatedSkills: ['Strategic Planning', 'Team Management'],
        regions: [
          { name: 'San Francisco', demand: 92, salary: 180000 },
          { name: 'New York', demand: 90, salary: 165000 }
        ]
      }
    };

    return skills.slice(0, 3).map(skill => ({
      skill: skill.name,
      category: skill.category,
      demandScore: mockData[skill.name]?.demandScore || 60,
      salaryRange: mockData[skill.name]?.salaryRange || { min: 50000, max: 100000, median: 75000, currency: 'USD' },
      growthTrend: mockData[skill.name]?.growthTrend || 5,
      jobOpenings: mockData[skill.name]?.jobOpenings || 5000,
      topCompanies: mockData[skill.name]?.topCompanies || ['Various Companies'],
      relatedSkills: mockData[skill.name]?.relatedSkills || [],
      regions: mockData[skill.name]?.regions || [{ name: 'National', demand: 60, salary: 75000 }]
    }));
  };

  const generateMockRecommendations = (_skills: any[], _leadership: any): SkillRecommendation[] => {
    return [
      {
        skill: 'TypeScript',
        reason: 'High demand complement to JavaScript, 25% salary increase potential',
        impact: 75,
        difficulty: 40,
        timeToLearn: '2-4 weeks',
        resources: [
          { type: 'course', name: 'TypeScript Fundamentals', provider: 'Frontend Masters', cost: '$39/month' },
          { type: 'practice', name: 'TypeScript Exercises', provider: 'GitHub', cost: 'Free' }
        ]
      },
      {
        skill: 'AWS',
        reason: 'Cloud skills essential for modern development, 30% salary premium',
        impact: 85,
        difficulty: 60,
        timeToLearn: '2-3 months',
        resources: [
          { type: 'certification', name: 'AWS Solutions Architect', provider: 'Amazon', cost: '$150' },
          { type: 'course', name: 'AWS Fundamentals', provider: 'AWS Training', cost: 'Free' }
        ]
      }
    ];
  };

  const generateMockPathways = (_skills: any[], _leadership: any): CareerPathway => {
    return {
      currentRole: 'Senior Professional',
      nextRoles: [
        {
          title: 'Engineering Manager',
          timeToAchieve: '1-2 years',
          requiredSkills: ['Team Leadership', 'Project Management', 'Technical Strategy'],
          salaryIncrease: 25,
          probability: 85
        },
        {
          title: 'VP of Engineering',
          timeToAchieve: '3-4 years',
          requiredSkills: ['Strategic Planning', 'Budget Management', 'Organizational Leadership'],
          salaryIncrease: 50,
          probability: 65
        }
      ]
    };
  };

  const formatSalary = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getDemandColor = (score: number) => {
    if (score >= 80) return '#16a34a';
    if (score >= 60) return '#d97706';
    return '#ef4444';
  };

  const getImpactColor = (impact: number) => {
    if (impact >= 80) return '#16a34a';
    if (impact >= 60) return '#d97706';
    return '#ef4444';
  };

  if (loading) {
    return (
      <div style={{
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        marginTop: '24px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '18px', color: '#6b7280' }}>
          Loading market insights...
        </div>
      </div>
    );
  }

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
        marginBottom: '20px'
      }}>
        📊 Market Insights & Career Intelligence
      </h3>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #e5e7eb',
        marginBottom: '24px'
      }}>
        {[
          { key: 'insights', label: '📈 Market Data', count: insights.length },
          { key: 'recommendations', label: '💡 Recommendations', count: recommendations.length },
          { key: 'pathways', label: '🚀 Career Paths', count: careerPathways?.nextRoles.length || 0 }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            style={{
              padding: '12px 16px',
              border: 'none',
              backgroundColor: 'transparent',
              borderBottom: activeTab === tab.key ? '2px solid #3b82f6' : '2px solid transparent',
              color: activeTab === tab.key ? '#3b82f6' : '#6b7280',
              fontWeight: activeTab === tab.key ? '600' : '400',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Market Insights Tab */}
      {activeTab === 'insights' && (
        <div>
          {insights.map((insight, index) => (
            <div key={index} style={{
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '16px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px'
              }}>
                <div>
                  <h4 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#111827',
                    margin: '0 0 4px 0'
                  }}>
                    {insight.skill}
                  </h4>
                  <span style={{
                    fontSize: '12px',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    padding: '2px 8px',
                    borderRadius: '4px'
                  }}>
                    {insight.category}
                  </span>
                </div>
                <div style={{
                  textAlign: 'right'
                }}>
                  <div style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: getDemandColor(insight.demandScore)
                  }}>
                    {insight.demandScore}/100
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    Demand Score
                  </div>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '16px'
              }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                    Salary Range
                  </div>
                  <div style={{ fontWeight: '600', color: '#111827' }}>
                    {formatSalary(insight.salaryRange.min)} - {formatSalary(insight.salaryRange.max)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    Median: {formatSalary(insight.salaryRange.median)}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                    Growth Trend
                  </div>
                  <div style={{
                    fontWeight: '600',
                    color: insight.growthTrend > 10 ? '#16a34a' : insight.growthTrend > 5 ? '#d97706' : '#ef4444'
                  }}>
                    +{insight.growthTrend}% YoY
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                    Job Openings
                  </div>
                  <div style={{ fontWeight: '600', color: '#111827' }}>
                    {insight.jobOpenings.toLocaleString()}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                  Top Companies
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {insight.topCompanies.slice(0, 4).map((company, i) => (
                    <span key={i} style={{
                      fontSize: '12px',
                      backgroundColor: '#eff6ff',
                      color: '#1d4ed8',
                      padding: '4px 8px',
                      borderRadius: '4px'
                    }}>
                      {company}
                    </span>
                  ))}
                </div>
              </div>

              {insight.regions.length > 0 && (
                <div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                    Regional Data
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                    {insight.regions.slice(0, 3).map((region, i) => (
                      <div key={i} style={{
                        fontSize: '12px',
                        padding: '8px',
                        backgroundColor: '#f9fafb',
                        borderRadius: '4px',
                        border: '1px solid #e5e7eb'
                      }}>
                        <div style={{ fontWeight: '600' }}>{region.name}</div>
                        <div style={{ color: '#6b7280' }}>
                          {formatSalary(region.salary)} • {region.demand}% demand
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Recommendations Tab */}
      {activeTab === 'recommendations' && (
        <div>
          {recommendations.map((rec, index) => (
            <div key={index} style={{
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '16px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'start',
                marginBottom: '12px'
              }}>
                <div>
                  <h4 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#111827',
                    margin: '0 0 8px 0'
                  }}>
                    {rec.skill}
                  </h4>
                  <p style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    margin: '0',
                    lineHeight: '1.4'
                  }}>
                    {rec.reason}
                  </p>
                </div>
                <div style={{
                  textAlign: 'right',
                  minWidth: '80px'
                }}>
                  <div style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: getImpactColor(rec.impact)
                  }}>
                    {rec.impact}%
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    Impact
                  </div>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: '12px',
                marginBottom: '16px'
              }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>Difficulty</div>
                  <div style={{ fontWeight: '600', color: '#111827' }}>{rec.difficulty}%</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>Time to Learn</div>
                  <div style={{ fontWeight: '600', color: '#111827' }}>{rec.timeToLearn}</div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                  Learning Resources
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {rec.resources.slice(0, 3).map((resource, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '12px',
                      padding: '8px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '4px'
                    }}>
                      <span>
                        <strong>{resource.name}</strong> - {resource.provider}
                      </span>
                      {resource.cost && (
                        <span style={{ color: '#6b7280' }}>{resource.cost}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Career Pathways Tab */}
      {activeTab === 'pathways' && careerPathways && (
        <div>
          <div style={{
            textAlign: 'center',
            marginBottom: '24px',
            padding: '16px',
            backgroundColor: '#f8fafc',
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>
              {careerPathways.currentRole}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
              Current Position
            </div>
          </div>

          {careerPathways.nextRoles.map((role, index) => (
            <div key={index} style={{
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '16px',
              position: 'relative'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'start',
                marginBottom: '16px'
              }}>
                <div>
                  <h4 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#111827',
                    margin: '0 0 8px 0'
                  }}>
                    {role.title}
                  </h4>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                    Timeline: {role.timeToAchieve}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: '#16a34a'
                  }}>
                    +{role.salaryIncrease}%
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    Salary Increase
                  </div>
                </div>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px'
              }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                    Success Probability
                  </div>
                  <div style={{
                    width: '200px',
                    height: '8px',
                    backgroundColor: '#e5e7eb',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${role.probability}%`,
                      height: '100%',
                      backgroundColor: role.probability >= 70 ? '#16a34a' : role.probability >= 50 ? '#d97706' : '#ef4444'
                    }} />
                  </div>
                </div>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: role.probability >= 70 ? '#16a34a' : role.probability >= 50 ? '#d97706' : '#ef4444'
                }}>
                  {role.probability}%
                </div>
              </div>

              <div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                  Required Skills
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {role.requiredSkills.map((skill, i) => (
                    <span key={i} style={{
                      fontSize: '12px',
                      backgroundColor: '#fef3c7',
                      color: '#92400e',
                      padding: '4px 8px',
                      borderRadius: '4px'
                    }}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MarketInsightsDashboard;
