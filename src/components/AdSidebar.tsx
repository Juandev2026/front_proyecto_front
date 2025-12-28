import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { publicidadService, Publicidad } from '../services/publicidadService';
import { useRouter } from 'next/router';

const AdSidebar = () => {
  const { user, isAuthenticated } = useAuth();
  const [ads, setAds] = useState<Publicidad[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchAds = async () => {
      try {
        let fetchedAds: Publicidad[] | Publicidad = [];

        // Logic based on user request:
        // - Home (Inicio) -> getAll() (Generic ads) - Although AdSidebar isn't explicitly on Home yet, if it were, this covers it.
        // - Inside News/Resources/Courses -> 
        //    - If logged in (user.nivelId) -> getById(nivelId)
        //    - Else -> fallback to getAll() (SIEMPRE DEBE IR PUBLICIDAD)

        const isContentPage = ['/news', '/materials', '/videos', '/cursos'].some(path => router.pathname.startsWith(path));

        if (isAuthenticated && user?.nivelId && isContentPage) {
           fetchedAds = await publicidadService.getById(user.nivelId);
        } else {
           fetchedAds = await publicidadService.getAll();
        }

        // Normalize to array
        if (Array.isArray(fetchedAds)) {
          setAds(fetchedAds);
        } else {
          setAds([fetchedAds]);
        }
      } catch (error) {
        console.error('Error loading ads:', error);
        // Fallback or empty state could be handled here
      }
    };

    fetchAds();
  }, [isAuthenticated, user?.nivelId, router.pathname]);

  if (ads.length === 0) {
    return (
        <div className="space-y-6 sticky top-4">
            <div className="border border-gray-100 rounded-xl bg-gray-50 p-4 flex flex-col items-center justify-center h-64 text-center animate-pulse">
                <span className="text-gray-300 font-bold">Cargando...</span>
            </div>
        </div>
    );
  }

  // Render logic: 
  // We'll try to map the fetched ads to the UI. 
  // If we have just 1 ad, show it. If more, stack them.
  // The original UI had 2 specific placeholders (300x250 and Vertical).
  // We will simply map whatever we get.

  return (
    <div className="space-y-6 sticky top-4">
      {ads.map((ad, index) => {
        const hasPrice = ad.precio && ad.precio > 0;
        const link = hasPrice && ad.telefono 
            ? `https://wa.me/${ad.telefono}?text=${encodeURIComponent(`Hola, estoy interesado en ${ad.titulo || 'su publicidad'}`)}`
            : ad.enlace;
            
        return (
        <div key={ad.id || index} className="group border border-gray-100 rounded-xl bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
           {link ? (
               <a href={link} target="_blank" rel="noopener noreferrer" className="block relative">
                   {ad.imageUrl ? (
                       <img src={ad.imageUrl} alt={ad.titulo || 'Publicidad'} className="w-full h-auto object-cover" />
                   ) : (
                       <div className="h-64 bg-gray-100 flex items-center justify-center text-gray-400">
                           {ad.titulo || 'Publicidad'}
                       </div>
                   )}
                   <div className="absolute top-2 right-2 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded">
                       {hasPrice ? 'VENTA' : 'PUBLICIDAD'}
                   </div>
                   {hasPrice && (
                       <div className="absolute bottom-0 left-0 right-0 bg-primary/90 text-white text-xs font-bold py-1 px-2 text-center">
                           Comprar S/ {ad.precio}
                       </div>
                   )}
               </a>
           ) : (
               <div className="relative">
                   {ad.imageUrl ? (
                       <img src={ad.imageUrl} alt={ad.titulo || 'Publicidad'} className="w-full h-auto object-cover" />
                   ) : (
                       <div className="h-64 bg-gray-100 flex items-center justify-center text-gray-400 p-4 text-center">
                           {ad.titulo || 'Publicidad'}
                       </div>
                   )}
                    <div className="absolute top-2 right-2 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded">
                       PUBLICIDAD
                   </div>
               </div>
           )}
        </div>
        );
      })}
    </div>
  );
};

export default AdSidebar;
