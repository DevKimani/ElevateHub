import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { applicationService } from '../services/applicationService';
import { jobService } from '../services/jobService';
import { transactionService } from '../services/transactionService';
import { setAuthToken } from '../services/api';
import {
  ArrowLeft, User, Mail, MapPin, DollarSign, Calendar,
  CheckCircle, XCircle, MessageCircle, Wallet, X, Loader2
} from 'lucide-react';

export default function JobApplications() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const isMountedRef = useRef(true);

  // Escrow Modal State
  const [showEscrowModal, setShowEscrowModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [escrowLoading, setEscrowLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      setAuthToken(token);

      const jobResponse = await jobService.getJobById(jobId);
      if (!isMountedRef.current) return;
      setJob(jobResponse.job);

      const appsResponse = await applicationService.getJobApplications(jobId);
      if (!isMountedRef.current) return;
      setApplications(appsResponse.applications || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [getToken, jobId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleStatusUpdate = async (applicationId, status) => {
    const action = status === 'accepted' ? 'accept' : 'reject';
    if (!window.confirm(`Are you sure you want to ${action} this application?`)) {
      return;
    }

    try {
      setActionLoading(applicationId);
      const token = await getToken();
      setAuthToken(token);

      await applicationService.updateApplicationStatus(applicationId, status);

      // If accepted, show escrow modal
      if (status === 'accepted') {
        const acceptedApp = applications.find(app => app._id === applicationId);
        setSelectedApplication(acceptedApp);
        setShowEscrowModal(true);
      }

      await fetchData();

      if (status === 'rejected') {
        alert('Application rejected');
      }
    } catch (error) {
      console.error('Error updating application:', error);
      alert(`Failed to ${action} application`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateEscrow = async () => {
    if (!selectedApplication) return;

    try {
      setEscrowLoading(true);
      const token = await getToken();
      setAuthToken(token);

      await transactionService.createEscrow({
        jobId,
        applicationId: selectedApplication._id,
        amount: selectedApplication.proposedRate,
      });

      alert('Escrow created successfully! Funds are now held securely.');
      setShowEscrowModal(false);
      setSelectedApplication(null);
      await fetchData();
    } catch (error) {
      console.error('Error creating escrow:', error);
      alert(error.response?.data?.message || 'Failed to create escrow');
    } finally {
      setEscrowLoading(false);
    }
  };

  const handleSkipEscrow = () => {
    setShowEscrowModal(false);
    setSelectedApplication(null);
    alert('Application accepted! You can create escrow later from the job details page.');
  };

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back
        </button>

        {/* Job Info Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Applications for: {job?.title}
              </h1>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <span>Budget: {formatBudget(job?.budget)}</span>
                <span>•</span>
                <span>Deadline: {formatDate(job?.deadline)}</span>
                <span>•</span>
                <span className={`font-medium ${job?.status === 'open' ? 'text-green-600' :
                    job?.status === 'in_progress' ? 'text-blue-600' :
                      'text-gray-600'
                  }`}>
                  Status: {job?.status?.replace('_', ' ')}
                </span>
                {job?.paymentStatus && job.paymentStatus !== 'unpaid' && (
                  <>
                    <span>•</span>
                    <span className="text-green-600 font-medium">
                      💰 {job.paymentStatus.replace('_', ' ')}
                    </span>
                  </>
                )}
              </div>
            </div>
            <span className="text-3xl font-bold text-primary-600">
              {applications.length}
            </span>
          </div>
        </div>

        {/* Applications */}
        {applications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <User size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No applications yet
            </h3>
            <p className="text-gray-600">
              Applications will appear here once freelancers apply to your job
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {applications.map((application) => (
              <div
                key={application._id}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100"
              >
                {/* Freelancer Header */}
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-start">
                    {application.freelancer?.profileImage ? (
                      <img
                        src={application.freelancer.profileImage}
                        alt={application.freelancer.firstName}
                        className="w-16 h-16 rounded-full mr-4 object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-xl mr-4">
                        {application.freelancer?.firstName?.[0]}{application.freelancer?.lastName?.[0]}
                      </div>
                    )}
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {application.freelancer?.firstName} {application.freelancer?.lastName}
                      </h3>
                      <div className="flex flex-wrap gap-3 text-sm text-gray-600 mt-1">
                        {application.freelancer?.email && (
                          <span className="flex items-center">
                            <Mail size={14} className="mr-1" />
                            {application.freelancer.email}
                          </span>
                        )}
                        {application.freelancer?.location && (
                          <span className="flex items-center">
                            <MapPin size={14} className="mr-1" />
                            {application.freelancer.location}
                          </span>
                        )}
                      </div>
                      {application.freelancer?.hourlyRate && (
                        <p className="text-sm text-primary-600 font-medium mt-1">
                          Hourly Rate: {formatBudget(application.freelancer.hourlyRate)}/hr
                        </p>
                      )}
                    </div>
                  </div>
                  <span className={`px-4 py-2 rounded-full text-sm font-semibold ${application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      application.status === 'accepted' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                    }`}>
                    {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                  </span>
                </div>

                {/* Skills */}
                {application.freelancer?.skills && application.freelancer.skills.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Skills:</p>
                    <div className="flex flex-wrap gap-2">
                      {application.freelancer.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Proposal Details */}
                <div className="grid md:grid-cols-2 gap-4 mb-4 bg-gray-50 rounded-lg p-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Proposed Rate</p>
                    <p className="text-lg font-bold text-gray-900 flex items-center">
                      <DollarSign size={18} className="mr-1" />
                      {formatBudget(application.proposedRate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Proposed Completion</p>
                    <p className="text-lg font-bold text-gray-900 flex items-center">
                      <Calendar size={18} className="mr-1" />
                      {formatDate(application.proposedDeadline)}
                    </p>
                  </div>
                </div>

                {/* Cover Letter */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Cover Letter:</p>
                  <p className="text-gray-700 whitespace-pre-line bg-gray-50 p-4 rounded-lg">
                    {application.coverLetter}
                  </p>
                </div>

                {/* Bio */}
                {application.freelancer?.bio && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">About:</p>
                    <p className="text-gray-600">{application.freelancer.bio}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-3 pt-4 border-t">
                  <p className="text-sm text-gray-500 flex-1">
                    Applied on {formatDate(application.createdAt)}
                  </p>

                  {application.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleStatusUpdate(application._id, 'accepted')}
                        disabled={actionLoading === application._id}
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        <CheckCircle size={18} className="mr-2" />
                        {actionLoading === application._id ? 'Processing...' : 'Accept'}
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(application._id, 'rejected')}
                        disabled={actionLoading === application._id}
                        className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        <XCircle size={18} className="mr-2" />
                        {actionLoading === application._id ? 'Processing...' : 'Reject'}
                      </button>
                    </>
                  )}

                  {application.status === 'accepted' && (
                    <button
                      onClick={() => navigate(`/messages/${jobId}/${application.freelancer._id}`)}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <MessageCircle size={18} className="mr-2" />
                      Message Freelancer
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Escrow Modal */}
      {showEscrowModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 text-white">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Wallet size={24} />
                  Create Escrow
                </h2>
                <button
                  onClick={handleSkipEscrow}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="text-center mb-6">
                <CheckCircle size={48} className="mx-auto text-green-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Application Accepted!
                </h3>
                <p className="text-gray-600">
                  Would you like to deposit funds in escrow to start the project?
                </p>
              </div>

              {/* Escrow Details */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Freelancer:</span>
                  <span className="font-semibold">
                    {selectedApplication.freelancer?.firstName} {selectedApplication.freelancer?.lastName}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Agreed Rate:</span>
                  <span className="font-semibold text-lg text-green-600">
                    {formatBudget(selectedApplication.proposedRate)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Timeline:</span>
                  <span className="font-semibold">
                    {formatDate(selectedApplication.proposedDeadline)}
                  </span>
                </div>
              </div>

              <p className="text-sm text-gray-500 mb-6 text-center">
                Funds will be held securely until you release them upon job completion.
              </p>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleSkipEscrow}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Later
                </button>
                <button
                  onClick={handleCreateEscrow}
                  disabled={escrowLoading}
                  className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {escrowLoading ? (
                    <>
                      <Loader2 size={20} className="animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Wallet size={20} className="mr-2" />
                      Create Escrow
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}