

// Headers for public data (always use the fixed token)
export const getPublicHeaders = () => {
  const token = '3231232141346';
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

export const getAuthHeaders = () => {
  const token = localStorage.getItem('token') || '3231232141346';

  const headers: any = {
    'Content-Type': 'application/json',
  };
  headers.Authorization = `Bearer ${token}`;
  return headers;
};

export const getAuthHeadersFormData = () => {
  const token = localStorage.getItem('token') || '3231232141346';

  const headers: any = {};
  headers.Authorization = `Bearer ${token}`;
  return headers;
};
