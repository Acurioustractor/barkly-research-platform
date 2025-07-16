// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

// Client-side instrumentation disabled to avoid module resolution issues
// import * as Sentry from "@sentry/nextjs";

export function register() {
  // Client instrumentation disabled
  console.log('Client instrumentation disabled for development');
}