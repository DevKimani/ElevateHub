import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import { jobService } from '../services/jobService';
import { userService } from '../services/userService';
import { applicationService } from '../services/applicationService';
import { setAuthToken } from '../services/api';
import ApplyModal from '../components/ApplyModal';
import { Briefcase, DollarSign, Calendar, MapPin, ArrowLeft, Mail, Phone, CheckCircle } from 'lucide-react';

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getToken, isSignedIn } = useAuth();
  const { user: clerkUser } = useUser();
  const [job, setJob] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  useEffect(() => {
    fetchJobDetail();
  }, [id]);

  useEffect(() => {
    if (isSignedIn) {
      fetchCurrentUser();
    }
  }, [isSignedIn]);

  const fetchJobDetail = async () => {
    try {
      setLoading(true);
      const response = await jobService.getJobById(id);
      setJob(response.data);
    } catch (err) {
      console.error('Error fetching job:', err);
      setError('Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const token = await getToken();
      setAuthToken(token);
      const response = await userService.getCurrentUser();
      setCurrentUser(response.data);
      
      // Check if user has already applied
      if (response.data.role === 'freelancer') {
        await checkIfApplied();
      }
    } catch (err) {
      console.error('Error fetching user:', err);
    }
  };

  const checkIfApplied = async () => {
    try {
      const token = await getToken();
      setAuthToken(token);
      const response = await applicationService.getMyApplications();
      const applied = response.data.some(app => app.job._id === id);
      setHasApplied(applied);
    } catch (err) {
      console.error('Error checking applications:', err);
    }
  };

  const handleApplySuccess = () => {
    fetchJobDetail();
    setHasApplied(true);
  };

  const canApply = () => {
    if (!isSignedIn || !currentUser) return false;
    if (currentUser.role !== 'freelancer') return false;
    if (job?.status !== 'open') return false;
    if (hasApplied) return false;
    return true;
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
          <p className="text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Job not found'}</p>
          <button onClick={() => navigate('/jobs')} className="btn-primary">
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back
        </button>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Job Header */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {job.title}
                  </h1>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <span className="flex items-center">
                      <Briefcase size={16} className="mr-1" />
                      {job.category}
                    </span>
                    <span className="flex items-center">
                      <Calendar size={16} className="mr-1" />
                      Posted {formatDate(job.createdAt)}
                    </span>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  job.status === 'open' ? 'bg-green-100 text-green-800' :
                  job.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                  job.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {job.status}
                </span>
              </div>

              {/* Key Details */}
              <div className="grid md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Budget</p>
                  <p className="text-xl font-bold text-primary-600">
                    {formatBudget(job.budget)}
                  </p>
                  <p className="text-sm text-gray-600 capitalize">{job.budgetType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Deadline</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatDate(job.deadline)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {Math.ceil((new Date(job.deadline) - new Date()) / (1000 * 60 * 60 * 24))} days left
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Applications</p>
                  <p className="text-xl font-bold text-gray-900">
                    {job.applicationsCount || 0}
                  </p>
                  <p className="text-sm text-gray-600">Received</p>
                </div>
              </div>
            </div>

            {/* Job Description */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Job Description
              </h2>
              <p className="text-gray-700 whitespace-pre-line">
                {job.description}
              </p>
            </div>

            {/* Required Skills */}
            {job.skills && job.skills.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Required Skills
                </h2>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-primary-50 text-primary-700 rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Apply Card */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6 sticky top-6">
              {canApply() ? (
                <>
                  <button 
                    onClick={() => setIsApplyModalOpen(true)}
                    className="w-full btn-primary py-3 mb-4"
                  >
                    Apply Now
                  </button>
                  <button className="w-full btn-secondary py-3">
                    Save Job
                  </button>
                </>
              ) : hasApplied ? (
                <div className="text-center py-4">
                  <CheckCircle size={48} className="mx-auto text-green-600 mb-3" />
                  <p className="font-semibold text-gray-900 mb-1">Already Applied</p>
                  <p className="text-sm text-gray-600 mb-4">You've submitted your application</p>
                  <a href="/my-applications" className="w-full btn-secondary py-3 block text-center">
                    View My Applications
                  </a>
                </div>
              ) : !isSignedIn ? (
                <>
                  <a href="/sign-up" className="w-full btn-primary py-3 mb-4 block text-center">
                    Sign Up to Apply
                  </a>
                  <a href="/sign-in" className="w-full btn-secondary py-3 block text-center">
                    Sign In
                  </a>
                </>
              ) : currentUser?.role === 'client' ? (
                <div className="text-center text-gray-600">
                  <p className="mb-2">You're signed in as a client</p>
                  <p className="text-sm">Only freelancers can apply to jobs</p>
                </div>
              ) : (
                <div className="text-center text-gray-600">
                  <p>This job is no longer accepting applications</p>
                </div>
              )}
            </div>

            {/* Client Info */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                About the Client
              </h3>
              
              <div className="flex items-center mb-4">
                {job.postedBy?.profileImage && (
                  <img
                    src={job.postedBy.profileImage}
                    alt={job.postedBy.firstName}
                    className="w-16 h-16 rounded-full mr-4"
                  />
                )}
                <div>
                  <p className="font-semibold text-gray-900">
                    {job.postedBy?.firstName} {job.postedBy?.lastName}
                  </p>
                  {job.postedBy?.location && (
                    <p className="text-sm text-gray-600 flex items-center">
                      <MapPin size={14} className="mr-1" />
                      {job.postedBy.location}
                    </p>
                  )}
                </div>
              </div>

              {job.postedBy?.bio && (
                <div className="mb-4">
                  <p className="text-sm text-gray-700">
                    {job.postedBy.bio}
                  </p>
                </div>
              )}

              <div className="space-y-2 pt-4 border-t">
                {job.postedBy?.email && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail size={16} className="mr-2" />
                    <span className="break-all">{job.postedBy.email}</span>
                  </div>
                )}
                {job.postedBy?.phone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone size={16} className="mr-2" />
                    <span>{job.postedBy.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Apply Modal */}
        <ApplyModal
          job={job}
          isOpen={isApplyModalOpen}
          onClose={() => setIsApplyModalOpen(false)}
          onSuccess={handleApplySuccess}
        />
      </div>
    </div>
  );
}