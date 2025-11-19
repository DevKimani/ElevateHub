import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { applicationService } from '../services/applicationService';
import { setAuthToken } from '../services/api';
import { Briefcase, Calendar, DollarSign, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function MyApplications() {
  const { getToken } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const isMountedRef = useRef(true);

  // Single fetchApplications declaration with useCallback
  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      setAuthToken(token);

      const response = await applicationService.getMyApplications();
      if (!isMountedRef.current) return;
      setApplications(response.data);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [getToken]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'rejected':
        return <XCircle className="text-red-500" size={20} />;
      default:
        return <Clock className="text-yellow-500" size={20} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Applications</h1>
          <p className="text-gray-600">Track the status of your job applications</p>
        </div>

        {/* Stats Summary */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Applications</p>
                <p className="text-3xl font-bold text-gray-900">{applications.length}</p>
              </div>
              <Briefcase size={40} className="text-primary-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {applications.filter(a => a.status === 'pending').length}
                </p>
              </div>
              <Clock size={40} className="text-yellow-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Accepted</p>
                <p className="text-3xl font-bold text-green-600">
                  {applications.filter(a => a.status === 'accepted').length}
                </p>
              </div>
              <CheckCircle size={40} className="text-green-600" />
            </div>
          </div>
        </div>

        {/* Applications List */}
        {applications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No applications yet
            </h3>
            <p className="text-gray-600 mb-6">
              Start applying to jobs to see your applications here
            </p>
            <Link
              to="/jobs"
              className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Browse Jobs
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {applications.map((application) => {
              // Skip if application or job is missing
              if (!application || !application.job) {
                return null;
              }
              
              return (
              <div
                key={application._id}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <Link
                        to={`/jobs/${application.job._id}`}
                        className="text-2xl font-bold text-gray-900 hover:text-primary-600 transition-colors"
                      >
                        {application.job.title}
                      </Link>
                      <p className="text-gray-600 mt-1">
                        Posted by: {application.job.postedBy?.firstName} {application.job.postedBy?.lastName}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(application.status)}
                      <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(application.status)}`}>
                        {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  {/* Job Details */}
                  <div className="grid md:grid-cols-3 gap-4 mb-4 bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <DollarSign size={18} className="text-gray-600" />
                      <div>
                        <p className="text-xs text-gray-600">Job Budget</p>
                        <p className="font-semibold text-gray-900">{formatBudget(application.job.budget)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={18} className="text-gray-600" />
                      <div>
                        <p className="text-xs text-gray-600">Deadline</p>
                        <p className="font-semibold text-gray-900">{formatDate(application.job.deadline)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase size={18} className="text-gray-600" />
                      <div>
                        <p className="text-xs text-gray-600">Status</p>
                        <p className="font-semibold text-gray-900 capitalize">{application.job.status.replace('_', ' ')}</p>
                      </div>
                    </div>
                  </div>

                  {/* Your Proposal */}
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Your Proposal</h4>
                    <div className="grid md:grid-cols-2 gap-4 mb-3">
                      <div className="bg-primary-50 rounded-lg p-3">
                        <p className="text-sm text-gray-600 mb-1">Your Rate</p>
                        <p className="text-lg font-bold text-primary-700">{formatBudget(application.proposedRate)}</p>
                      </div>
                      <div className="bg-primary-50 rounded-lg p-3">
                        <p className="text-sm text-gray-600 mb-1">Your Timeline</p>
                        <p className="text-lg font-bold text-primary-700">{formatDate(application.proposedDeadline)}</p>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Cover Letter:</p>
                      <p className="text-gray-700 whitespace-pre-line">{application.coverLetter}</p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex justify-between items-center mt-4 pt-4 border-t">
                    <p className="text-sm text-gray-500">
                      Applied on {formatDate(application.createdAt)}
                    </p>
                    <div className="flex gap-3">
                      <Link
                        to={`/jobs/${application.job._id}`}
                        className="px-4 py-2 text-primary-600 hover:text-primary-700 font-medium transition-colors"
                      >
                        View Job
                      </Link>
                      {application.status === 'accepted' && (
                        <Link
                          to={`/messages/${application.job._id}/${application.job.client._id}`}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Message Client
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}