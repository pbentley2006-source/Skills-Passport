import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import axios from 'axios';
import {
  CloudArrowUpIcon,
  DocumentTextIcon,
  ChartBarIcon,
  EyeIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';

interface CVUpload {
  id: string;
  filename: string;
  status: 'UPLOADED' | 'PROCESSING' | 'PARSED' | 'FAILED';
  uploadedAt: string;
  profile?: {
    id: string;
    candidateId: string;
    createdAt: string;
  };
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  // Demo data for when backend is not available
  const demoUploads: CVUpload[] = [
    {
      id: 'demo-1',
      filename: 'john_doe_cv.pdf',
      status: 'PARSED' as const,
      uploadedAt: '2024-01-15T10:30:00Z',
      profile: {
        id: 'profile-1',
        candidateId: 'candidate-1',
        createdAt: '2024-01-15T10:35:00Z'
      }
    },
    {
      id: 'demo-2', 
      filename: 'resume_2024.docx',
      status: 'PROCESSING' as const,
      uploadedAt: '2024-01-20T14:20:00Z'
    }
  ];

  const { data: uploadsData, isLoading } = useQuery(
    'user-uploads',
    async () => {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return { uploads: demoUploads };
    },
    {
      // Don't retry on error for demo
      retry: false,
      // Use demo data if query fails
      onError: () => {
        return { uploads: demoUploads };
      }
    }
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'UPLOADED':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'PROCESSING':
        return <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>;
      case 'PARSED':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'FAILED':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'UPLOADED':
        return 'Uploaded';
      case 'PROCESSING':
        return 'Processing';
      case 'PARSED':
        return 'Ready';
      case 'FAILED':
        return 'Failed';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Welcome back, {user?.firstName}!
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Transform your CV into an anonymized skills profile
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Link
            to="/upload"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <CloudArrowUpIcon className="h-4 w-4 mr-2" />
            Upload CV
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentTextIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total CVs</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {uploadsData?.uploads?.length || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Processed</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {uploadsData?.uploads?.filter((upload: CVUpload) => upload.status === 'PARSED').length || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Profiles</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {uploadsData?.uploads?.filter((upload: CVUpload) => upload.profile).length || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Processing</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {uploadsData?.uploads?.filter((upload: CVUpload) => 
                      upload.status === 'UPLOADED' || upload.status === 'PROCESSING'
                    ).length || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Uploads */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Recent CV Uploads</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Track the status of your uploaded CVs and generated profiles
          </p>
        </div>
        
        {uploadsData?.uploads?.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No CVs uploaded</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by uploading your first CV to create an anonymized skills profile.
            </p>
            <div className="mt-6">
              <Link
                to="/upload"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <CloudArrowUpIcon className="h-4 w-4 mr-2" />
                Upload Your First CV
              </Link>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {uploadsData?.uploads?.map((upload: CVUpload) => (
              <li key={upload.id}>
                <div className="px-4 py-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      {getStatusIcon(upload.status)}
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {upload.filename}
                        </p>
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          upload.status === 'PARSED' 
                            ? 'bg-green-100 text-green-800'
                            : upload.status === 'PROCESSING'
                            ? 'bg-blue-100 text-blue-800'
                            : upload.status === 'FAILED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {getStatusText(upload.status)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        Uploaded {formatDate(upload.uploadedAt)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {upload.profile && (
                      <>
                        <Link
                          to={`/profile/${upload.profile.id}`}
                          className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                          <EyeIcon className="h-3 w-3 mr-1" />
                          View Profile
                        </Link>
                        <span className="text-xs text-gray-500">
                          ID: {upload.profile.candidateId}
                        </span>
                      </>
                    )}
                    
                    {upload.status === 'PARSED' && !upload.profile && (
                      <button
                        onClick={async () => {
                          try {
                            await axios.post(`/cvs/${upload.id}/generate-profile`);
                            window.location.reload();
                          } catch (error) {
                            console.error('Failed to generate profile:', error);
                          }
                        }}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        Generate Profile
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Quick Actions</h3>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Link
              to="/upload"
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 rounded-lg border border-gray-300 hover:border-gray-400"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-primary-50 text-primary-600 group-hover:bg-primary-100">
                  <CloudArrowUpIcon className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Upload New CV
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Upload a new CV to create an anonymized skills profile
                </p>
              </div>
            </Link>

            <div className="relative group bg-white p-6 rounded-lg border border-gray-300 opacity-50">
              <div>
                <span className="rounded-lg inline-flex p-3 bg-gray-50 text-gray-400">
                  <ChartBarIcon className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium text-gray-400">
                  Skills Analytics
                </h3>
                <p className="mt-2 text-sm text-gray-400">
                  Coming soon - Analyze skills trends and benchmarks
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
