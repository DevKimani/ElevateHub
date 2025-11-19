import api from './api';

export const transactionService = {
  // Create escrow
  createEscrow: (data) => api.post('/transactions/escrow', data),

  // Get user's transactions
  getMyTransactions: () => api.get('/transactions/my-transactions'),

  // Get transaction by ID
  getTransaction: (id) => api.get(`/transactions/${id}`),

  // Get job transaction
  getJobTransaction: (jobId) => api.get(`/transactions/job/${jobId}`),

  // Release escrow to freelancer
  releaseEscrow: (id, note) => api.post(`/transactions/${id}/release`, { note }),

  // Request refund
  requestRefund: (id, reason) => api.post(`/transactions/${id}/refund`, { reason }),
};