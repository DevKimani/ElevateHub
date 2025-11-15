import api from './api';

export const applicationService = {
  // Create application (Apply to job)
  applyToJob: async (applicationData) => {
    const response = await api.post('/applications', applicationData);
    return response.data;
  },

  // Get freelancer's applications
  getMyApplications: async () => {
    const response = await api.get('/applications/my-applications');
    return response.data;
  },

  // Get applications for a job (job owner only)
  getJobApplications: async (jobId) => {
    const response = await api.get(`/applications/job/${jobId}`);
    return response.data;
  },

  // Update application status (Accept/Reject)
  updateApplicationStatus: async (applicationId, status) => {
    const response = await api.put(`/applications/${applicationId}/status`, { status });
    return response.data;
  },

  // Get single application by ID
  getApplicationById: async (applicationId) => {
    const response = await api.get(`/applications/${applicationId}`);
    return response.data;
  },
};