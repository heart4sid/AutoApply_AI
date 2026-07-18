// ============================================================
// AutoApply AI — Root Error Boundary
// ============================================================

'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled application error:', error);
  }, [error]);

  return (
    <html>
      <body className="bg-neutral-950 text-neutral-100 font-sans">
        <div className="flex min-h-screen items-center justify-center px-6">
          <div className="max-w-md w-full p-8 rounded-lg border border-red-500/30 bg-neutral-900/60 flex flex-col gap-6 text-center">
            <div className="text-4xl">⚠️</div>
            <h2 className="text-xl font-bold text-red-400">Something went wrong</h2>
            <p className="text-sm text-neutral-400 leading-relaxed">
              An unexpected error occurred. Our team has been notified.
            </p>
            {process.env.NODE_ENV === 'development' && (
              <pre className="text-xs text-left text-red-300 bg-neutral-950 p-3 rounded overflow-x-auto max-h-32">
                {error.message}
              </pre>
            )}
            <button
              onClick={reset}
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-md text-sm font-semibold cursor-pointer transition-all"
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
