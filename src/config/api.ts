import { getAuthHeaders as getHeaders } from '../utils/apiUtils';

// Use relative path to leverage Next.js proxy (rewrites)
export const API_URL = '/api';
export const API_BASE_URL = API_URL;

export const getAuthHeaders = () => {
  return getHeaders();
};
