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

interface SkillsTableProps {
  skills: Skill[];
  title?: string;
}

type SortField = 'name' | 'category' | 'proficiency' | 'experience' | 'confidence';
type SortDirection = 'asc' | 'desc';

const SkillsTable: React.FC<SkillsTableProps> = ({ 
  skills, 
  title = "Skills Data Table" 
}) => {
  const [sortField, setSortField] = useState<SortField>('proficiency');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

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

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(skill => 
        skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        skill.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
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
        case 'experience':
          aValue = a.yearsExperience || 0;
          bValue = b.yearsExperience || 0;
          break;
        case 'confidence':
          aValue = a.confidence || 0;
          bValue = b.confidence || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [skills, sortField, sortDirection, filterCategory, searchTerm]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    
    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  const getProficiencyColor = (proficiency: number) => {
    if (proficiency >= 80) return 'text-green-600 bg-green-50';
    if (proficiency >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-blue-600 bg-blue-50';
    if (confidence >= 60) return 'text-purple-600 bg-purple-50';
    return 'text-gray-600 bg-gray-50';
  };

  return (
    <div style={{ 
      backgroundColor: 'white', 
      borderRadius: '8px', 
      border: '1px solid #e5e7eb', 
      padding: '24px',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          color: '#111827', 
          marginBottom: '16px' 
        }}>{title}</h3>
        
        {/* Controls */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '16px', 
          marginBottom: '16px' 
        }}>
          {/* Search */}
          <div style={{ flex: 1 }}>
            <input
              type="text"
              placeholder="Search skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>
          
          {/* Category Filter */}
          <div style={{ width: '200px' }}>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none'
              }}
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
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
          {searchTerm && ` matching "${searchTerm}"`}
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ 
          minWidth: '100%', 
          borderCollapse: 'collapse',
          borderSpacing: 0
        }}>
          <thead style={{ backgroundColor: '#f9fafb' }}>
            <tr>
              <th 
                style={{
                  padding: '12px 24px',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: '500',
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  cursor: 'pointer',
                  borderBottom: '1px solid #e5e7eb'
                }}
                onClick={() => handleSort('name')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Skill Name</span>
                  {getSortIcon('name')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('category')}
              >
                <div className="flex items-center space-x-1">
                  <span>Category</span>
                  {getSortIcon('category')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('proficiency')}
              >
                <div className="flex items-center space-x-1">
                  <span>Proficiency</span>
                  {getSortIcon('proficiency')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('experience')}
              >
                <div className="flex items-center space-x-1">
                  <span>Experience</span>
                  {getSortIcon('experience')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('confidence')}
              >
                <div className="flex items-center space-x-1">
                  <span>Confidence</span>
                  {getSortIcon('confidence')}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                O*NET Code
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {processedSkills.map((skill, index) => {
              const proficiency = skill.proficiencyLevel || skill.level || 0;
              const confidence = skill.confidence || 0;
              
              return (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{skill.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {skill.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getProficiencyColor(proficiency)}`}>
                            {proficiency}%
                          </span>
                          <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${Math.min(proficiency, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {skill.yearsExperience ? `${skill.yearsExperience} years` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {confidence > 0 ? (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getConfidenceColor(confidence)}`}>
                        {confidence}%
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {skill.onetCode || 'N/A'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {processedSkills.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>No skills found matching your criteria</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SkillsTable;
