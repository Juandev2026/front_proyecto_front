import { AppProps } from 'next/app';

import '../styles/main.css';
import WhatsAppWidget from '../components/WhatsAppWidget';

const MyApp = ({ Component, pageProps }: AppProps) => (
  <>
    <Component {...pageProps} />
    <WhatsAppWidget />
  </>
);

export default MyApp;
