import api from './api';

export const jobService = {
  // Get all jobs with filters
  getAllJobs: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    const response = await api.get(`/jobs?${queryParams}`);
    return response.data;
  },

  // Get single job by ID
  getJobById: async (jobId) => {
    const response = await api.get(`/jobs/${jobId}`);
    return response.data;
  },

  // Create new job
  createJob: async (jobData) => {
    const response = await api.post('/jobs', jobData);
    return response.data;
  },

  // Update job
  updateJob: async (jobId, jobData) => {
    const response = await api.put(`/jobs/${jobId}`, jobData);
    return response.data;
  },

  // Delete job
  deleteJob: async (jobId) => {
    const response = await api.delete(`/jobs/${jobId}`);
    return response.data;
  },

  // Get current user's jobs
  getMyJobs: async () => {
    const response = await api.get('/jobs/user/my-jobs');
    return response.data;
  },
};