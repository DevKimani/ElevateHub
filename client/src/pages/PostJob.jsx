```javascript
// client/src/pages/PostJob.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function PostJob() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget: '',
    category: 'Web Development',
    deadline: '',
    skills: '',
    experienceLevel: 'any'
  });

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
    setLoading(true);

    try {
      // Prepare the job data
      const jobData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        budget: Number(formData.budget),
        category: formData.category,
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : undefined,
        skills: formData.skills ? formData.skills.split(',').map(s => s.trim()).filter(s => s) : [],
        experienceLevel: formData.experienceLevel
      };

      console.log('Submitting job data:', jobData);

      const response = await api.post('/jobs', jobData);
      
      console.log('Job created successfully:', response);
      alert('Job posted successfully!');
      
      // Navigate to the created job or my jobs page
      navigate('/my-jobs');
      
    } catch (error) {
      console.error('Error creating job:', error);
      
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        setErrors([{ message: error.response?.data?.message || 'Failed to create job' }]);
      }
      
      // Scroll to top to show errors
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Post a New Job</h1>

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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Job Title *
            <span className="text-gray-500 font-normal ml-2">
              ({formData.title.length}/100 characters, minimum 10)
            </span>
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={`w - full px - 4 py - 2 border rounded - lg focus: ring - 2 focus: ring - blue - 500 focus: border - blue - 500 ${
  errors.some(e => e.field === 'title') ? 'border-red-500' : 'border-gray-300'
} `}
            placeholder="e.g., Build a responsive e-commerce website with React and Node.js"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Be specific and descriptive (minimum 10 characters)
          </p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Job Description *
            <span className="text-gray-500 font-normal ml-2">
              ({formData.description.length}/5000 characters, minimum 50)
            </span>
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={8}
            className={`w - full px - 4 py - 2 border rounded - lg focus: ring - 2 focus: ring - blue - 500 focus: border - blue - 500 ${
  errors.some(e => e.field === 'description') ? 'border-red-500' : 'border-gray-300'
} `}
            placeholder="Describe the job in detail:&#10;- What needs to be done&#10;- Required skills&#10;- Deliverables&#10;- Timeline expectations&#10;&#10;Example: I'm looking for an experienced full-stack developer to build a modern e-commerce platform. The project includes user authentication, product catalog, shopping cart, payment integration with M-Pesa, and an admin dashboard..."
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Provide detailed requirements (minimum 50 characters)
          </p>
        </div>

        {/* Budget */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Budget (KES) *
            <span className="text-gray-500 font-normal ml-2">
              (minimum KES 100)
            </span>
          </label>
          <input
            type="number"
            name="budget"
            value={formData.budget}
            onChange={handleChange}
            className={`w - full px - 4 py - 2 border rounded - lg focus: ring - 2 focus: ring - blue - 500 focus: border - blue - 500 ${
  errors.some(e => e.field === 'budget') ? 'border-red-500' : 'border-gray-300'
} `}
            placeholder="5000"
            min="100"
            step="100"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter your budget in Kenyan Shillings (KES)
          </p>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category *
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className={`w - full px - 4 py - 2 border rounded - lg focus: ring - 2 focus: ring - blue - 500 focus: border - blue - 500 ${
  errors.some(e => e.field === 'category') ? 'border-red-500' : 'border-gray-300'
} `}
            required
          >
            <option value="Web Development">Web Development</option>
            <option value="Mobile Development">Mobile Development</option>
            <option value="Design">Design</option>
            <option value="Writing">Writing</option>
            <option value="Marketing">Marketing</option>
            <option value="Data Entry">Data Entry</option>
            <option value="Virtual Assistant">Virtual Assistant</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Skills (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Required Skills (Optional)
          </label>
          <input
            type="text"
            name="skills"
            value={formData.skills}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="React, Node.js, MongoDB, Tailwind CSS (comma-separated)"
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter skills separated by commas
          </p>
        </div>

        {/* Experience Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Experience Level
          </label>
          <select
            name="experienceLevel"
            value={formData.experienceLevel}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="any">Any Level</option>
            <option value="entry">Entry Level</option>
            <option value="intermediate">Intermediate</option>
            <option value="expert">Expert</option>
          </select>
        </div>

        {/* Deadline (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Deadline (Optional)
          </label>
          <input
            type="date"
            name="deadline"
            value={formData.deadline}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            min={new Date().toISOString().split('T')[0]}
          />
          <p className="text-xs text-gray-500 mt-1">
            When do you need this completed?
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className={`flex - 1 bg - blue - 600 text - white py - 3 px - 6 rounded - lg font - medium hover: bg - blue - 700 transition - colors ${
  loading ? 'opacity-50 cursor-not-allowed' : ''
} `}
          >
            {loading ? 'Posting Job...' : 'Post Job'}
          </button>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Helper Text */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">💡 Tips for a Great Job Post</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Be specific about what you need</li>
          <li>• List required skills and technologies</li>
          <li>• Provide clear deliverables</li>
          <li>• Set a realistic budget and timeline</li>
          <li>• Include examples if possible</li>
        </ul>
      </div>
    </div>
  );
}

export default PostJob;
```