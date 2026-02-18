import { API_BASE_URL } from '../config/api';
import { getAuthHeaders } from '../utils/apiUtils';

export interface RelacionSeccion {
    id: number;
    seccionId: number;
    subSeccionId: number;
    materialId: number;
    material?: {
        id: number;
        titulo: string;
        url: string;
        archivoUrl?: string;
    };
}

export interface CreateRelacionRequest {
    idSeccion: number;
    idSubSeccion: number;
    materialId: number;
}

export const seccionRelacionService = {
    getBySubSeccion: async (subSeccionId: number): Promise<RelacionSeccion[]> => {
        try {
            const response = await fetch(`${API_BASE_URL}/RelacionesSecciones/subseccion/${subSeccionId}`, {
                headers: getAuthHeaders(),
            });
            if (!response.ok) throw new Error('Error al obtener relaciones por subsección');
            return await response.json();
        } catch (error) {
            console.error('Error fetching relaciones by subseccion:', error);
            return [];
        }
    },

    create: async (data: CreateRelacionRequest): Promise<RelacionSeccion> => {
        try {
            const response = await fetch(`${API_BASE_URL}/RelacionesSecciones`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errText = await response.text();
                console.error("Error backend crear relación:", errText);
                throw new Error(`Error al crear relación: ${errText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error creating relacion params:', data);
            console.error('Error creating relacion:', error);
            throw error;
        }
    },

    delete: async (id: number): Promise<void> => {
        try {
            const response = await fetch(`${API_BASE_URL}/RelacionesSecciones/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });
            if (!response.ok) throw new Error('Error al eliminar relación');
        } catch (error) {
            console.error('Error deleting relacion:', error);
            throw error;
        }
    }
};
