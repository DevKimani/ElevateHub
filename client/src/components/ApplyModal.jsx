import { useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { applicationService } from '../services/applicationService';
import { setAuthToken } from '../services/api';
import { useToast } from '../hooks/useToast';
import Toast from './Toast';

export default function ApplyModal({ job, isOpen, onClose, onSuccess }) {
  const { getToken } = useAuth();
  const { toast, showToast, hideToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    coverLetter: '',
    proposedRate: job?.budget || '',
    proposedDeadline: job?.deadline ? new Date(job.deadline).toISOString().split('T')[0] : '',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = await getToken();
      setAuthToken(token);

      const applicationData = {
        jobId: job._id,
        coverLetter: formData.coverLetter,
        proposedRate: parseFloat(formData.proposedRate),
        proposedDeadline: formData.proposedDeadline,
      };

      await applicationService.applyToJob(applicationData);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Application error:', err);
      setError(err.response?.data?.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
          <h2 className="text-2xl font-bold text-gray-900">Apply to Job</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Job Info */}
          <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">{job?.title}</h3>
            <p className="text-sm text-gray-600">
              Budget: KES {job?.budget?.toLocaleString()} ({job?.budgetType})
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Cover Letter */}
            <div>
              <label htmlFor="coverLetter" className="block text-sm font-medium text-gray-700 mb-2">
                Cover Letter *
              </label>
              <textarea
                id="coverLetter"
                name="coverLetter"
                rows="6"
                value={formData.coverLetter}
                onChange={handleChange}
                placeholder="Explain why you're the best fit for this job..."
                className="input"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                {formData.coverLetter.length}/1000 characters
              </p>
            </div>

            {/* Proposed Rate */}
            <div>
              <label htmlFor="proposedRate" className="block text-sm font-medium text-gray-700 mb-2">
                Your Proposed Rate (KES) *
              </label>
              <input
                type="number"
                id="proposedRate"
                name="proposedRate"
                value={formData.proposedRate}
                onChange={handleChange}
                placeholder="e.g., 45000"
                min="0"
                className="input"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Client's budget: KES {job?.budget?.toLocaleString()}
              </p>
            </div>

            {/* Proposed Deadline */}
            <div>
              <label htmlFor="proposedDeadline" className="block text-sm font-medium text-gray-700 mb-2">
                Proposed Completion Date *
              </label>
              <input
                type="date"
                id="proposedDeadline"
                name="proposedDeadline"
                value={formData.proposedDeadline}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                className="input"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Client's deadline: {new Date(job?.deadline).toLocaleDateString()}
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 btn-secondary py-3"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}