import '../styles/globals.css';
import type { AppProps } from 'next/app';

import { Amplify } from 'aws-amplify';
import awsExports from '../src/aws-exports';

import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

// — Initialize Amplify with your configuration
Amplify.configure(awsExports);

export default function App({ Component, pageProps }: AppProps) {
  return (
    // This provider makes the Amplify Auth context available everywhere
    <Authenticator.Provider>
      <Component {...pageProps} />
    </Authenticator.Provider>
  );
}