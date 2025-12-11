export const getAuthHeaders = () => {
  // Hardcoded token as requested by user to resolve 401s
  const token = '3231232141346';
  const headers: any = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const getAuthHeadersFormData = () => {
  const token = '3231232141346';
  const headers: any = {};
  if (token) {
      headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};
