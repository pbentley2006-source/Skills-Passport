import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import axios from 'axios';
import SkillsRadarChart from '../components/SkillsRadarChart';
import {
  AcademicCapIcon,
  ShareIcon,
  BuildingOfficeIcon,
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

interface ProfileData {
  candidateId: string;
  professionalSummary: string;
  workExperience: WorkExperience[];
  skills: Skill[];
  achievements: any[];
  qualifications: any[];
  createdAt: string;
}

const Profile: React.FC = () => {
  const { profileId } = useParams<{ profileId: string }>();

  const { data: profileData, isLoading, error } = useQuery(
    ['profile', profileId],
    async () => {
      const response = await axios.get(`/profiles/${profileId}`);
      return response.data.data as ProfileData;
    },
    {
      enabled: !!profileId,
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

  const shareProfile = () => {
    const url = `${window.location.origin}/candidate/${profileData?.candidateId}`;
    navigator.clipboard.writeText(url);
    // You could add a toast notification here
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="text-center py-12">
        <h3 className="mt-2 text-sm font-medium text-gray-900">Profile not found</h3>
        <p className="mt-1 text-sm text-gray-500">
          The profile you're looking for doesn't exist or you don't have access to it.
        </p>
        <div className="mt-6">
          <Link
            to="/dashboard"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {profileData.candidateId}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Created on {formatDate(profileData.createdAt)}
              </p>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
              <div className="flex space-x-3">
                <button
                  onClick={shareProfile}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <ShareIcon className="h-4 w-4 mr-2" />
                  Share Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Professional Summary */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Professional Summary
          </h3>
          <p className="text-gray-700 leading-relaxed">
            {profileData.professionalSummary}
          </p>
        </div>
      </div>

      {/* Skills Visualization */}
      <SkillsRadarChart
        skills={profileData.skills}
        title="Skills Overview"
        height={400}
      />

      {/* Skills Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Technical Skills */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Technical Skills
            </h3>
            <div className="space-y-3">
              {getSkillsByCategory('TECHNICAL').map((skill, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{skill.name}</span>
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`h-2 w-2 rounded-full ${
                            level <= skill.proficiencyLevel
                              ? 'bg-primary-500'
                              : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    {skill.yearsExperience && (
                      <span className="text-xs text-gray-500">
                        {skill.yearsExperience}y
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Soft Skills */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Soft Skills
            </h3>
            <div className="space-y-3">
              {getSkillsByCategory('SOFT').map((skill, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{skill.name}</span>
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`h-2 w-2 rounded-full ${
                            level <= skill.proficiencyLevel
                              ? 'bg-green-500'
                              : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    {skill.yearsExperience && (
                      <span className="text-xs text-gray-500">
                        {skill.yearsExperience}y
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
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">
            Work Experience
          </h3>
          <div className="flow-root">
            <ul className="-mb-8">
              {profileData.workExperience.map((exp, index) => (
                <li key={index}>
                  <div className="relative pb-8">
                    {index !== profileData.workExperience.length - 1 && (
                      <span
                        className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                        aria-hidden="true"
                      />
                    )}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center ring-8 ring-white">
                          <BuildingOfficeIcon className="h-4 w-4 text-white" />
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div>
                          <div className="text-sm">
                            <p className="font-medium text-gray-900">{exp.position}</p>
                            <p className="text-gray-500">{exp.anonymizedCompany}</p>
                          </div>
                          <p className="mt-0.5 text-sm text-gray-500">
                            {formatDate(exp.startDate)} - {exp.endDate ? formatDate(exp.endDate) : 'Present'}
                            {' • '}
                            {calculateDuration(exp.startDate, exp.endDate)}
                          </p>
                        </div>
                        <div className="mt-2 text-sm text-gray-700">
                          {exp.responsibilities.length > 0 && (
                            <div className="mb-3">
                              <p className="font-medium text-gray-900 mb-1">Key Responsibilities:</p>
                              <ul className="list-disc list-inside space-y-1">
                                {exp.responsibilities.slice(0, 3).map((resp, idx) => (
                                  <li key={idx} className="text-sm">{resp}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {exp.achievements.length > 0 && (
                            <div>
                              <p className="font-medium text-gray-900 mb-1">Key Achievements:</p>
                              <ul className="list-disc list-inside space-y-1">
                                {exp.achievements.slice(0, 2).map((achievement, idx) => (
                                  <li key={idx} className="text-sm text-green-700">{achievement}</li>
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
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Education & Qualifications
            </h3>
            <div className="space-y-4">
              {profileData.qualifications.map((qual, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <AcademicCapIcon className="h-5 w-5 text-primary-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {qual.title} {qual.field && `in ${qual.field}`}
                    </p>
                    <p className="text-sm text-gray-500">
                      {qual.anonymizedInstitution} • {qual.year}
                    </p>
                    {qual.grade && (
                      <p className="text-sm text-gray-500">Grade: {qual.grade}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
