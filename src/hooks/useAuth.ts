import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { authService, ExamenLogin } from '../services/authService';

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
  const [loginExamenes, setLoginExamenes] = useState<ExamenLogin[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const logout = useCallback(() => {
    const authKeys = [
      'token',
      'fullName',
      'userId',
      'nivelId',
      'role',
      'accesoNombres',
      'accesoIds',
      'loginExamenes',
      'especialidad',
      'especialidadId',
      'fechaExpiracion',
    ];
    authKeys.forEach((key) => localStorage.removeItem(key));
    setIsAuthenticated(false);
    setUser(null);
    setLoginExamenes([]);
    router.push('/login');
  }, [router]);

  const verifyStatus = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;

    try {
      const status = await authService.checkStatus();

      if (status) {
        if (status.role) localStorage.setItem('role', status.role);
        if (status.fullName) localStorage.setItem('fullName', status.fullName);
        if (status.nivelId) localStorage.setItem('nivelId', String(status.nivelId));
        if (status.accesoNombres) localStorage.setItem('accesoNombres', JSON.stringify(status.accesoNombres));
        if (status.accesoIds) localStorage.setItem('accesoIds', JSON.stringify(status.accesoIds));
        if (status.especialidad) localStorage.setItem('especialidad', status.especialidad);
        if (status.especialidadId) localStorage.setItem('especialidadId', String(status.especialidadId));
        if (status.fechaExpiracion) localStorage.setItem('fechaExpiracion', status.fechaExpiracion);

        const syncUser = (status as any).user || status;
        let currentRole = syncUser.role || localStorage.getItem('role');
        
        if (status.fechaExpiracion && status.fechaExpiracion !== '-' && currentRole?.toUpperCase() === 'PREMIUM') {
          const expDate = new Date(status.fechaExpiracion);
          if (expDate < new Date()) {
            currentRole = 'Client';
          }
        }

        setUser({
          name: syncUser.fullName || localStorage.getItem('fullName') || 'Usuario',
          id: syncUser.id || (localStorage.getItem('userId') ? Number(localStorage.getItem('userId')) : undefined),
          nivelId: syncUser.nivelId || (localStorage.getItem('nivelId') ? Number(localStorage.getItem('nivelId')) : undefined),
          role: currentRole || undefined,
          accesoNombres: syncUser.accesoNombres || (localStorage.getItem('accesoNombres') ? JSON.parse(localStorage.getItem('accesoNombres')!) : undefined),
          accesoIds: syncUser.accesoIds || (localStorage.getItem('accesoIds') ? JSON.parse(localStorage.getItem('accesoIds')!) : undefined),
          especialidad: syncUser.especialidad || localStorage.getItem('especialidad') || undefined,
          especialidadId: syncUser.especialidadId || (localStorage.getItem('especialidadId') ? Number(localStorage.getItem('especialidadId')) : undefined),
        });

        if (syncUser.id) {
          authService.getUserFilters(syncUser.id).then(filters => {
            if (filters.examenes && filters.examenes.length > 0) {
              const strExams = JSON.stringify(filters.examenes);
              if (strExams !== localStorage.getItem('loginExamenes')) {
                localStorage.setItem('loginExamenes', strExams);
                setLoginExamenes(filters.examenes);
              }
            }
          }).catch(e => console.error('Error syncing user exams in background:', e));
        }
      }
    } catch (error: any) {
      console.error('Session verification failed', error);
      const errorMessage = error.message || String(error);
      if (
        errorMessage.includes('401') ||
        errorMessage.includes('Unauthorized') ||
        errorMessage.includes('403') ||
        errorMessage.includes('Token expired')
      ) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || token === 'undefined' || token === 'null') {
      setIsAuthenticated(false);
      setUser(null);
      setLoading(false);
      return;
    }

    setIsAuthenticated(true);
    
    const role = localStorage.getItem('role');
    const fullName = localStorage.getItem('fullName');
    const userId = localStorage.getItem('userId');
    const nivelId = localStorage.getItem('nivelId');
    const especialidadId = localStorage.getItem('especialidadId');
    const especialidad = localStorage.getItem('especialidad');
    const accesoNombresRaw = localStorage.getItem('accesoNombres');
    const accesoIdsRaw = localStorage.getItem('accesoIds');
    const fechaExpiracion = localStorage.getItem('fechaExpiracion');

    let accesoNombres: string[] = [];
    if (accesoNombresRaw) { try { accesoNombres = JSON.parse(accesoNombresRaw); } catch (e) {} }
    let accesoIds: number[] = [];
    if (accesoIdsRaw) { try { accesoIds = JSON.parse(accesoIdsRaw); } catch (e) {} }

    let finalInitialRole = role;
    if (fechaExpiracion && fechaExpiracion !== '-' && role?.toUpperCase() === 'PREMIUM') {
      if (new Date(fechaExpiracion) < new Date()) finalInitialRole = 'Client';
    }

    setUser({
      name: fullName || 'Usuario',
      id: userId ? Number(userId) : undefined,
      nivelId: nivelId ? Number(nivelId) : undefined,
      role: finalInitialRole || undefined,
      accesoNombres: accesoNombres.length > 0 ? accesoNombres : undefined,
      accesoIds: accesoIds.length > 0 ? accesoIds : undefined,
      especialidad: especialidad || undefined,
      especialidadId: especialidadId ? Number(especialidadId) : undefined,
    });

    const storedExams = localStorage.getItem('loginExamenes');
    if (storedExams) {
      try { setLoginExamenes(JSON.parse(storedExams)); } catch (e) {}
    }

    verifyStatus();
    setLoading(false);

    router.events.on('routeChangeComplete', verifyStatus);
    const interval = setInterval(verifyStatus, 30000);

    return () => {
      router.events.off('routeChangeComplete', verifyStatus);
      clearInterval(interval);
    };
  }, [logout, router.events, verifyStatus]);

  return { isAuthenticated, user, loginExamenes, loading, logout, refreshAuth: verifyStatus };
};
