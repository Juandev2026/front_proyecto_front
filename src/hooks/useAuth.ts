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
    let fechaExpiracion = localStorage.getItem('fechaExpiracion');

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

      let finalInitialRole = role;
      if (fechaExpiracion && fechaExpiracion !== '-' && role?.toUpperCase() === 'PREMIUM') {
        const expDate = new Date(fechaExpiracion);
        if (expDate < new Date()) {
          finalInitialRole = 'Client';
        }
      }

      const initialUser = {
        name: fullName || 'Usuario',
        id: !isNaN(parsedId!) ? parsedId : undefined,
        nivelId: !isNaN(parsedNivelId!) ? parsedNivelId : undefined,
        role: finalInitialRole || undefined,
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
          
          // Full sync from backend status
          if (status) {
            // Update localStorage
            if (status.role) localStorage.setItem('role', status.role);
            if (status.fullName) localStorage.setItem('fullName', status.fullName);
            if (status.nivelId) localStorage.setItem('nivelId', String(status.nivelId));
            if (status.accesoNombres) localStorage.setItem('accesoNombres', JSON.stringify(status.accesoNombres));
            if (status.accesoIds) localStorage.setItem('accesoIds', JSON.stringify(status.accesoIds));
            if (status.especialidad) localStorage.setItem('especialidad', status.especialidad);
            if (status.especialidadId) localStorage.setItem('especialidadId', String(status.especialidadId));
            if (status.fechaExpiracion) localStorage.setItem('fechaExpiracion', status.fechaExpiracion);

            // Role override logic: if expired, force Client in frontend
            let currentRole = status.role || role;
            if (status.fechaExpiracion && status.fechaExpiracion !== '-' && currentRole?.toUpperCase() === 'PREMIUM') {
              const expDate = new Date(status.fechaExpiracion);
              if (expDate < new Date()) {
                currentRole = 'Client';
              }
            }

            // Update state
            setUser({
              name: status.fullName || fullName || 'Usuario',
              id: status.id || parsedId,
              nivelId: status.nivelId || parsedNivelId,
              role: currentRole || undefined,
              accesoNombres: status.accesoNombres || accesoNombres,
              accesoIds: status.accesoIds || accesoIds,
              especialidad: status.especialidad || especialidad || undefined,
              especialidadId: status.especialidadId || parsedEspecialidadId,
            });
          }
        } catch (error) {
          // If status fails, token might be invalid/expired
          console.error("Session verification failed", error);
          // Optional: clear session if 401/403
          // localStorage.clear();
          // setIsAuthenticated(false);
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
