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

  const chip = (active: boolean) =>
    `py-2.5 rounded-xl text-sm font-medium transition-colors ${
      active ? 'bg-brand-500 text-white' : 'bg-sand text-ink-soft'
    }`;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={onClose}>
      <div className="bg-cream w-full rounded-t-3xl p-6 max-h-[82vh] overflow-y-auto animate-sheet-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={20} className="text-brand-600" />
            <h2 className="text-lg font-bold text-ink font-display">Filter</h2>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={reset} className="text-brand-600 text-sm font-semibold">Rensa</button>
            <button onClick={onClose} className="w-8 h-8 bg-sand rounded-full flex items-center justify-center">
              <X size={16} className="text-ink-soft" />
            </button>
          </div>
        </div>

        {/* Sort */}
        <div className="mb-6">
          <label className="text-sm font-semibold text-ink block mb-2">Sortera efter</label>
          <div className="flex gap-2">
            {(['date', 'distance', 'name'] as const).map(s => (
              <button
                key={s}
                disabled={s === 'distance' && !userLocation}
                onClick={() => setLocalSortBy(s)}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  localSortBy === s ? 'bg-brand-500 text-white' : 'bg-sand text-ink-soft'
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
              className="mt-2 w-full flex items-center justify-center gap-2 bg-brand-50 text-brand-700 text-xs font-bold py-2.5 rounded-xl"
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
          <label className="text-sm font-semibold text-ink block mb-2">Ämne</label>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setLocalSubject('')} className={chip(!localSubject)}>Alla ämnen</button>
            {SUBJECTS.map(s => (
              <button key={s} onClick={() => setLocalSubject(s === localSubject ? '' : s)} className={chip(localSubject === s)}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Region */}
        <div className="mb-6">
          <label className="text-sm font-semibold text-ink block mb-2">Region</label>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setLocalRegion('')} className={chip(!localRegion)}>Alla regioner</button>
            {REGIONS.map(r => (
              <button key={r} onClick={() => setLocalRegion(r === localRegion ? '' : r)} className={chip(localRegion === r)}>
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Price info */}
        <div className="mb-8 flex items-start gap-2.5 bg-trust-50 border border-trust-100 rounded-2xl p-3.5">
          <ShieldCheck size={18} className="text-trust-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-trust-700 leading-relaxed">
            Avgiften för betygsprövning är lagstadgad och kostar <span className="font-semibold">500 kr</span> per
            prövning hos alla anordnare (gratis om du redan har betyget F). Inget pris att filtrera på.
          </p>
        </div>

        <button
          onClick={apply}
          className="w-full bg-brand-500 text-white font-bold py-4 rounded-2xl text-base active:scale-98 transition-transform shadow-md shadow-brand-200"
        >
          Visa prövningar
        </button>
      </div>
    </div>
  );
}
