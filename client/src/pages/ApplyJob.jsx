// client/src/pages/ApplyJob.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import api from '../services/api';

function ApplyJob() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState([]);

  const [formData, setFormData] = useState({
    coverLetter: '',
    proposedBudget: '',
    estimatedDuration: ''
  });

  useEffect(() => {
    fetchJob();
  }, [id]);

  const fetchJob = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/jobs/${id}`);
      setJob(response.job);

      // Pre-fill proposed budget with job budget
      setFormData(prev => ({
        ...prev,
        proposedBudget: response.job.budget
      }));
    } catch (err) {
      console.error('Error fetching job:', err);
      setError(err.response?.data?.message || 'Failed to load job');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    setSubmitting(true);

    try {
      const applicationData = {
        job: id,
        coverLetter: formData.coverLetter.trim(),
        proposedBudget: Number(formData.proposedBudget),
        estimatedDuration: formData.estimatedDuration ? Number(formData.estimatedDuration) : undefined
      };

      console.log('Submitting application:', applicationData);

      const response = await api.post('/applications', applicationData);

      console.log('Application submitted:', response);

      alert('Application submitted successfully!');
      navigate('/my-applications');

    } catch (err) {
      console.error('Error submitting application:', err);

      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        setErrors([{ message: err.response?.data?.message || 'Failed to submit application' }]);
      }

      // Scroll to top to show errors
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
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
          <h3 className="text-red-800 font-semibold mb-2">Error</h3>
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
        <p className="text-gray-600">Job not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Back Button */}
      <button
        onClick={() => navigate(`/jobs/${id}`)}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Job
      </button>

      <h1 className="text-3xl font-bold mb-2">Apply for Job</h1>
      <p className="text-gray-600 mb-8">Submit your application for this opportunity</p>

      {/* Error Display */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h3 className="text-red-800 font-semibold mb-2">Please fix these errors:</h3>
          <ul className="list-disc list-inside text-red-700 space-y-1">
            {errors.map((error, index) => (
              <li key={index}>
                {error.field && <strong className="capitalize">{error.field}:</strong>} {error.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Job Summary */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Job Summary</h2>
        <div className="space-y-3">
          <div>
            <h3 className="font-medium text-gray-900">{job.title}</h3>
            <p className="text-gray-600 text-sm mt-1">{job.category}</p>
          </div>
          <div className="flex items-center justify-between pt-3 border-t">
            <div>
              <p className="text-sm text-gray-500">Budget</p>
              <p className="text-lg font-semibold text-blue-600">
                KES {job.budget?.toLocaleString()}
              </p>
            </div>
            {job.deadline && (
              <div className="text-right">
                <p className="text-sm text-gray-500">Deadline</p>
                <p className="text-gray-900">
                  {new Date(job.deadline).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Application Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-8">
        <h2 className="text-xl font-semibold mb-6">Your Application</h2>

        {/* Cover Letter */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cover Letter *
            <span className="text-gray-500 font-normal ml-2">
              ({formData.coverLetter.length}/2000 characters, minimum 100)
            </span>
          </label>
          <textarea
            name="coverLetter"
            value={formData.coverLetter}
            onChange={handleChange}
            rows={10}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.some(e => e.field === 'coverLetter') ? 'border-red-500' : 'border-gray-300'
              }`}
            placeholder="Explain why you're the best fit for this job:&#10;&#10;- Your relevant experience&#10;- How you'll approach this project&#10;- Why you're interested in this opportunity&#10;- Your availability and timeline&#10;&#10;Example: I have 5+ years of experience in web development specializing in React and Node.js. I've completed similar projects for clients in the e-commerce space..."
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Make your cover letter compelling and specific to this job (minimum 100 characters)
          </p>
        </div>

        {/* Proposed Budget */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Proposed Budget (KES) *
            <span className="text-gray-500 font-normal ml-2">
              (Client's budget: KES {job.budget?.toLocaleString()})
            </span>
          </label>
          <input
            type="number"
            name="proposedBudget"
            value={formData.proposedBudget}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.some(e => e.field === 'proposedBudget') ? 'border-red-500' : 'border-gray-300'
              }`}
            placeholder="5000"
            min="1"
            step="100"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter your proposed budget for this project
          </p>
        </div>

        {/* Estimated Duration */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Estimated Duration (Days)
          </label>
          <input
            type="number"
            name="estimatedDuration"
            value={formData.estimatedDuration}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="7"
            min="1"
          />
          <p className="text-xs text-gray-500 mt-1">
            How many days will it take to complete this project?
          </p>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-4 pt-4 border-t">
          <button
            type="submit"
            disabled={submitting}
            className={`flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors ${submitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
          >
            {submitting ? 'Submitting...' : 'Submit Application'}
          </button>

          <button
            type="button"
            onClick={() => navigate(`/jobs/${id}`)}
            className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Tips */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">💡 Tips for a Great Application</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Be specific about your relevant experience</li>
          <li>• Explain your approach to the project</li>
          <li>• Mention similar projects you've completed</li>
          <li>• Propose a realistic budget and timeline</li>
          <li>• Proofread for spelling and grammar</li>
        </ul>
      </div>
    </div>
  );
}

export default ApplyJob;