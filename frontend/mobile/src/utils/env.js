const FALLBACK_API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

/**
 * API base URL for the Laravel backend.
 *
 * Configured through EXPO_PUBLIC_API_BASE_URL. When testing on a physical
 * device, replace the host with the LAN IP of the machine running Laravel —
 * `localhost` resolves to the device itself, not to your computer.
 */
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || FALLBACK_API_BASE_URL;

export const IS_PLACEHOLDER_API_URL = API_BASE_URL === FALLBACK_API_BASE_URL;
