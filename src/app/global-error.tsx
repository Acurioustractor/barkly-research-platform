"use client";

// Temporarily disabled Sentry to avoid module resolution issues
// import * as Sentry from "@sentry/nextjs";
import Error from "next/error";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console instead of Sentry for now
    console.error('Global error:', error);
    // Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        {/* `Error` is the default Next.js error page component. Its type
        definition requires a `statusCode` prop. However, since the App Router
        does not expose status codes for errors, we simply pass 500 to render a
        generic error message. */}
        <Error statusCode={500} />
      </body>
    </html>
  );
}