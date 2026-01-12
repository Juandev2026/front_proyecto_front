import React, { useEffect, useState } from 'react';


import { publicidadService, Publicidad } from '../services/publicidadService';
import { useAuth } from '../hooks/useAuth';
import { error } from 'console';

const AdSidebar = ({ forceGeneral = false }: { forceGeneral?: boolean }) => {
  const [ads, setAds] = useState<Publicidad[]>([]);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchAds = async () => {
      try {
        let fetchedAds: Publicidad[] | Publicidad = await publicidadService.getAll();

        // Normalize to array
        let adsArray = Array.isArray(fetchedAds) ? fetchedAds : [fetchedAds];

        // Filter valid ads (only PUBLICADO)
        adsArray = adsArray.filter(
          (ad) => ad.estado?.nombre?.toUpperCase() === 'PUBLICADO'
        );

        // Filter by level if authenticated AND NOT forcing general ads
        if (!forceGeneral && isAuthenticated && user?.nivelId) {
          adsArray = adsArray.filter((ad) => ad.nivelId === user.nivelId);
        }
        
        
         // Sort by Orden ASC, then ID DESC
        // Sort by Orden ASC, then ID DESC
        // Logic: Valid positive orders (1, 2, 3) come first. 0 or undefined come last.
        adsArray.sort((a, b) => {
           const ordenA = Number(a.orden);
           const ordenB = Number(b.orden);
           
           // Check if they have specific positive priority
           const hasPriorityA = !isNaN(ordenA) && ordenA > 0;
           const hasPriorityB = !isNaN(ordenB) && ordenB > 0;

           if (hasPriorityA && hasPriorityB) {
              return ordenA - ordenB; // Both have priority: 1 before 2
           }
           if (hasPriorityA && !hasPriorityB) {
              return -1; // A has priority, B doesn't: A comes first
           }
           if (!hasPriorityA && hasPriorityB) {
              return 1; // B has priority, A doesn't: B comes first
           }

           // Neither has priority (both 0 or invalid): Tie-breaker Newest First
           return b.id - a.id; 
        });

        // Limit to 5 ads total
        adsArray = adsArray.slice(0, 5);

        setAds(adsArray);
      } catch (error) {
        console.error('Error loading ads:', error);
        // Fallback or empty state could be handled here
      }
    };

    fetchAds();
  }, [user?.nivelId, isAuthenticated, forceGeneral]);

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
        // Only show price if it's strictly greater than 0
        const hasPrice = typeof ad.precio === 'number' && ad.precio > 0;
        
        // Define links
        const whatsappLink = ad.telefono
            ? `https://wa.me/${ad.telefono}?text=${encodeURIComponent(
                `Me interesa este anuncio: ${ad.titulo}`
              )}`
            : null;

        const webLink = ad.enlace;

        // Image Click: Prioritize Web Link, then WhatsApp, then null
        const imageClickLink = webLink || whatsappLink;

        return (
          <div
            key={ad.id || index}
            className="group border border-gray-100 rounded-xl bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
          >
            {/* Image Area */}
            <div className="relative">
                {imageClickLink ? (
                    <a href={imageClickLink} target="_blank" rel="noopener noreferrer" className="block">
                         {ad.imageUrl ? (
                            <img
                                src={ad.imageUrl}
                                alt={ad.titulo || 'Publicidad'}
                                className="w-full h-auto object-cover"
                            />
                            ) : (
                            <div className="h-48 bg-gray-100 flex items-center justify-center text-gray-400 p-4 text-center text-sm">
                                {ad.titulo || 'Publicidad'}
                            </div>
                            )}
                    </a>
                ) : (
                     <div className="block">
                         {ad.imageUrl ? (
                            <img
                                src={ad.imageUrl}
                                alt={ad.titulo || 'Publicidad'}
                                className="w-full h-auto object-cover"
                            />
                            ) : (
                            <div className="h-48 bg-gray-100 flex items-center justify-center text-gray-400 p-4 text-center text-sm">
                                {ad.titulo || 'Publicidad'}
                            </div>
                            )}
                     </div>
                )}
               
                {/* Badge: "VENTA" if price > 0, else "PUBLICIDAD" */}
                <div className="absolute top-2 right-2 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded pointer-events-none">
                  {hasPrice ? 'VENTA' : 'PUBLICIDAD'}
                </div>
            </div>

            {/* Content & Buttons Area */}
            <div className="p-3 bg-white">
                {ad.titulo && <h4 className="text-sm font-bold text-gray-800 mb-2 line-clamp-1">{ad.titulo}</h4>}
                
                <div className="flex flex-col gap-2">
                    {/* Primary Action (WhatsApp/Buy) */}
                    {whatsappLink && (
                        <a 
                            href={whatsappLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-2 px-3 rounded flex items-center justify-center gap-2 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            {hasPrice ? `Comprar (S/ ${ad.precio})` : 'Contactar WhatsApp'}
                        </a>
                    )}

                    {/* Secondary Action (Web Link) */}
                    {webLink && (
                         <a 
                            href={webLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`w-full text-xs font-bold py-2 px-3 rounded flex items-center justify-center gap-2 transition-colors border ${whatsappLink ? 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50' : 'bg-primary text-white border-transparent hover:bg-blue-700'}`}
                        >
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            {whatsappLink ? 'Ver más información' : 'Ver enlace'}
                        </a>
                    )}
                </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AdSidebar;
