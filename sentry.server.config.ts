// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

// Sentry is optional in development; guard import to avoid type errors if package is missing
let Sentry: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Sentry = require('@sentry/nextjs');
} catch {
  Sentry = { init: () => {} };
}

Sentry.init({
  dsn: "https://e5a3314ef798a555a2cbf725f22fea96@o4509619774947328.ingest.de.sentry.io/4509619781369936",

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
});
