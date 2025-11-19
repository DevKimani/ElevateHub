import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { jobService } from '../services/jobService';
import { setAuthToken } from '../services/api';
import { 
  Briefcase, Calendar, DollarSign, Users, Eye, Edit, Trash2, 
  Plus, Clock, CheckCircle, XCircle, AlertCircle 
} from 'lucide-react';

export default function MyJobs() {
  const { getToken } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const isMountedRef = useRef(true);

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      setAuthToken(token);

      const response = await jobService.getMyJobs();
      if (!isMountedRef.current) return;
      setJobs(response.data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [getToken]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleDelete = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleteLoading(jobId);
      const token = await getToken();
      setAuthToken(token);

      await jobService.deleteJob(jobId);
      setJobs(prev => prev.filter(job => job._id !== jobId));
      alert('Job deleted successfully');
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
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open':
        return <Clock className="text-green-600" size={16} />;
      case 'in_progress':
        return <Briefcase className="text-blue-600" size={16} />;
      case 'completed':
        return <CheckCircle className="text-gray-600" size={16} />;
      case 'cancelled':
        return <XCircle className="text-red-600" size={16} />;
      default:
        return <AlertCircle className="text-gray-600" size={16} />;
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'in_escrow':
        return 'bg-yellow-100 text-yellow-800';
      case 'released':
        return 'bg-green-100 text-green-800';
      case 'refunded':
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">My Jobs</h1>
            <p className="text-gray-600">Manage your posted jobs and applications</p>
          </div>
          <Link
            to="/post-job"
            className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus size={20} />
            Post New Job
          </Link>
        </div>

        {/* Stats Summary */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Jobs</p>
                <p className="text-3xl font-bold text-gray-900">{jobs.length}</p>
              </div>
              <Briefcase size={40} className="text-primary-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Open</p>
                <p className="text-3xl font-bold text-green-600">
                  {jobs.filter(j => j.status === 'open').length}
                </p>
              </div>
              <Clock size={40} className="text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">In Progress</p>
                <p className="text-3xl font-bold text-blue-600">
                  {jobs.filter(j => j.status === 'in_progress').length}
                </p>
              </div>
              <Briefcase size={40} className="text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Applications</p>
                <p className="text-3xl font-bold text-primary-600">
                  {jobs.reduce((sum, job) => sum + (job.applicationsCount || 0), 0)}
                </p>
              </div>
              <Users size={40} className="text-primary-600" />
            </div>
          </div>
        </div>

        {/* Jobs List */}
        {jobs.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <Briefcase size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No jobs posted yet
            </h3>
            <p className="text-gray-600 mb-6">
              Post your first job to start finding talented freelancers
            </p>
            <Link
              to="/post-job"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus size={20} />
              Post Your First Job
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {jobs.map((job) => (
              <div
                key={job._id}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <Link
                        to={`/jobs/${job._id}`}
                        className="text-2xl font-bold text-gray-900 hover:text-primary-600 transition-colors"
                      >
                        {job.title}
                      </Link>
                      <p className="text-gray-600 mt-1 line-clamp-2">{job.description}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {getStatusIcon(job.status)}
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(job.status)}`}>
                        {job.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Job Details */}
                  <div className="grid md:grid-cols-4 gap-4 mb-4 bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <DollarSign size={18} className="text-gray-600" />
                      <div>
                        <p className="text-xs text-gray-600">Budget</p>
                        <p className="font-semibold text-gray-900">{formatBudget(job.budget)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={18} className="text-gray-600" />
                      <div>
                        <p className="text-xs text-gray-600">Deadline</p>
                        <p className="font-semibold text-gray-900">{formatDate(job.deadline)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={18} className="text-gray-600" />
                      <div>
                        <p className="text-xs text-gray-600">Applications</p>
                        <p className="font-semibold text-gray-900">{job.applicationsCount || 0}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign size={18} className="text-gray-600" />
                      <div>
                        <p className="text-xs text-gray-600">Payment</p>
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getPaymentStatusColor(job.paymentStatus)}`}>
                          {job.paymentStatus || 'Unpaid'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Skills */}
                  {job.skills && job.skills.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {job.skills.slice(0, 5).map((skill, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm"
                          >
                            {skill}
                          </span>
                        ))}
                        {job.skills.length > 5 && (
                          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                            +{job.skills.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Accepted Freelancer */}
                  {job.acceptedFreelancer && (
                    <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm text-green-800">
                        <strong>Hired:</strong> {job.acceptedFreelancer.firstName} {job.acceptedFreelancer.lastName}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3 pt-4 border-t">
                    <p className="text-sm text-gray-500 flex-1">
                      Posted on {formatDate(job.createdAt)}
                    </p>
                    
                    {/* View Applications Button - Key Action! */}
                    <Link
                      to={`/jobs/${job._id}/applications`}
                      className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      <Users size={18} />
                      View Applications ({job.applicationsCount || 0})
                    </Link>
                    
                    <Link
                      to={`/jobs/${job._id}`}
                      className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Eye size={18} />
                      View
                    </Link>
                    
                    {job.status === 'open' && (
                      <>
                        <Link
                          to={`/jobs/${job._id}/edit`}
                          className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          <Edit size={18} />
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(job._id)}
                          disabled={deleteLoading === job._id}
                          className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 border border-red-300 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          <Trash2 size={18} />
                          {deleteLoading === job._id ? 'Deleting...' : 'Delete'}
                        </button>
                      </>
                    )}

                    {/* Message Freelancer */}
                    {job.status === 'in_progress' && job.acceptedFreelancer && (
                      <Link
                        to={`/messages/${job._id}/${job.acceptedFreelancer._id}`}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        💬 Message
                      </Link>
                    )}
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