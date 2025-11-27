// client/src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000 // 30 seconds
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      // IMPORTANT: Always get a fresh token from Clerk
      // skipCache: true forces Clerk to check if token needs refresh
      const token = await window.Clerk?.session?.getToken({ skipCache: true });
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      return config;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return config;
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors (expired or invalid tokens)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const errorCode = error.response?.data?.code;
      
      // If token expired, try to refresh
      if (errorCode === 'TOKEN_EXPIRED') {
        console.log('Token expired, refreshing...');
        
        try {
          // Force token refresh from Clerk
          const newToken = await window.Clerk?.session?.getToken({ 
            skipCache: true,
            template: '' // Use default template
          });
          
          if (newToken) {
            console.log('Token refreshed successfully');
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          } else {
            console.error('No token returned from Clerk');
            window.location.href = '/sign-in';
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          // Redirect to sign in
          window.location.href = '/sign-in';
          return Promise.reject(refreshError);
        }
      } else {
        // Invalid token (not expired, but invalid)
        console.error('Invalid token, redirecting to sign in');
        window.location.href = '/sign-in';
      }
    }

    // Handle 403 errors (forbidden/wrong role)
    if (error.response?.status === 403) {
      console.error('Access forbidden:', error.response?.data?.message);
      // Optionally redirect or show error
    }

    // Handle 429 errors (rate limited)
    if (error.response?.status === 429) {
      console.error('Rate limited. Please try again later.');
    }

    // Handle network errors
    if (!error.response) {
      console.error('Network error. Please check your connection.');
    }

    return Promise.reject(error);
  }
);

// Helper function to handle API errors
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error
    return {
      message: error.response.data?.message || 'An error occurred',
      errors: error.response.data?.errors || [],
      status: error.response.status
    };
  } else if (error.request) {
    // Request made but no response
    return {
      message: 'No response from server. Please check your connection.',
      status: 0
    };
  } else {
    // Error in request setup
    return {
      message: error.message || 'An unexpected error occurred',
      status: 0
    };
  }
};

// BACKWARD COMPATIBILITY: Export setAuthToken for legacy code
// This function is deprecated and does nothing - tokens are now handled automatically
export const setAuthToken = () => {
  console.warn('⚠️ setAuthToken() is deprecated. Tokens are now handled automatically by interceptors.');
  // Do nothing - interceptors handle tokens automatically
};

export default api;