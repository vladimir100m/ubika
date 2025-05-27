import Script from 'next/script';
import type { AppProps } from 'next/app';
import '../styles/globals.css';
import { AuthProvider } from '../context/AuthContext';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
        strategy="beforeInteractive"
      />
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </>
  );
}

export default MyApp;