import { RefreshCw } from 'lucide-react';

export function UpdateBanner() {
  return (
    <div className="absolute top-0 left-0 right-0 z-[60] flex justify-center pt-3 px-4 pointer-events-none">
      <div className="pointer-events-auto max-w-sm w-full bg-ink text-white rounded-md shadow-lg px-4 py-3 flex items-center gap-3 animate-rise">
        <div className="w-8 h-8 bg-brand-500 rounded-full flex items-center justify-center flex-shrink-0">
          <RefreshCw size={15} />
        </div>
        <p className="flex-1 text-sm font-medium">En ny version finns tillgänglig.</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-white text-ink text-xs font-bold px-3 py-2 rounded flex-shrink-0 active:scale-95 transition-transform"
        >
          Uppdatera
        </button>
      </div>
    </div>
  );
}
