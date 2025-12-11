import { useState, useEffect } from 'react';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ name: string; id?: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    let fullName = localStorage.getItem('fullName');
    let userId = localStorage.getItem('userId');
    if (userId === 'undefined' || userId === 'null' || userId === 'NaN') {
        userId = null;
    }

    if (token) {
      if (!fullName || !userId) {
        try {
          const tokenParts = token.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1] as string));
            
            // Extract Full Name
            if (!fullName) {
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

            // Extract User ID
            if (!userId) {
               // Check common claim names for ID
               const extractedId = 
                 payload.id || 
                 payload.Id || 
                 payload.sub || 
                 payload.nameid ||
                 payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];

               if (extractedId) {
                 userId = String(extractedId);
                 localStorage.setItem('userId', userId);
               }
            }
          }
        } catch (e) {
          console.error('Error decoding token:', e);
        }
      }
      
      setIsAuthenticated(true);
      if (fullName) {
        const parsedId = userId ? Number(userId) : undefined;
        setUser({ name: fullName, id: !isNaN(parsedId!) ? parsedId : undefined });
      } else {
        setUser(null); // If token exists but no fullName, user is not fully identified
      }
    } else {
      setIsAuthenticated(false);
      setUser(null);
    }
    setLoading(false);
  }, []);

  return { isAuthenticated, user, loading };
};

