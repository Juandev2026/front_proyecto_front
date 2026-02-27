import Document, { Html, Head, Main, NextScript } from 'next/document';

import { AppConfig } from '../utils/AppConfig';

// Need to create a custom _document because i18n support is not compatible with `next export`.
class MyDocument extends Document {
  render() {
    return (
      <Html lang={AppConfig.locale}>
        <Head>
          {/* Organization Structured Data */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'EducationalOrganization',
                name: 'Avendocente',
                description:
                  'Plataforma educativa con cursos de preparación para nombramiento docente, ascenso y contrato.',
                url: 'https://www.Avendocente.com',
                logo: 'https://www.Avendocente.com/assets/images/logo_principal.png',
                sameAs: [
                  'https://www.facebook.com/tuacademia',
                  'https://www.youtube.com/@tuacademia',
                  'https://www.tiktok.com/@tuacademia',
                ],
                contactPoint: {
                  '@type': 'ContactPoint',
                  telephone: '+51-976783049',
                  contactType: 'Customer Service',
                  availableLanguage: 'Spanish',
                },
              }),
            }}
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
