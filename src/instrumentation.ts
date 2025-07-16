// Instrumentation disabled to avoid Sentry issues in development
// import * as Sentry from '@sentry/nextjs';

export async function register() {
  // Instrumentation disabled
  console.log('Instrumentation disabled for development');
}

// export const onRequestError = Sentry.captureRequestError;
