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
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const userId =
      typeof window !== 'undefined' ? localStorage.getItem('userId') : null;

    if (!token || !userId) return;

    try {
      // Use getUserFilters as primary sync to get both user and exam metadata
      const data = await authService.getUserFilters(Number(userId), token);

      if (data && data.user) {
        const syncUser = data.user;

        // Sync localStorage
        if (syncUser.role) localStorage.setItem('role', syncUser.role);
        if (syncUser.fullName) localStorage.setItem('fullName', syncUser.fullName);
        if (syncUser.nivelId)
          localStorage.setItem('nivelId', String(syncUser.nivelId));
        if (syncUser.accesoNombres)
          localStorage.setItem(
            'accesoNombres',
            JSON.stringify(syncUser.accesoNombres)
          );
        if (syncUser.accesoIds)
          localStorage.setItem('accesoIds', JSON.stringify(syncUser.accesoIds));
        if (syncUser.especialidad)
          localStorage.setItem('especialidad', syncUser.especialidad);
        if (syncUser.especialidadId)
          localStorage.setItem(
            'especialidadId',
            String(syncUser.especialidadId)
          );
        if (syncUser.fechaExpiracion)
          localStorage.setItem('fechaExpiracion', syncUser.fechaExpiracion);

        let currentRole = syncUser.role;

        // Handle Role Expiration
        if (
          syncUser.fechaExpiracion &&
          syncUser.fechaExpiracion !== '-' &&
          currentRole?.toUpperCase() === 'PREMIUM'
        ) {
          const expDate = new Date(syncUser.fechaExpiracion);
          if (expDate < new Date()) {
            currentRole = 'Client';
          }
        }

        // Update User State
        setUser({
          name: syncUser.fullName || 'Usuario',
          id: syncUser.id,
          nivelId: syncUser.nivelId || undefined,
          role: currentRole || undefined,
          accesoNombres: syncUser.accesoNombres || undefined,
          accesoIds: syncUser.accesoIds || undefined,
          especialidad: syncUser.especialidad || undefined,
          especialidadId: syncUser.especialidadId || undefined,
        });

        // Sync Examenes
        if (data.examenes) {
          const strExams = JSON.stringify(data.examenes);
          if (strExams !== localStorage.getItem('loginExamenes')) {
            localStorage.setItem('loginExamenes', strExams);
            setLoginExamenes(data.examenes);
          }
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
    
    // Refresh on focus to catch changes made in other tabs (admin panel)
    window.addEventListener('focus', verifyStatus);
    
    const interval = setInterval(verifyStatus, 15000);

    return () => {
      router.events.off('routeChangeComplete', verifyStatus);
      window.removeEventListener('focus', verifyStatus);
      clearInterval(interval);
    };
  }, [logout, router.events, verifyStatus]);

  return { isAuthenticated, user, loginExamenes, loading, logout, refreshAuth: verifyStatus };
};
