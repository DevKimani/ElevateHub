import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { userService } from '../services/userService';
import { setAuthToken } from '../services/api';

export default function CompleteProfile() {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    role: 'freelancer',
    bio: '',
    skills: '',
    hourlyRate: '',
    location: '',
    phone: '',
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
      // Get session token from Clerk
      const token = await getToken();
      setAuthToken(token);

      // Prepare data based on role
      const profileData = {
        role: formData.role,
        bio: formData.bio,
        location: formData.location,
        phone: formData.phone,
      };

      // Add freelancer-specific fields
      if (formData.role === 'freelancer') {
        profileData.skills = formData.skills
          .split(',')
          .map(skill => skill.trim())
          .filter(skill => skill !== '');
        profileData.hourlyRate = parseFloat(formData.hourlyRate) || 0;
      }

      // Update profile
      await userService.updateProfile(profileData);

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error('Profile completion error:', err);
      setError(err.response?.data?.message || 'Failed to complete profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Complete Your Profile
            </h1>
            <p className="text-gray-600">
              Tell us a bit about yourself to get started on ElevateHub
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                I want to *
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'freelancer' })}
                  className={`p-4 border-2 rounded-lg text-center transition-all ${
                    formData.role === 'freelancer'
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="text-2xl mb-2">💼</div>
                  <div className="font-semibold">Find Work</div>
                  <div className="text-sm text-gray-600">I'm a Freelancer</div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'client' })}
                  className={`p-4 border-2 rounded-lg text-center transition-all ${
                    formData.role === 'client'
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="text-2xl mb-2">👥</div>
                  <div className="font-semibold">Hire Talent</div>
                  <div className="text-sm text-gray-600">I'm a Client</div>
                </button>
              </div>
            </div>

            {/* Bio */}
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                rows="4"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Tell us about yourself..."
                className="input"
              />
            </div>

            {/* Freelancer-specific fields */}
            {formData.role === 'freelancer' && (
              <>
                <div>
                  <label htmlFor="skills" className="block text-sm font-medium text-gray-700 mb-2">
                    Skills (comma-separated) *
                  </label>
                  <input
                    type="text"
                    id="skills"
                    name="skills"
                    value={formData.skills}
                    onChange={handleChange}
                    placeholder="e.g., React, Node.js, UI/UX Design"
                    className="input"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Separate skills with commas
                  </p>
                </div>

                <div>
                  <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-700 mb-2">
                    Hourly Rate (KES) *
                  </label>
                  <input
                    type="number"
                    id="hourlyRate"
                    name="hourlyRate"
                    value={formData.hourlyRate}
                    onChange={handleChange}
                    placeholder="e.g., 1500"
                    min="0"
                    className="input"
                    required
                  />
                </div>
              </>
            )}

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., Nairobi, Kenya"
                className="input"
              />
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="e.g., +254 700 000 000"
                className="input"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Complete Profile'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}