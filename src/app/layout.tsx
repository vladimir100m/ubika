import { Providers } from './providers';
import '../styles/globals.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ubika',
  description: 'Find your next home',
  manifest: '/manifest.json',
  themeColor: '#0074e4',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/icons/icon-192x192.png',
  },
};

export default function RootLayout({
  children,
  pageProps,
}: {
  children: React.ReactNode;
  pageProps: any;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <meta name="mobile-web-app-capable" content="yes" />
        <script src="/sw-register.js" defer></script>
      </head>
      <body>
        <Providers session={pageProps?.session}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
