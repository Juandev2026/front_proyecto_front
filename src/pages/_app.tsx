import { AppProps } from 'next/app';
import { useRouter } from 'next/router';

import '../styles/main.css';
import WhatsAppWidget from '../components/WhatsAppWidget';

const MyApp = ({ Component, pageProps }: AppProps) => {
  const router = useRouter();
  // Check if current path is an admin page
  const isAdmin = router.pathname.startsWith('/admin');

  return (
    <>
      <Component {...pageProps} />
      {!isAdmin && <WhatsAppWidget />}
    </>
  );
};

export default MyApp;
