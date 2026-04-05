import { X, SlidersHorizontal } from 'lucide-react';
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
    filterMaxPrice, setFilterMaxPrice,
    filterSortBy, setFilterSortBy,
  } = useStore();

  const [localSubject, setLocalSubject] = useState(filterSubject);
  const [localRegion, setLocalRegion] = useState(filterRegion);
  const [localMaxPrice, setLocalMaxPrice] = useState(filterMaxPrice);
  const [localSortBy, setLocalSortBy] = useState(filterSortBy);

  const apply = () => {
    setFilterSubject(localSubject);
    setFilterRegion(localRegion);
    setFilterMaxPrice(localMaxPrice);
    setFilterSortBy(localSortBy);
    onClose();
  };

  const reset = () => {
    setLocalSubject('');
    setLocalRegion('');
    setLocalMaxPrice(2000);
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
            {(['date', 'price', 'name'] as const).map(s => (
              <button
                key={s}
                onClick={() => setLocalSortBy(s)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                  localSortBy === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {s === 'date' ? 'Datum' : s === 'price' ? 'Pris' : 'Namn'}
              </button>
            ))}
          </div>
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

        {/* Max price */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-gray-700">Max pris</label>
            <span className="text-blue-600 font-bold">{localMaxPrice} kr</span>
          </div>
          <input
            type="range"
            min={500}
            max={2000}
            step={100}
            value={localMaxPrice}
            onChange={e => setLocalMaxPrice(Number(e.target.value))}
            className="w-full accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>500 kr</span>
            <span>2 000 kr</span>
          </div>
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
