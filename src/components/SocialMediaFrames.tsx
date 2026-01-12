import React, { useEffect } from 'react';

import config from '../config/index.json';

declare global {
  interface Window {
    FB: any;
  }
}

const SocialMediaFrames = () => {
  const { socials } = config;

  useEffect(() => {
    // Load TikTok Script
    const tiktokScript = document.createElement('script');
    tiktokScript.src = "https://www.tiktok.com/embed.js";
    tiktokScript.async = true;
    document.body.appendChild(tiktokScript);

    // Load Facebook SDK
    const facebookScript = document.createElement('script');
    facebookScript.src = "https://connect.facebook.net/es_LA/sdk.js#xfbml=1&version=v18.0";
    facebookScript.async = true;
    facebookScript.crossOrigin = "anonymous";
    facebookScript.defer = true;
    document.body.appendChild(facebookScript);
    
    // Initialize Facebook SDK if already loaded (optional but good for SPA nav)
    if (window.FB) {
        window.FB.XFBML.parse();
    }

    return () => {
      document.body.removeChild(tiktokScript);
      document.body.removeChild(facebookScript);
    };
  }, []);

  return (
    <div className="bg-white py-8">
      <div id="fb-root"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6 uppercase tracking-wide">SÍGUENOS EN:</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Youtube Frame */}
          <div className="rounded-xl overflow-hidden shadow-sm border border-gray-200 bg-white flex flex-col h-[500px] hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.open(socials.youtube, '_blank')}>
            <div className="bg-[#cc0000] p-2 px-3 flex justify-between items-center text-white h-10">
              <span className="font-bold text-sm">Youtube</span>
              <svg className="w-5 h-5 bg-white text-[#cc0000] rounded-sm p-[2px]" viewBox="0 0 24 24" fill="currentColor">
                 <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
              </svg>
            </div>
            <div className="flex-grow relative bg-black flex items-center justify-center overflow-hidden">
                <img 
                    src="/assets/images/youtube.jpeg" 
                    alt="Youtube Channel" 
                    className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-16 h-12 bg-[#cc0000] rounded-xl flex items-center justify-center shadow-lg">
                       <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                </div>
            </div>
            <div className="p-3 bg-white border-t border-gray-100">
                <h3 className="font-bold text-gray-900 text-sm">Juan Avend</h3>
                <p className="text-xs text-gray-500">Suscríbete a nuestro canal para más contenido.</p>
            </div>
          </div>

          {/* Facebook Frame */}
          <div className="fb-page" data-href="https://www.facebook.com/avendocenteperu" data-tabs="timeline" data-width="600" data-height="" data-small-header="false" data-adapt-container-width="true" data-hide-cover="false" data-show-facepile="true"><blockquote cite="https://www.facebook.com/avendocenteperu" className="fb-xfbml-parse-ignore"><a href="https://www.facebook.com/avendocenteperu">AVEND docente - Perú</a></blockquote></div>

          {/* TikTok Frame */}
          <div className="flex justify-center h-[500px] overflow-hidden">
            <blockquote 
              className="tiktok-embed" 
              cite="https://www.tiktok.com/@juan_avend" 
              data-unique-id="juan_avend" 
              data-embed-type="creator" 
              style={{ maxWidth: '780px', minWidth: '288px', margin: 0 }} 
            > 
              <section> 
                <a target="_blank" href="https://www.tiktok.com/@juan_avend?refer=creator_embed" rel="noreferrer">@juan_avend</a> 
              </section> 
            </blockquote>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SocialMediaFrames;
