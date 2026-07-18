// ============================================================
// AutoApply AI — App Shell Error Boundary
// Catches crashes inside dashboard/assets/activity/insights
// without breaking the parent sidebar and layout navigation.
// ============================================================

'use client';

import { useEffect } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

export default function AppShellError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App console component error captured:', error);
  }, [error]);

  return (
    <div className="flex h-full w-full items-center justify-center p-8 text-left">
      <div className="max-w-md w-full p-6 rounded-lg border border-neutral-800 bg-neutral-900/40 glass flex flex-col gap-4">
        <div className="flex items-center gap-3 text-amber-500">
          <AlertTriangle className="h-5 w-5" />
          <h3 className="font-bold text-sm">Failed to load content panel</h3>
        </div>
        <p className="text-xs text-neutral-400 leading-relaxed">
          An error occurred while loading this view. You can attempt to refresh the panel or navigate to another page using the menu.
        </p>
        {process.env.NODE_ENV === 'development' && (
          <pre className="text-[10px] text-red-300 bg-neutral-950 p-3 rounded overflow-x-auto max-h-32">
            {error.message}
          </pre>
        )}
        <button
          onClick={reset}
          className="w-full mt-2 py-2 text-xs font-semibold text-white bg-primary-500 hover:bg-primary-600 rounded-md transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <RefreshCw className="h-3 w-3" /> Retry View Load
        </button>
      </div>
    </div>
  );
}
