import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import axios from 'axios';
import SkillsRadarChart from '../components/SkillsRadarChart';
import {
  BuildingOfficeIcon,
  AcademicCapIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

interface Skill {
  name: string;
  category: string;
  proficiencyLevel: number;
  yearsExperience?: number;
}

interface WorkExperience {
  anonymizedCompany: string;
  position: string;
  startDate: string;
  endDate?: string;
  responsibilities: string[];
  achievements: string[];
}

interface PublicProfileData {
  candidateId: string;
  professionalSummary: string;
  workExperience: WorkExperience[];
  skills: Skill[];
  achievements: any[];
  qualifications: any[];
  createdAt: string;
}

const PublicProfile: React.FC = () => {
  const { candidateId } = useParams<{ candidateId: string }>();

  const { data: profileData, isLoading, error } = useQuery(
    ['public-profile', candidateId],
    async () => {
      const response = await axios.get(`/profiles/candidate/${candidateId}`);
      return response.data.data as PublicProfileData;
    },
    {
      enabled: !!candidateId,
    }
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });
  };

  const calculateDuration = (startDate: string, endDate?: string) => {
    const start = new Date(startDate + '-01');
    const end = endDate ? new Date(endDate + '-01') : new Date();
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    
    if (months < 12) {
      return `${months} months`;
    } else {
      const years = Math.floor(months / 12);
      const remainingMonths = months % 12;
      return remainingMonths > 0 ? `${years} years ${remainingMonths} months` : `${years} years`;
    }
  };

  const getSkillsByCategory = (category: string) => {
    return profileData?.skills.filter(skill => skill.category === category) || [];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="mt-2 text-sm font-medium text-gray-900">Profile not found</h3>
          <p className="mt-1 text-sm text-gray-500">
            The candidate profile you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Skills Passport
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Anonymized Professional Profile
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-primary-600">
                {profileData.candidateId}
              </p>
              <p className="text-sm text-gray-500">
                Generated {formatDate(profileData.createdAt)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Professional Summary */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Professional Summary
            </h2>
            <p className="text-gray-700 leading-relaxed text-lg">
              {profileData.professionalSummary}
            </p>
          </div>
        </div>

        {/* Skills Visualization */}
        <SkillsRadarChart
          skills={profileData.skills}
          title="Skills Overview"
          height={450}
        />

        {/* Skills Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Technical Skills */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Technical Skills
              </h3>
              <div className="space-y-4">
                {getSkillsByCategory('TECHNICAL').map((skill, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{skill.name}</span>
                    <div className="flex items-center space-x-3">
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <div
                            key={level}
                            className={`h-3 w-3 rounded-full ${
                              level <= skill.proficiencyLevel
                                ? 'bg-primary-500'
                                : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      {skill.yearsExperience && (
                        <span className="text-sm text-gray-500 min-w-0">
                          {skill.yearsExperience} years
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Soft Skills */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Soft Skills
              </h3>
              <div className="space-y-4">
                {getSkillsByCategory('SOFT').map((skill, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{skill.name}</span>
                    <div className="flex items-center space-x-3">
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <div
                            key={level}
                            className={`h-3 w-3 rounded-full ${
                              level <= skill.proficiencyLevel
                                ? 'bg-green-500'
                                : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      {skill.yearsExperience && (
                        <span className="text-sm text-gray-500 min-w-0">
                          {skill.yearsExperience} years
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Work Experience */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-8">
              Professional Experience
            </h2>
            <div className="flow-root">
              <ul className="-mb-8">
                {profileData.workExperience.map((exp, index) => (
                  <li key={index}>
                    <div className="relative pb-8">
                      {index !== profileData.workExperience.length - 1 && (
                        <span
                          className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200"
                          aria-hidden="true"
                        />
                      )}
                      <div className="relative flex space-x-4">
                        <div>
                          <span className="h-10 w-10 rounded-full bg-primary-500 flex items-center justify-center ring-8 ring-white">
                            <BuildingOfficeIcon className="h-5 w-5 text-white" />
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div>
                            <div className="text-sm">
                              <p className="text-xl font-semibold text-gray-900">{exp.position}</p>
                              <p className="text-lg text-primary-600 font-medium">{exp.anonymizedCompany}</p>
                            </div>
                            <p className="mt-1 text-sm text-gray-500 flex items-center">
                              <CalendarIcon className="h-4 w-4 mr-1" />
                              {formatDate(exp.startDate)} - {exp.endDate ? formatDate(exp.endDate) : 'Present'}
                              {' • '}
                              {calculateDuration(exp.startDate, exp.endDate)}
                            </p>
                          </div>
                          <div className="mt-4 text-sm text-gray-700">
                            {exp.responsibilities.length > 0 && (
                              <div className="mb-4">
                                <p className="font-semibold text-gray-900 mb-2">Key Responsibilities:</p>
                                <ul className="list-disc list-inside space-y-1 ml-4">
                                  {exp.responsibilities.slice(0, 4).map((resp, idx) => (
                                    <li key={idx} className="text-sm leading-relaxed">{resp}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {exp.achievements.length > 0 && (
                              <div>
                                <p className="font-semibold text-gray-900 mb-2">Key Achievements:</p>
                                <ul className="list-disc list-inside space-y-1 ml-4">
                                  {exp.achievements.slice(0, 3).map((achievement, idx) => (
                                    <li key={idx} className="text-sm text-green-700 leading-relaxed font-medium">{achievement}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Education & Qualifications */}
        {profileData.qualifications.length > 0 && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Education & Qualifications
              </h2>
              <div className="space-y-6">
                {profileData.qualifications.map((qual, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <AcademicCapIcon className="h-6 w-6 text-primary-500 mt-1" />
                    <div>
                      <p className="font-semibold text-gray-900 text-lg">
                        {qual.title} {qual.field && `in ${qual.field}`}
                      </p>
                      <p className="text-gray-600 mt-1">
                        {qual.anonymizedInstitution} • {qual.year}
                      </p>
                      {qual.grade && (
                        <p className="text-sm text-gray-500 mt-1">Grade: {qual.grade}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">
            This is an anonymized skills profile generated by Skills Passport.
            <br />
            Personal identifying information has been removed to protect privacy while preserving professional value.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PublicProfile;
