// client/src/pages/admin/UserManagement.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import {
  Search, Filter, UserX, UserCheck, Trash2,
  ChevronLeft, ChevronRight, Mail, MapPin, Briefcase
} from 'lucide-react';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const [filters, setFilters] = useState({
    role: 'all',
    search: '',
    isSuspended: 'all'
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1
  });

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit
      });

      if (filters.role !== 'all') params.append('role', filters.role);
      if (filters.search) params.append('search', filters.search);
      if (filters.isSuspended !== 'all') params.append('isSuspended', filters.isSuspended);

      const response = await api.get(`/admin/users?${params.toString()}`);

      setUsers(response.data.users);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.total,
        pages: response.data.pagination.pages
      }));
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async (userId) => {
    const reason = prompt('Enter suspension reason:');
    if (!reason) return;

    try {
      setActionLoading(userId);
      await api.post(`/admin/users/${userId}/suspend`, { reason });
      alert('User suspended successfully');
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to suspend user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnsuspend = async (userId) => {
    if (!confirm('Are you sure you want to unsuspend this user?')) return;

    try {
      setActionLoading(userId);
      await api.post(`/admin/users/${userId}/unsuspend`);
      alert('User unsuspended successfully');
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to unsuspend user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    try {
      setActionLoading(userId);
      await api.delete(`/admin/users/${userId}`);
      alert('User deleted successfully');
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/admin/dashboard"
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ChevronLeft size={20} className="mr-1" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            User Management
          </h1>
          <p className="text-gray-600">
            {pagination.total} total users
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search size={16} className="inline mr-1" />
                Search
              </label>
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Name or email..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Role Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter size={16} className="inline mr-1" />
                Role
              </label>
              <select
                name="role"
                value={filters.role}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Roles</option>
                <option value="client">Client</option>
                <option value="freelancer">Freelancer</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {/* Suspension Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                name="isSuspended"
                value={filters.isSuspended}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Users</option>
                <option value="false">Active</option>
                <option value="true">Suspended</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stats
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {user.profileImage ? (
                          <img
                            src={user.profileImage}
                            alt={user.firstName}
                            className="w-10 h-10 rounded-full mr-3"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold mr-3">
                            {user.firstName?.[0]}{user.lastName?.[0]}
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <Mail size={12} className="mr-1" />
                            {user.email}
                          </div>
                          {user.location && (
                            <div className="text-sm text-gray-500 flex items-center">
                              <MapPin size={12} className="mr-1" />
                              {user.location}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'client' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.role === 'client' && (
                        <div className="flex items-center">
                          <Briefcase size={14} className="mr-1" />
                          {user.stats.jobsPosted} jobs
                        </div>
                      )}
                      {user.role === 'freelancer' && (
                        <div className="flex items-center">
                          <Briefcase size={14} className="mr-1" />
                          {user.stats.applicationsSubmitted} apps
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.isSuspended ? (
                        <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                          Suspended
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {user.role !== 'admin' && (
                        <div className="flex justify-end gap-2">
                          {user.isSuspended ? (
                            <button
                              onClick={() => handleUnsuspend(user._id)}
                              disabled={actionLoading === user._id}
                              className="text-green-600 hover:text-green-900 disabled:opacity-50"
                              title="Unsuspend"
                            >
                              <UserCheck size={18} />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSuspend(user._id)}
                              disabled={actionLoading === user._id}
                              className="text-yellow-600 hover:text-yellow-900 disabled:opacity-50"
                              title="Suspend"
                            >
                              <UserX size={18} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(user._id)}
                            disabled={actionLoading === user._id}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="px-6 py-4 flex items-center justify-between border-t">
              <div className="text-sm text-gray-700">
                Showing page {pagination.page} of {pagination.pages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 flex items-center"
                >
                  <ChevronLeft size={18} className="mr-1" />
                  Previous
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.pages}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 flex items-center"
                >
                  Next
                  <ChevronRight size={18} className="ml-1" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserManagement;