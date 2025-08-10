// src/pages/_app.tsx

import { AppProps } from 'next/app';
import { Amplify } from 'aws-amplify';
import awsExports from '@/aws-exports';
import '@/styles/globals.css'; // Optional, if you're using global styles

Amplify.configure(awsExports);

export default function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
