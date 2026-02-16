import { useState, useEffect } from 'react';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{
    name: string;
    id?: number;
    nivelId?: number;
    role?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    let fullName = localStorage.getItem('fullName');
    let userId = localStorage.getItem('userId');
    let nivelId = localStorage.getItem('nivelId');
    let role = localStorage.getItem('role');

    // Clean up invalid strings
    if (userId === 'undefined' || userId === 'null' || userId === 'NaN') userId = null;
    if (nivelId === 'undefined' || nivelId === 'null' || nivelId === 'NaN') nivelId = null;
    if (role === 'undefined' || role === 'null') role = null;

    if (token) {
      // Decode token if ANY info is missing to ensure we have checking
      if (!fullName || !userId || !role) {
        try {
          const parts = token.split('.');
          if (parts.length === 3 && parts[1]) {
            const payload = JSON.parse(atob(parts[1]));

            // Full Name
            if (!fullName) {
              fullName = payload.FullName || payload.fullName || payload.name || payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'];
              if (fullName) localStorage.setItem('fullName', fullName);
            }

            // User ID
            if (!userId) {
              const extractedId = payload.id || payload.Id || payload.sub || payload.nameid || payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
              if (extractedId) {
                userId = String(extractedId);
                localStorage.setItem('userId', userId);
              }
            }

            // Role - Enhanced Extraction
            if (!role) {
              role = payload.role || payload.Role || payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role'];
              if (role) localStorage.setItem('role', role);
            }
          }
        } catch (e) {
          console.error('Error decoding token in useAuth:', e);
        }
      }

      setIsAuthenticated(true);
      
      // Always set user object if we have at least partial info
      const parsedId = userId ? Number(userId) : undefined;
      const parsedNivelId = nivelId ? Number(nivelId) : undefined;
      
      setUser({
        name: fullName || 'Usuario', // Fallback to avoid null
        id: !isNaN(parsedId!) ? parsedId : undefined,
        nivelId: !isNaN(parsedNivelId!) ? parsedNivelId : undefined,
        role: role || undefined,
      });
    } else {
      setIsAuthenticated(false);
      setUser(null);
    }
    setLoading(false);
  }, []);

  return { isAuthenticated, user, loading };
};
