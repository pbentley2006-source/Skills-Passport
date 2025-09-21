import React, { useState, useMemo } from 'react';

interface Skill {
  name: string;
  level: number;
  category: string;
  yearsExperience?: number;
  confidence?: number;
  onetCode?: string;
  proficiencyLevel?: number;
}

interface SimpleSkillsTableProps {
  skills: Skill[];
  title?: string;
}

const SimpleSkillsTable: React.FC<SimpleSkillsTableProps> = ({ 
  skills, 
  title = "Skills Data Table" 
}) => {
  const [sortField, setSortField] = useState<'name' | 'category' | 'proficiency'>('proficiency');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Get unique categories for filter dropdown
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(skills.map(skill => skill.category)));
    return ['all', ...uniqueCategories.sort()];
  }, [skills]);

  // Filter and sort skills
  const processedSkills = useMemo(() => {
    let filtered = skills;

    // Apply category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(skill => skill.category === filterCategory);
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'category':
          aValue = a.category.toLowerCase();
          bValue = b.category.toLowerCase();
          break;
        case 'proficiency':
          aValue = a.proficiencyLevel || a.level || 0;
          bValue = b.proficiencyLevel || b.level || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [skills, sortField, sortDirection, filterCategory]);

  const handleSort = (field: 'name' | 'category' | 'proficiency') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getProficiencyColor = (proficiency: number) => {
    if (proficiency >= 80) return '#16a34a'; // Green
    if (proficiency >= 60) return '#d97706'; // Orange
    return '#ef4444'; // Red
  };

  const getProficiencyBgColor = (proficiency: number) => {
    if (proficiency >= 80) return '#f0f9ff'; // Light green
    if (proficiency >= 60) return '#fffbeb'; // Light orange
    return '#fef2f2'; // Light red
  };

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
      
      {/* Controls */}
      <div style={{ 
        display: 'flex', 
        gap: '16px', 
        marginBottom: '16px',
        flexWrap: 'wrap'
      }}>
        {/* Category Filter */}
        <div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none',
              backgroundColor: 'white'
            }}
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category}
              </option>
            ))}
          </select>
        </div>
        
        {/* Sort Controls */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', color: '#6b7280' }}>Sort by:</span>
          <button
            onClick={() => handleSort('proficiency')}
            style={{
              padding: '4px 8px',
              fontSize: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              backgroundColor: sortField === 'proficiency' ? '#3b82f6' : 'white',
              color: sortField === 'proficiency' ? 'white' : '#374151',
              cursor: 'pointer'
            }}
          >
            Proficiency {sortField === 'proficiency' && (sortDirection === 'desc' ? '↓' : '↑')}
          </button>
          <button
            onClick={() => handleSort('name')}
            style={{
              padding: '4px 8px',
              fontSize: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              backgroundColor: sortField === 'name' ? '#3b82f6' : 'white',
              color: sortField === 'name' ? 'white' : '#374151',
              cursor: 'pointer'
            }}
          >
            Name {sortField === 'name' && (sortDirection === 'desc' ? '↓' : '↑')}
          </button>
          <button
            onClick={() => handleSort('category')}
            style={{
              padding: '4px 8px',
              fontSize: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              backgroundColor: sortField === 'category' ? '#3b82f6' : 'white',
              color: sortField === 'category' ? 'white' : '#374151',
              cursor: 'pointer'
            }}
          >
            Category {sortField === 'category' && (sortDirection === 'desc' ? '↓' : '↑')}
          </button>
        </div>
      </div>

      {/* Results Summary */}
      <div style={{ 
        fontSize: '14px', 
        color: '#6b7280', 
        marginBottom: '16px' 
      }}>
        Showing {processedSkills.length} of {skills.length} skills
        {filterCategory !== 'all' && ` in ${filterCategory}`}
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          fontSize: '14px'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb' }}>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                color: '#374151',
                borderBottom: '2px solid #e5e7eb'
              }}>
                Skill Name
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                color: '#374151',
                borderBottom: '2px solid #e5e7eb'
              }}>
                Category
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                color: '#374151',
                borderBottom: '2px solid #e5e7eb'
              }}>
                Proficiency
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                color: '#374151',
                borderBottom: '2px solid #e5e7eb'
              }}>
                Experience
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                color: '#374151',
                borderBottom: '2px solid #e5e7eb'
              }}>
                Confidence
              </th>
            </tr>
          </thead>
          <tbody>
            {processedSkills.map((skill, index) => {
              const proficiency = skill.proficiencyLevel || skill.level || 0;
              const confidence = skill.confidence || 0;
              
              return (
                <tr key={index} style={{ 
                  borderBottom: '1px solid #f3f4f6',
                  backgroundColor: index % 2 === 0 ? 'white' : '#fafafa'
                }}>
                  <td style={{ padding: '12px 16px', fontWeight: '500' }}>
                    {skill.name}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '4px 8px',
                      backgroundColor: '#dbeafe',
                      color: '#1e40af',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      {skill.category}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        padding: '4px 8px',
                        backgroundColor: getProficiencyBgColor(proficiency),
                        color: getProficiencyColor(proficiency),
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        {proficiency}%
                      </span>
                      <div style={{
                        width: '60px',
                        height: '6px',
                        backgroundColor: '#e5e7eb',
                        borderRadius: '3px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${Math.min(proficiency, 100)}%`,
                          height: '100%',
                          backgroundColor: getProficiencyColor(proficiency),
                          borderRadius: '3px'
                        }} />
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#6b7280' }}>
                    {skill.yearsExperience ? `${skill.yearsExperience} years` : 'N/A'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {confidence > 0 ? (
                      <span style={{
                        padding: '4px 8px',
                        backgroundColor: '#ede9fe',
                        color: '#7c3aed',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {confidence}%
                      </span>
                    ) : (
                      <span style={{ color: '#9ca3af' }}>N/A</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {processedSkills.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '32px',
          color: '#6b7280'
        }}>
          <p>No skills found matching your criteria</p>
        </div>
      )}
    </div>
  );
};

export default SimpleSkillsTable;
