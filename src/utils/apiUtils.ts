export const TOKEN = '3231232141346';

export const getAuthHeaders = () => {
  return {
    'Authorization': `Bearer ${TOKEN}`,
    'Content-Type': 'application/json',
  };
};

export const getAuthHeadersFormData = () => {
  return {
    'Authorization': `Bearer ${TOKEN}`,
  };
};
