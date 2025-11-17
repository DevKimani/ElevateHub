import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { jobService } from '../services/jobService';
import { setAuthToken } from '../services/api';
import { Briefcase, DollarSign, Calendar, Plus, Edit, Trash2 } from 'lucide-react';

export default function MyJobs() {
  const { getToken } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(null);

  useEffect(() => {
    fetchMyJobs();
  }, []);

  const fetchMyJobs = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      setAuthToken(token);

      const response = await jobService.getMyJobs();
      setJobs(response.data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (jobId) => {
    if (!confirm('Are you sure you want to delete this job?')) {
      return;
    }

    try {
      setDeleteLoading(jobId);
      const token = await getToken();
      setAuthToken(token);

      await jobService.deleteJob(jobId);
      setJobs(jobs.filter(job => job._id !== jobId));
    } catch (error) {
      console.error('Error deleting job:', error);
      alert('Failed to delete job');
    } finally {
      setDeleteLoading(null);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatBudget = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'closed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              My Posted Jobs
            </h1>
            <p className="text-gray-600">
              Manage your job postings ({jobs.length} total)
            </p>
          </div>
          <Link to="/post-job" className="btn-primary flex items-center">
            <Plus size={20} className="mr-2" />
            Post New Job
          </Link>
        </div>

        {/* Jobs List */}
        {jobs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Briefcase size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No jobs posted yet
            </h3>
            <p className="text-gray-600 mb-4">
              Start by posting your first job to find talented freelancers
            </p>
            <Link to="/post-job" className="btn-primary inline-flex items-center">
              <Plus size={20} className="mr-2" />
              Post Your First Job
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div
                key={job._id}
                className="bg-white rounded-lg shadow-md p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <Link
                      to={`/jobs/${job._id}`}
                      className="text-xl font-bold text-gray-900 hover:text-primary-600 mb-2 block"
                    >
                      {job.title}
                    </Link>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        <Briefcase size={16} className="mr-1" />
                        {job.category}
                      </span>
                      <span className="flex items-center">
                        <DollarSign size={16} className="mr-1" />
                        {formatBudget(job.budget)} ({job.budgetType})
                      </span>
                      <span className="flex items-center">
                        <Calendar size={16} className="mr-1" />
                        Due: {formatDate(job.deadline)}
                      </span>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(job.status)}`}>
                    {job.status}
                  </span>
                </div>

                <p className="text-gray-700 mb-4 line-clamp-2">
                  {job.description}
                </p>

                {job.skills && job.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {job.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-4">
                    <Link 
                      to={`/jobs/${job._id}/applications`}
                      className="flex items-center gap-2 px-4 py-2 bg-primary-50 hover:bg-primary-100 text-primary-700 rounded-lg transition-colors"
                    >
                      <div className="text-center">
                        <p className="text-2xl font-bold">
                          {job.applicationsCount || 0}
                        </p>
                        <p className="text-xs">Applications</p>
                      </div>
                    </Link>
                    <div className="text-sm text-gray-600">
                      <p>Posted {formatDate(job.createdAt)}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Click applications to view
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      to={`/jobs/${job._id}/applications`}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center"
                    >
                      View Applications
                    </Link>
                    <button
                      onClick={() => alert('Edit functionality coming soon!')}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center"
                    >
                      <Edit size={16} className="mr-2" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(job._id)}
                      disabled={deleteLoading === job._id}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center disabled:opacity-50"
                    >
                      <Trash2 size={16} className="mr-2" />
                      {deleteLoading === job._id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}