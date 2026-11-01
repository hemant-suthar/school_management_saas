import axios from 'axios';

import { API_BASE_URL } from '../utils/env';

/**
 * Centralized API client.
 *
 * Every network call in the mobile app goes through this instance so that the
 * base URL, headers and error shape stay consistent with the web client and
 * with the conventions documented in shared/api-contracts/README.md.
 *
 * No credentials are hardcoded here. The authentication token will be attached
 * by an interceptor once the auth module is implemented.
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

/**
 * Convert an Axios failure into the standard API envelope shape.
 *
 * Keeps `status`, `message` and `errors` so screens can render field-level
 * validation messages without knowing anything about Axios.
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
