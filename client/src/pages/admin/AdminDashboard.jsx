// client/src/pages/admin/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import {
  Users, Briefcase, FileText, DollarSign,
  TrendingUp, AlertCircle, UserX, UserCheck
} from 'lucide-react';

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/stats');
      setStats(response.data.stats);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError(err.response?.data?.message || 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h3 className="text-red-800 font-semibold mb-2">Error</h3>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  const StatCard = ({ title, value, icon: Icon, color, subtext }) => (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="text-white" size={24} />
        </div>
      </div>
      <div>
        <p className="text-gray-600 text-sm mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        {subtext && <p className="text-sm text-gray-500 mt-1">{subtext}</p>}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">
            Platform overview and management
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Link
            to="/admin/users"
            className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg transition-colors flex items-center justify-between"
          >
            <div>
              <div className="font-semibold">Manage Users</div>
              <div className="text-sm opacity-90">View and manage all users</div>
            </div>
            <Users size={24} />
          </Link>
          <Link
            to="/admin/analytics"
            className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg transition-colors flex items-center justify-between"
          >
            <div>
              <div className="font-semibold">Analytics</div>
              <div className="text-sm opacity-90">View detailed analytics</div>
            </div>
            <TrendingUp size={24} />
          </Link>
          <Link
            to="/my-jobs"
            className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg transition-colors flex items-center justify-between"
          >
            <div>
              <div className="font-semibold">Browse Platform</div>
              <div className="text-sm opacity-90">View as client/freelancer</div>
            </div>
            <Briefcase size={24} />
          </Link>
        </div>

        {/* User Statistics */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">User Statistics</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Users"
              value={stats.users.total}
              icon={Users}
              color="bg-blue-600"
              subtext={`+${stats.users.newThisMonth} this month`}
            />
            <StatCard
              title="Clients"
              value={stats.users.clients}
              icon={UserCheck}
              color="bg-green-600"
            />
            <StatCard
              title="Freelancers"
              value={stats.users.freelancers}
              icon={Users}
              color="bg-purple-600"
            />
            <StatCard
              title="Suspended"
              value={stats.users.suspended}
              icon={UserX}
              color="bg-red-600"
            />
          </div>
        </div>

        {/* Job Statistics */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Job Statistics</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Jobs"
              value={stats.jobs.total}
              icon={Briefcase}
              color="bg-blue-600"
              subtext={`+${stats.jobs.newThisMonth} this month`}
            />
            <StatCard
              title="Open Jobs"
              value={stats.jobs.open}
              icon={AlertCircle}
              color="bg-green-600"
            />
            <StatCard
              title="In Progress"
              value={stats.jobs.inProgress}
              icon={TrendingUp}
              color="bg-yellow-600"
            />
            <StatCard
              title="Completed"
              value={stats.jobs.completed}
              icon={FileText}
              color="bg-purple-600"
            />
          </div>
        </div>

        {/* Application Statistics */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Application Statistics</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <StatCard
              title="Total Applications"
              value={stats.applications.total}
              icon={FileText}
              color="bg-blue-600"
            />
            <StatCard
              title="Pending"
              value={stats.applications.pending}
              icon={AlertCircle}
              color="bg-yellow-600"
            />
            <StatCard
              title="Accepted"
              value={stats.applications.accepted}
              icon={UserCheck}
              color="bg-green-600"
            />
          </div>
        </div>

        {/* Revenue (if applicable) */}
        {stats.revenue.total > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Revenue</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <StatCard
                title="Total Revenue"
                value={`KES ${stats.revenue.total.toLocaleString()}`}
                icon={DollarSign}
                color="bg-green-600"
              />
            </div>
          </div>
        )}

        {/* Platform Health */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Platform Health</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Active Users</span>
              <span className="font-semibold">
                {stats.users.total - stats.users.suspended}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Active Jobs</span>
              <span className="font-semibold">{stats.jobs.open}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Success Rate</span>
              <span className="font-semibold">
                {stats.applications.total > 0
                  ? `${Math.round((stats.applications.accepted / stats.applications.total) * 100)}%`
                  : '0%'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;