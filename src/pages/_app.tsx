import { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import Script from 'next/script';

import '../styles/main.css';
import '../styles/tiptap-editor.css';
import 'katex/dist/katex.min.css';
import WhatsAppWidget from '../components/WhatsAppWidget';
import { GA_MEASUREMENT_ID, trackPageView } from '../lib/analytics';
import { useAuth } from '../hooks/useAuth';

const MyApp = ({ Component, pageProps }: AppProps) => {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Track pageview on route change
    const handleRouteChange = (url: string) => {
      trackPageView(url);
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

  // Check if current path is an admin page or banco preguntas area
  // ALSO hide if user is authenticated (Aula Virtual)
  const isExcludedPath = router.pathname.startsWith('/admin') || 
                         router.pathname.startsWith('/bancoPreguntas') || 
                         router.pathname.startsWith('/bancoPreguntasAscenso') ||
                         router.pathname.startsWith('/recursosAscenso') ||
                         router.pathname.startsWith('/examen') ||
                         router.pathname.startsWith('/simulacroExamen') ||
                         router.pathname.startsWith('/respuestasErroneas');

  const showWhatsApp = !isAuthenticated && !isExcludedPath;

  return (
    <>
      {/* Google Analytics 4 */}
      {GA_MEASUREMENT_ID && (
        <>
          <Script
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          />
          <Script
            id="google-analytics"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}', {
                  page_path: window.location.pathname,
                  anonymize_ip: true,
                });
              `,
            }}
          />
        </>
      )}

      <Component {...pageProps} />
      {showWhatsApp && <WhatsAppWidget />}
    </>
  );
};

export default MyApp;
