// client/src/pages/JobDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import api from '../services/api';

function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  
  const [job, setJob] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [checkingApplication, setCheckingApplication] = useState(false);

  useEffect(() => {
    fetchJobDetail();
    fetchCurrentUser();
  }, [id]);

  useEffect(() => {
    if (job && user && currentUser?.role === 'freelancer') {
      checkIfApplied();
    }
  }, [job, user, currentUser]);

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/users/me');
      setCurrentUser(response.data.user);
    } catch (err) {
      console.error('Error fetching current user:', err);
    }
  };

  const fetchJobDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get(`/jobs/${id}`);
      
      console.log('Job detail response:', response.data);

      setJob(response.data.job);

    } catch (err) {
      console.error('Error fetching job:', err);
      setError(err.response?.data?.message || 'Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const checkIfApplied = async () => {
    try {
      setCheckingApplication(true);
      
      const response = await api.get('/applications/my-applications');
      
      console.log('My applications:', response.data);

      const applications = response.data.applications || [];
      const applied = applications.some(
        app => app.job?._id === id || app.job === id
      );
      
      setHasApplied(applied);

    } catch (err) {
      console.error('Error checking applications:', err);
    } finally {
      setCheckingApplication(false);
    }
  };

  const handleApply = () => {
    navigate(`/jobs/${id}/apply`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
          <svg className="mx-auto h-12 w-12 text-red-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="text-red-800 font-semibold mb-2">Job Not Found</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <button 
            onClick={() => navigate('/browse-jobs')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Browse Jobs
          </button>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Job not found</p>
          <button 
            onClick={() => navigate('/browse-jobs')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Browse Jobs
          </button>
        </div>
      </div>
    );
  }

  // ✅ FIXED: Properly check user role
  const isClient = currentUser?.role === 'client';
  const isFreelancer = currentUser?.role === 'freelancer';
  const isOwner = isClient && job.client?._id === currentUser?._id;
  const canApply = isFreelancer && job.status === 'open' && !hasApplied;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      {/* Job Header */}
      <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {job.title}
            </h1>
            <div className="flex items-center gap-4 text-gray-600">
              <span className={`px-3 py-1 rounded-full text-sm ${
                job.status === 'open' ? 'bg-green-100 text-green-800' :
                job.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                job.status === 'completed' ? 'bg-purple-100 text-purple-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {job.status.replace('_', ' ')}
              </span>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                {job.category}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">
              KES {job.budget?.toLocaleString()}
            </div>
            <p className="text-sm text-gray-500 mt-1">Budget</p>
          </div>
        </div>

        {/* Client Info */}
        <div className="border-t border-gray-200 pt-4 mt-4">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Posted by</h3>
          <div className="flex items-center gap-3">
            {job.client?.profilePicture ? (
              <img 
                src={job.client.profilePicture} 
                alt={`${job.client.firstName} ${job.client.lastName}`}
                className="w-12 h-12 rounded-full"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                {job.client?.firstName?.[0]}{job.client?.lastName?.[0]}
              </div>
            )}
            <div>
              <p className="font-medium text-gray-900">
                {job.client?.firstName} {job.client?.lastName}
              </p>
              {job.client?.location && (
                <p className="text-sm text-gray-600">{job.client.location}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Job Description */}
      <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
        <h2 className="text-xl font-semibold mb-4">Job Description</h2>
        <p className="text-gray-700 whitespace-pre-line">
          {job.description}
        </p>
      </div>

      {/* Job Details */}
      <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
        <h2 className="text-xl font-semibold mb-4">Job Details</h2>
        <div className="grid grid-cols-2 gap-6">
          {job.experienceLevel && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Experience Level</h3>
              <p className="text-gray-900 capitalize">{job.experienceLevel}</p>
            </div>
          )}
          {job.deadline && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Deadline</h3>
              <p className="text-gray-900">
                {new Date(job.deadline).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          )}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Posted</h3>
            <p className="text-gray-900">
              {new Date(job.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
          {job.applicationsCount !== undefined && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Applications</h3>
              <p className="text-gray-900">{job.applicationsCount} applications</p>
            </div>
          )}
        </div>
      </div>

      {/* Skills Required */}
      {job.skills && job.skills.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h2 className="text-xl font-semibold mb-4">Skills Required</h2>
          <div className="flex flex-wrap gap-2">
            {job.skills.map((skill, index) => (
              <span 
                key={index}
                className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        {isOwner ? (
          // Client owns this job
          <div className="flex gap-4">
            <Link
              to={`/jobs/${job._id}/applications`}
              className="flex-1 px-6 py-3 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition-colors"
            >
              View Applications ({job.applicationsCount || 0})
            </Link>
            <Link
              to={`/jobs/${job._id}/edit`}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Edit Job
            </Link>
          </div>
        ) : isClient ? (
          // Client viewing someone else's job
          <div className="text-center p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-gray-600">
              This is another client's job posting
            </p>
          </div>
        ) : isFreelancer ? (
          // Freelancer viewing job
          <div>
            {hasApplied ? (
              <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                <svg className="mx-auto h-12 w-12 text-green-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-green-800 font-medium">You've already applied to this job</p>
                <Link
                  to="/my-applications"
                  className="mt-4 inline-block px-6 py-2 text-green-700 hover:text-green-800"
                >
                  View Your Applications →
                </Link>
              </div>
            ) : canApply ? (
              <button
                onClick={handleApply}
                disabled={checkingApplication}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {checkingApplication ? 'Checking...' : 'Apply for this Job'}
              </button>
            ) : (
              <div className="text-center p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-gray-600">
                  {job.status !== 'open' 
                    ? 'This job is no longer accepting applications' 
                    : 'You cannot apply to this job'}
                </p>
              </div>
            )}
          </div>
        ) : (
          // Not logged in
          <div className="text-center p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-gray-600">Please sign in to apply for this job</p>
            <Link
              to="/sign-in"
              className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default JobDetail;