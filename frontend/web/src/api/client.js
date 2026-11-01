import axios from 'axios';

/**
 * Centralized API client for the Laravel backend.
 *
 * All requests go through this instance so the base URL, headers and error
 * shape stay consistent with the mobile client and with the conventions in
 * shared/api-contracts/README.md.
 *
 * No credentials are hardcoded here. The Sanctum bearer token will be attached
 * by a request interceptor once the auth module is implemented.
 */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

/**
 * Normalize an Axios failure into the standard API envelope shape so callers
 * can read `status`, `message` and `errors` without knowing about Axios.
 */
function normalizeApiError(error) {
  if (error.response) {
    const { status, data } = error.response;

    return {
      status,
      success: false,
      message: data?.message || 'Request failed',
      errors: data?.errors || {},
    };
  }

  return {
    status: 0,
    success: false,
    message: error.message || 'Unable to reach the server',
    errors: {},
  };
}

apiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(normalizeApiError(error)),
);

export default apiClient;
