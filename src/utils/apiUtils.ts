export const getAuthHeaders = () => {
  let token = null;
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('token');
  }
  // Fallback to hardcoded token if no user token
  if (!token) {
    token = '3231232141346';
  }

  const headers: any = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

// Headers for public data (always use the fixed token)
export const getPublicHeaders = () => {
  const token = '3231232141346';
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

export const getAuthHeadersFormData = () => {
  let token = null;
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('token');
  }
  if (!token) {
    token = '3231232141346';
  }

  const headers: any = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};
