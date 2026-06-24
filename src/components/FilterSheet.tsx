import { X, SlidersHorizontal, Navigation, Loader2, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '../store/useStore';
import { SUBJECTS, REGIONS } from '../data/exams';

interface FilterSheetProps {
  onClose: () => void;
}

export function FilterSheet({ onClose }: FilterSheetProps) {
  const {
    filterSubject, setFilterSubject,
    filterRegion, setFilterRegion,
    filterSortBy, setFilterSortBy,
    userLocation, locationStatus, requestLocation,
  } = useStore();

  const [localSubject, setLocalSubject] = useState(filterSubject);
  const [localRegion, setLocalRegion] = useState(filterRegion);
  const [localSortBy, setLocalSortBy] = useState(filterSortBy);

  const apply = () => {
    setFilterSubject(localSubject);
    setFilterRegion(localRegion);
    setFilterSortBy(localSortBy);
    onClose();
  };

  const reset = () => {
    setLocalSubject('');
    setLocalRegion('');
    setLocalSortBy('date');
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={onClose}>
      <div className="bg-white w-full rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={20} className="text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">Filter</h2>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={reset} className="text-blue-600 text-sm font-medium">Rensa</button>
            <button onClick={onClose} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Sort */}
        <div className="mb-6">
          <label className="text-sm font-semibold text-gray-700 block mb-2">Sortera efter</label>
          <div className="flex gap-2">
            {(['date', 'distance', 'name'] as const).map(s => (
              <button
                key={s}
                disabled={s === 'distance' && !userLocation}
                onClick={() => setLocalSortBy(s)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                  localSortBy === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                } ${s === 'distance' && !userLocation ? 'opacity-40' : ''}`}
              >
                {s === 'date' ? 'Datum' : s === 'distance' ? 'Avstånd' : 'Namn'}
              </button>
            ))}
          </div>
          {!userLocation && (
            <button
              onClick={requestLocation}
              disabled={locationStatus === 'pending'}
              className="mt-2 w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-700 text-xs font-semibold py-2.5 rounded-xl"
            >
              {locationStatus === 'pending'
                ? <Loader2 size={14} className="animate-spin" />
                : <Navigation size={14} />
              }
              {locationStatus === 'denied'
                ? 'Plats nekad — aktivera i webbläsarinställningar'
                : 'Aktivera plats för att sortera på avstånd'}
            </button>
          )}
        </div>

        {/* Subject */}
        <div className="mb-6">
          <label className="text-sm font-semibold text-gray-700 block mb-2">Ämne</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setLocalSubject('')}
              className={`py-2.5 rounded-xl text-sm font-medium transition-colors ${
                !localSubject ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              Alla ämnen
            </button>
            {SUBJECTS.map(s => (
              <button
                key={s}
                onClick={() => setLocalSubject(s === localSubject ? '' : s)}
                className={`py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  localSubject === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Region */}
        <div className="mb-6">
          <label className="text-sm font-semibold text-gray-700 block mb-2">Region</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setLocalRegion('')}
              className={`py-2.5 rounded-xl text-sm font-medium transition-colors ${
                !localRegion ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              Alla regioner
            </button>
            {REGIONS.map(r => (
              <button
                key={r}
                onClick={() => setLocalRegion(r === localRegion ? '' : r)}
                className={`py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  localRegion === r ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Price info */}
        <div className="mb-8 flex items-start gap-2.5 bg-green-50 border border-green-100 rounded-2xl p-3.5">
          <ShieldCheck size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-green-800 leading-relaxed">
            Avgiften för betygsprövning är lagstadgad och kostar <span className="font-semibold">500 kr</span> per
            prövning hos alla anordnare (gratis om du redan har betyget F). Inget pris att filtrera på.
          </p>
        </div>

        <button
          onClick={apply}
          className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl text-base"
        >
          Visa prövningar
        </button>
      </div>
    </div>
  );
}
