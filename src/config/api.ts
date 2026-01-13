import { getAuthHeaders as getHeaders } from '../utils/apiUtils';

// Use relative path to leverage Next.js proxy (rewrites)
const PROD_API_URL = 'https://proyecto-bd-juan.onrender.com/api';

export const API_URL = typeof window === 'undefined' ? PROD_API_URL : '/api';
export const API_BASE_URL = API_URL;

export const getAuthHeaders = () => {
  return getHeaders();
};
