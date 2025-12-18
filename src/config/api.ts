import { getAuthHeaders as getHeaders } from '../utils/apiUtils';

// Use remote URL directly as requested by user
export const API_URL = 'https://proyecto-bd-juan.onrender.com/api';
export const API_BASE_URL = API_URL;

export const getAuthHeaders = () => {
    return getHeaders();
};
