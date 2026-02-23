import { useState, useEffect } from 'react';
import { authService } from '../services/authService';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{
    name: string;
    id?: number;
    nivelId?: number;
    role?: string;
    accesoNombres?: string[];
    accesoIds?: number[];
    especialidad?: string;
    especialidadId?: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    let fullName = localStorage.getItem('fullName');
    let userId = localStorage.getItem('userId');
    let nivelId = localStorage.getItem('nivelId');
    let role = localStorage.getItem('role');
    let especialidad = localStorage.getItem('especialidad');
    let especialidadId = localStorage.getItem('especialidadId');
    let accesoNombresRaw = localStorage.getItem('accesoNombres');
    let accesoIdsRaw = localStorage.getItem('accesoIds');

    // Clean up invalid strings
    if (userId === 'undefined' || userId === 'null' || userId === 'NaN') userId = null;
    if (nivelId === 'undefined' || nivelId === 'null' || nivelId === 'NaN') nivelId = null;
    if (especialidadId === 'undefined' || especialidadId === 'null' || especialidadId === 'NaN') especialidadId = null;
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
      
      // Initial user object from localStorage
      const parsedId = userId ? Number(userId) : undefined;
      const parsedNivelId = nivelId ? Number(nivelId) : undefined;
      const parsedEspecialidadId = especialidadId ? Number(especialidadId) : undefined;
      
      let accesoNombres: string[] = [];
      if (accesoNombresRaw) {
        try {
          accesoNombres = JSON.parse(accesoNombresRaw);
        } catch (e) {
          console.error("Error parsing accesoNombres from localStorage:", e);
        }
      }

      let accesoIds: number[] = [];
      if (accesoIdsRaw) {
        try {
          accesoIds = JSON.parse(accesoIdsRaw);
        } catch (e) {
          console.error("Error parsing accesoIds from localStorage:", e);
        }
      }

      const initialUser = {
        name: fullName || 'Usuario',
        id: !isNaN(parsedId!) ? parsedId : undefined,
        nivelId: !isNaN(parsedNivelId!) ? parsedNivelId : undefined,
        role: role || undefined,
        accesoNombres: accesoNombres.length > 0 ? accesoNombres : undefined,
        accesoIds: accesoIds.length > 0 ? accesoIds : undefined,
        especialidad: especialidad || undefined,
        especialidadId: !isNaN(parsedEspecialidadId!) ? parsedEspecialidadId : undefined,
      };

      setUser(initialUser);

      // Verify status with backend to check for expiration
      const verifyStatus = async () => {
        try {
          const status = await authService.checkStatus();
          // If role changed (e.g., Premium -> Client due to expiration)
          if (status.role && status.role !== role) {
            localStorage.setItem('role', status.role);
            setUser(prev => prev ? { ...prev, role: status.role } : null);
          }
        } catch (error) {
          // If status fails, maybe token is expired/invalid
          // console.error("Session verification failed", error);
        } finally {
          setLoading(false);
        }
      };

      verifyStatus();
    } else {
      setIsAuthenticated(false);
      setUser(null);
      setLoading(false);
    }
  }, []);

  return { isAuthenticated, user, loading };
};
