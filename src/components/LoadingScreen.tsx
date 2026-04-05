import { useEffect, useState } from 'react';
import { STUDY_TIPS } from '../data/community';

interface LoadingScreenProps {
  onDone: () => void;
}

export function LoadingScreen({ onDone }: LoadingScreenProps) {
  const [tip] = useState(() => STUDY_TIPS[Math.floor(Math.random() * STUDY_TIPS.length)]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(onDone, 200);
          return 100;
        }
        return p + 4;
      });
    }, 80);
    return () => clearInterval(interval);
  }, [onDone]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 flex flex-col items-center justify-center z-50 px-8">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/30">
          <svg viewBox="0 0 40 40" className="w-12 h-12" fill="none">
            <path d="M8 32L20 8L32 32" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 24H28" stroke="#FCD34D" strokeWidth="3" strokeLinecap="round"/>
            <circle cx="20" cy="20" r="4" fill="#FCD34D"/>
          </svg>
        </div>
        <h1 className="text-white text-3xl font-bold tracking-tight">Prövningsguiden</h1>
        <p className="text-blue-200 text-sm mt-1">Din väg till högre betyg</p>
      </div>

      {/* Tip card */}
      <div className="bg-white/15 backdrop-blur-sm border border-white/25 rounded-2xl p-6 max-w-sm w-full mb-10">
        <p className="text-yellow-300 text-xs font-semibold uppercase tracking-wider mb-2">Studietips</p>
        <p className="text-white text-base leading-relaxed">{tip}</p>
      </div>

      {/* Progress */}
      <div className="w-full max-w-sm">
        <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-yellow-400 rounded-full transition-all duration-75"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-blue-200 text-xs text-center mt-3">Laddar prövningar...</p>
      </div>
    </div>
  );
}
