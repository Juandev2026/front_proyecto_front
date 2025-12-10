import { useState, useEffect } from 'react';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    let fullName = localStorage.getItem('fullName');

    if (token && !fullName) {
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1] as string));
          // Check for common name claims
          fullName =
            payload.FullName ||
            payload.fullName ||
            payload.name ||
            payload[
              'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'
            ];

          if (fullName) {
            localStorage.setItem('fullName', fullName);
          }
        }
      } catch (e) {
        console.error('Error decoding token:', e);
      }
    }

    setIsAuthenticated(!!token);
    if (token && fullName) {
      setUser({ name: fullName });
    }
    setLoading(false);
  }, []);

  return { isAuthenticated, user, loading };
};
