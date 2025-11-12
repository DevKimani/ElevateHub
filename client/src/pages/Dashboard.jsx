import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../services/userService';
import { setAuthToken } from '../services/api';

export default function Dashboard() {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = await getToken();
      setAuthToken(token);

      const response = await userService.getCurrentUser();
      const userData = response.data;

      // Check if profile is complete
      if (!userData.role || (userData.role === 'freelancer' && (!userData.skills || userData.skills.length === 0))) {
        navigate('/complete-profile');
        return;
      }

      setUser(userData);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Failed to load profile. Please refresh.</p>
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
                <p className="text-3xl font-bold text-primary-600">0</p>
                <p className="text-sm text-gray-600">Active applications</p>
              </div>
              <div className="card">
                <h3 className="text-lg font-semibold mb-2">Hourly Rate</h3>
                <p className="text-3xl font-bold text-primary-600">
                  KES {user.hourlyRate || 0}
                </p>
                <p className="text-sm text-gray-600">Per hour</p>
              </div>
            </>
          ) : (
            <>
              <div className="card">
                <h3 className="text-lg font-semibold mb-2">Active Jobs</h3>
                <p className="text-3xl font-bold text-primary-600">0</p>
                <p className="text-sm text-gray-600">Jobs posted</p>
              </div>
              <div className="card">
                <h3 className="text-lg font-semibold mb-2">Applications</h3>
                <p className="text-3xl font-bold text-primary-600">0</p>
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
                <button className="btn-primary text-left p-4">
                  <div className="text-2xl mb-2">🔍</div>
                  <div className="font-semibold">Browse Jobs</div>
                  <div className="text-sm opacity-90">Find your next opportunity</div>
                </button>
                <button className="btn-secondary text-left p-4">
                  <div className="text-2xl mb-2">👤</div>
                  <div className="font-semibold">Edit Profile</div>
                  <div className="text-sm">Update your information</div>
                </button>
              </>
            ) : (
              <>
                <button className="btn-primary text-left p-4">
                  <div className="text-2xl mb-2">➕</div>
                  <div className="font-semibold">Post a Job</div>
                  <div className="text-sm opacity-90">Find the right talent</div>
                </button>
                <button className="btn-secondary text-left p-4">
                  <div className="text-2xl mb-2">📋</div>
                  <div className="font-semibold">Manage Jobs</div>
                  <div className="text-sm">View your posted jobs</div>
                </button>
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