import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip
} from 'recharts';

interface SkillData {
  name: string;
  category: string;
  proficiencyLevel: number;
  yearsExperience?: number;
}

interface SkillsRadarChartProps {
  skills: SkillData[];
  title?: string;
  height?: number;
  showLegend?: boolean;
  maxValue?: number;
}

interface RadarDataPoint {
  category: string;
  proficiency: number;
  skillCount: number;
  topSkills: string[];
}

const SkillsRadarChart: React.FC<SkillsRadarChartProps> = ({
  skills,
  title = "Skills Overview",
  height = 400,
  showLegend = true,
  maxValue = 5
}) => {
  // Group skills by category and calculate average proficiency
  const processSkillsData = (): RadarDataPoint[] => {
    const categoryMap = new Map<string, SkillData[]>();
    
    skills.forEach(skill => {
      const category = skill.category;
      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }
      categoryMap.get(category)!.push(skill);
    });

    const radarData: RadarDataPoint[] = [];
    
    categoryMap.forEach((categorySkills, category) => {
      const avgProficiency = categorySkills.reduce((sum, skill) => sum + skill.proficiencyLevel, 0) / categorySkills.length;
      const topSkills = categorySkills
        .sort((a, b) => b.proficiencyLevel - a.proficiencyLevel)
        .slice(0, 3)
        .map(skill => skill.name);

      radarData.push({
        category: formatCategoryName(category),
        proficiency: Math.round(avgProficiency * 10) / 10,
        skillCount: categorySkills.length,
        topSkills
      });
    });

    return radarData;
  };

  const formatCategoryName = (category: string): string => {
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          <p className="text-sm text-gray-600 mb-1">
            Average Proficiency: <span className="font-medium text-primary-600">{data.proficiency}/5</span>
          </p>
          <p className="text-sm text-gray-600 mb-2">
            Skills Count: <span className="font-medium">{data.skillCount}</span>
          </p>
          <div className="text-sm text-gray-600">
            <p className="font-medium mb-1">Top Skills:</p>
            <ul className="list-disc list-inside">
              {data.topSkills.map((skill: string, index: number) => (
                <li key={index} className="text-xs">{skill}</li>
              ))}
            </ul>
          </div>
        </div>
      );
    }
    return null;
  };

  const radarData = processSkillsData();

  if (radarData.length === 0) {
    return (
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '8px', 
        border: '1px solid #e5e7eb', 
        padding: '24px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      }}>
        <h3 style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          color: '#111827', 
          marginBottom: '16px',
          margin: '0 0 16px 0'
        }}>{title}</h3>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '256px', 
          color: '#6b7280' 
        }}>
          <div style={{ textAlign: 'center' }}>
            <svg style={{ 
              margin: '0 auto 16px auto', 
              height: '48px', 
              width: '48px', 
              color: '#9ca3af' 
            }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p style={{ fontSize: '14px' }}>No skills data available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      backgroundColor: 'white', 
      borderRadius: '8px', 
      border: '1px solid #e5e7eb', 
      padding: '24px',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
    }}>
      <h3 style={{ 
        fontSize: '18px', 
        fontWeight: '600', 
        color: '#111827', 
        marginBottom: '16px',
        margin: '0 0 16px 0'
      }}>{title}</h3>
      
      <ResponsiveContainer width="100%" height={height}>
        <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
          <PolarGrid 
            stroke="#e5e7eb" 
            strokeWidth={1}
          />
          <PolarAngleAxis 
            dataKey="category" 
            tick={{ fontSize: 12, fill: '#6b7280' }}
            className="text-sm"
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, maxValue]}
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            tickCount={6}
          />
          <Radar
            name="Proficiency"
            dataKey="proficiency"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.1}
            strokeWidth={2}
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
          />
          <Tooltip content={<CustomTooltip />} />
          {showLegend && (
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
            />
          )}
        </RadarChart>
      </ResponsiveContainer>

      {/* Skills Summary */}
      <div style={{ 
        marginTop: '24px', 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
        gap: '16px' 
      }}>
        {radarData.map((category, index) => (
          <div key={index} style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '24px', 
              fontWeight: 'bold', 
              color: '#3b82f6',
              marginBottom: '4px'
            }}>
              {category.proficiency}
            </div>
            <div style={{ 
              fontSize: '12px', 
              color: '#6b7280', 
              textTransform: 'uppercase', 
              letterSpacing: '0.05em',
              marginBottom: '2px'
            }}>
              {category.category}
            </div>
            <div style={{ 
              fontSize: '12px', 
              color: '#9ca3af' 
            }}>
              {category.skillCount} skills
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SkillsRadarChart;
