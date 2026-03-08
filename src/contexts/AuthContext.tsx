import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';

import { useRouter } from 'next/router';

import { authService, ExamenLogin, LoginResponse } from '../services/authService';

export interface AuthContextType {
  isAuthenticated: boolean;
  user: LoginResponse | null;
  loginExamenes: ExamenLogin[];
  loading: boolean;
  logout: () => void;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<LoginResponse | null>(null);
  const [loginExamenes, setLoginExamenes] = useState<ExamenLogin[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const isVerifying = useRef(false);
  const lastSyncTime = useRef(0);

  const logout = useCallback(() => {
    const authKeys = [
      'token',
      'fullName',
      'userId',
      'role',
      'nivelId',
      'modalidadId',
      'especialidad',
      'especialidadId',
      'fechaExpiracion',
      'accesoNombres',
      'accesoIds',
      'loginExamenes',
      'edAvailability',
    ];
    authKeys.forEach((key) => localStorage.removeItem(key));
    setIsAuthenticated(false);
    setUser(null);
    setLoginExamenes([]);
    router.push('/login');
  }, [router]);

  const verifyStatus = useCallback(async () => {
    if (isVerifying.current) return;
    isVerifying.current = true;

    try {
      const token = localStorage.getItem('token');
      if (!token || token === 'undefined' || token === 'null') {
        setIsAuthenticated(false);
        setUser(null);
        setLoading(false);
        return;
      }

      // 1. Verify token status
      const status = await authService.checkStatus();
      if (status) {
        setIsAuthenticated(true);
        const syncUser = (status as any).user || status;
        
        // Merge with existing user data to not lose fullName or email
        const currentUser = user || {
          fullName: localStorage.getItem('fullName') || '',
          nombreCompleto: localStorage.getItem('fullName') || '',
          email: '',
          role: localStorage.getItem('role') || 'Client',
          token: localStorage.getItem('token') || '',
          id: Number(localStorage.getItem('userId')) || 0,
        };

        const mergedUser = {
          ...currentUser,
          ...syncUser,
          // Preference for name from sync if it exists, otherwise preserve
          fullName: syncUser.fullName || syncUser.nombreCompleto || currentUser.fullName,
          nombreCompleto: syncUser.fullName || syncUser.nombreCompleto || currentUser.nombreCompleto
        };
        
        // Update user state and storage
        setUser(mergedUser);
        if (mergedUser.role) localStorage.setItem('role', mergedUser.role);
        const nameToStore = mergedUser.fullName || mergedUser.nombreCompleto;
        if (nameToStore) localStorage.setItem('fullName', nameToStore);
        if (mergedUser.especialidad) localStorage.setItem('especialidad', mergedUser.especialidad);

        // 2. Background sync exams if needed
        if (syncUser.id) {
          const now = Date.now();
          // Sync exams if never synced or if more than 2 minutes have passed
          if (now - lastSyncTime.current > 120000) {
            try {
              const filters = await authService.getUserFilters(syncUser.id);
              if (filters && filters.examenes) {
                const rawExamenes = filters.examenes;
                const userExamenesList: any[] = mergedUser.userExamenes || [];
                const accesoNombres: string[] = mergedUser.accesoNombres || [];
                const canNombramiento = accesoNombres.some((a: string) => a.toLowerCase().includes('nombramiento'));
                const canAscenso = accesoNombres.some((a: string) => a.toLowerCase().includes('ascenso'));

                const missingEntries: any[] = [];

                if (canNombramiento) {
                  userExamenesList.forEach((ue: any, idx: number) => {
                    const exists = rawExamenes.some(
                      (e: any) =>
                        String(e.tipoExamenId) === '2' &&
                        Number(e.modalidadId) === Number(ue.modalidadId) &&
                        Number(e.nivelId) === Number(ue.nivelId || 0)
                    );
                    if (!exists) {
                      missingEntries.push({
                        id: -(idx + 1000),
                        tipoExamenId: 2,
                        tipoExamenNombre: 'Nombramiento',
                        fuenteId: 2,
                        fuenteNombre: 'MINEDU Nombramiento',
                        modalidadId: ue.modalidadId,
                        modalidadNombre: ue.modalidadNombre,
                        nivelId: ue.nivelId || 0,
                        nivelNombre: ue.nivelNombre || 'NINGUNO',
                        especialidadId: ue.especialidadId || null,
                        especialidadNombre: ue.especialidadNombre || null,
                        years: [{ year: 0, cantidadPreguntas: 0 }],
                        cantidadPreguntas: 0,
                        clasificaciones: [],
                      });
                    }
                  });
                }

                if (canAscenso) {
                  userExamenesList.forEach((ue: any, idx: number) => {
                    const exists = rawExamenes.some(
                      (e: any) =>
                        String(e.tipoExamenId) === '1' &&
                        Number(e.modalidadId) === Number(ue.modalidadId) &&
                        Number(e.nivelId) === Number(ue.nivelId || 0)
                    );
                    if (!exists) {
                      missingEntries.push({
                        id: -(idx + 2000),
                        tipoExamenId: 1,
                        tipoExamenNombre: 'Ascenso',
                        fuenteId: 1,
                        fuenteNombre: 'MINEDU Ascenso',
                        modalidadId: ue.modalidadId,
                        modalidadNombre: ue.modalidadNombre,
                        nivelId: ue.nivelId || 0,
                        nivelNombre: ue.nivelNombre || 'NINGUNO',
                        especialidadId: ue.especialidadId || null,
                        especialidadNombre: ue.especialidadNombre || null,
                        years: [{ year: 0, cantidadPreguntas: 0 }],
                        cantidadPreguntas: 0,
                        clasificaciones: [],
                      });
                    }
                  });
                }

                const allExamenes = [...rawExamenes, ...missingEntries];
                const strExams = JSON.stringify(allExamenes);
                if (strExams !== localStorage.getItem('loginExamenes')) {
                  localStorage.setItem('loginExamenes', strExams);
                  setLoginExamenes(allExamenes);
                }
                lastSyncTime.current = Date.now();
              }
            } catch (e: any) {
              console.warn('Background sync failed (exams):', e.message);
              // If we already have localized exams, keep them
            }
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
      isVerifying.current = false;
    }
  }, [logout]);

  useEffect(() => {
    // Initial load from localStorage for rapid UI
    const token = localStorage.getItem('token');
    if (!token || token === 'undefined' || token === 'null') {
      setLoading(false);
      return;
    }

    const role = localStorage.getItem('role');
    const fullName = localStorage.getItem('fullName');
    const userId = localStorage.getItem('userId');
    const especialidad = localStorage.getItem('especialidad');
    const especialidadId = localStorage.getItem('especialidadId');

    setIsAuthenticated(true);
    setUser({
      id: userId ? Number(userId) : 0,
      fullName: fullName || '',
      nombreCompleto: fullName || '',
      email: '',
      role: role || 'Client',
      token: token,
      especialidad: especialidad || undefined,
      especialidadId: especialidadId ? Number(especialidadId) : undefined,
    });

    const storedExams = localStorage.getItem('loginExamenes');
    if (storedExams) {
      try {
        setLoginExamenes(JSON.parse(storedExams));
      } catch (e) {}
    }

    // Verify immediately and then every 30s
    verifyStatus();
    const interval = setInterval(verifyStatus, 30000);

    return () => clearInterval(interval);
  }, [verifyStatus]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        loginExamenes,
        loading,
        logout,
        refreshAuth: verifyStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
