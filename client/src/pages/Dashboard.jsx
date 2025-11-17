import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate, Link } from 'react-router-dom';
import { userService } from '../services/userService';
import { jobService } from '../services/jobService';
import { applicationService } from '../services/applicationService';
import { setAuthToken } from '../services/api';

export default function Dashboard() {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalJobs: 0,
    totalApplications: 0,
    pendingApplications: 0,
    acceptedApplications: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const fetchUserProfile = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) {
        setError('Authentication token not available');
        setLoading(false);
        return;
      }

      setAuthToken(token);

      const response = await userService.getCurrentUser();
      const userData = response.data;

      // Check if profile is complete
      if (!userData.role || (userData.role === 'freelancer' && (!userData.skills || userData.skills.length === 0))) {
        navigate('/complete-profile');
        return;
      }

      setUser(userData);
      // Fetch stats based on role
      await fetchStats(userData.role, token);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError(error.response?.data?.message || error.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [getToken, navigate]);

  const fetchStats = async (role, token) => {
    try {
      setAuthToken(token);
      
      if (role === 'freelancer') {
        // Fetch freelancer applications
        const appsResponse = await applicationService.getMyApplications();
        const applications = appsResponse.data;
        
        setStats({
          totalApplications: applications.length,
          pendingApplications: applications.filter(a => a.status === 'pending').length,
          acceptedApplications: applications.filter(a => a.status === 'accepted').length,
        });
      } else {
        // Fetch client jobs
        const jobsResponse = await jobService.getMyJobs();
        const jobs = jobsResponse.data;
        
        const totalApplications = jobs.reduce((sum, job) => sum + (job.applicationsCount || 0), 0);
        
        setStats({
          totalJobs: jobs.length,
          activeJobs: jobs.filter(j => j.status === 'open').length,
          totalApplications: totalApplications,
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Failed to load profile. Please refresh.</p>
          <button 
            onClick={() => window.location.reload()}
            className="btn-primary mt-4"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user.firstName}! 👋
              </h1>
              <p className="text-gray-600 mt-1">
                {user.role === 'freelancer' 
                  ? 'Find your next opportunity' 
                  : 'Find the perfect talent for your project'}
              </p>
            </div>
            <div className="text-right">
              <div className="inline-block px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm font-medium">
                {user.role === 'freelancer' ? '💼 Freelancer' : '👥 Client'}
              </div>
            </div>
          </div>
        </div>

        {/* Profile Summary */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div className="card">
            <h3 className="text-lg font-semibold mb-2">Profile Completion</h3>
            <div className="flex items-center">
              <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                <div 
                  className="bg-primary-600 h-2 rounded-full" 
                  style={{ width: '75%' }}
                ></div>
              </div>
              <span className="text-sm font-medium">75%</span>
            </div>
          </div>

          {user.role === 'freelancer' ? (
            <>
              <div className="card">
                <h3 className="text-lg font-semibold mb-2">Applications</h3>
                <p className="text-3xl font-bold text-primary-600">{stats.totalApplications}</p>
                <p className="text-sm text-gray-600">Total submitted</p>
              </div>
              <div className="card">
                <h3 className="text-lg font-semibold mb-2">Pending</h3>
                <p className="text-3xl font-bold text-yellow-600">{stats.pendingApplications}</p>
                <p className="text-sm text-gray-600">Awaiting response</p>
              </div>
              <div className="card">
                <h3 className="text-lg font-semibold mb-2">Accepted</h3>
                <p className="text-3xl font-bold text-green-600">{stats.acceptedApplications}</p>
                <p className="text-sm text-gray-600">Active projects</p>
              </div>
            </>
          ) : (
            <>
              <div className="card">
                <h3 className="text-lg font-semibold mb-2">Active Jobs</h3>
                <p className="text-3xl font-bold text-primary-600">{stats.totalJobs}</p>
                <p className="text-sm text-gray-600">Jobs posted</p>
              </div>
              <div className="card">
                <h3 className="text-lg font-semibold mb-2">Open Jobs</h3>
                <p className="text-3xl font-bold text-green-600">{stats.activeJobs}</p>
                <p className="text-sm text-gray-600">Accepting applications</p>
              </div>
              <div className="card">
                <h3 className="text-lg font-semibold mb-2">Applications</h3>
                <p className="text-3xl font-bold text-primary-600">{stats.totalApplications}</p>
                <p className="text-sm text-gray-600">Received</p>
              </div>
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card mb-6">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {user.role === 'freelancer' ? (
              <>
                <Link to="/jobs" className="btn-primary text-left p-4 block">
                  <div className="text-2xl mb-2">🔍</div>
                  <div className="font-semibold">Browse Jobs</div>
                  <div className="text-sm opacity-90">Find your next opportunity</div>
                </Link>
                <Link to="/my-applications" className="btn-secondary text-left p-4 block">
                  <div className="text-2xl mb-2">📝</div>
                  <div className="font-semibold">My Applications</div>
                  <div className="text-sm">Track your applications</div>
                </Link>
                {stats.acceptedApplications > 0 && (
                  <Link to="/messages" className="bg-blue-600 hover:bg-blue-700 text-white text-left p-4 block rounded-lg transition-colors">
                    <div className="text-2xl mb-2">💬</div>
                    <div className="font-semibold">Messages</div>
                    <div className="text-sm opacity-90">{stats.acceptedApplications} active project(s)</div>
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link to="/post-job" className="btn-primary text-left p-4 block">
                  <div className="text-2xl mb-2">➕</div>
                  <div className="font-semibold">Post a Job</div>
                  <div className="text-sm opacity-90">Find the right talent</div>
                </Link>
                <Link to="/my-jobs" className="btn-secondary text-left p-4 block">
                  <div className="text-2xl mb-2">📋</div>
                  <div className="font-semibold">Manage Jobs</div>
                  <div className="text-sm">View your posted jobs</div>
                </Link>
                {stats.totalApplications > 0 && (
                  <Link to="/messages" className="bg-blue-600 hover:bg-blue-700 text-white text-left p-4 block rounded-lg transition-colors">
                    <div className="text-2xl mb-2">💬</div>
                    <div className="font-semibold">Messages</div>
                    <div className="text-sm opacity-90">Chat with freelancers</div>
                  </Link>
                )}
              </>
            )}
          </div>
        </div>

        {/* Profile Info */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Your Profile</h2>
          <div className="space-y-3">
            <div>
              <span className="font-medium text-gray-700">Email:</span>
              <span className="ml-2 text-gray-900">{user.email}</span>
            </div>
            {user.bio && (
              <div>
                <span className="font-medium text-gray-700">Bio:</span>
                <p className="mt-1 text-gray-900">{user.bio}</p>
              </div>
            )}
            {user.role === 'freelancer' && user.skills && user.skills.length > 0 && (
              <div>
                <span className="font-medium text-gray-700">Skills:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {user.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {user.location && (
              <div>
                <span className="font-medium text-gray-700">Location:</span>
                <span className="ml-2 text-gray-900">{user.location}</span>
              </div>
            )}
            {user.phone && (
              <div>
                <span className="font-medium text-gray-700">Phone:</span>
                <span className="ml-2 text-gray-900">{user.phone}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}