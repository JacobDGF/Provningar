import { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, X, TrendingUp, Navigation, ShieldCheck } from 'lucide-react';
import { useStore } from '../store/useStore';
import { ExamCard } from '../components/ExamCard';
import { FilterSheet } from '../components/FilterSheet';
import { haversineDistanceKm } from '../lib/distance';

const FEATURED_SUBJECTS = ['Matematik', 'Engelska', 'Svenska', 'Biologi', 'Kemi', 'Fysik'];

export function Discover() {
  const {
    exams, searchQuery, setSearchQuery, filterSubject, filterRegion, filterSortBy,
    userLocation, locationStatus, requestLocation,
  } = useStore();
  const [showFilter, setShowFilter] = useState(false);

  const hasActiveFilters = !!(filterSubject || filterRegion);

  const filtered = useMemo(() => {
    let result = exams.filter(e => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q ||
        e.schoolName.toLowerCase().includes(q) ||
        e.subject.toLowerCase().includes(q) ||
        e.course.toLowerCase().includes(q) ||
        e.city.toLowerCase().includes(q) ||
        e.courseCode.toLowerCase().includes(q) ||
        e.provider.toLowerCase().includes(q);
      const matchesSubject = !filterSubject || e.subject === filterSubject;
      const matchesRegion = !filterRegion || e.region === filterRegion;
      return matchesSearch && matchesSubject && matchesRegion;
    });

    const periodDate = (e: typeof result[0]) =>
      e.nextPeriod.confirmed ? (e.nextPeriod.applicationEnd || e.nextPeriod.examWindowStart) : undefined;

    if (filterSortBy === 'date') {
      result.sort((a, b) => {
        const da = periodDate(a);
        const db = periodDate(b);
        if (da && db) return da.localeCompare(db);
        if (da) return -1;
        if (db) return 1;
        return a.schoolName.localeCompare(b.schoolName);
      });
    } else if (filterSortBy === 'distance' && userLocation) {
      result.sort((a, b) =>
        haversineDistanceKm(userLocation.lat, userLocation.lng, a.lat, a.lng) -
        haversineDistanceKm(userLocation.lat, userLocation.lng, b.lat, b.lng)
      );
    } else {
      result.sort((a, b) => a.schoolName.localeCompare(b.schoolName));
    }

    return result;
  }, [exams, searchQuery, filterSubject, filterRegion, filterSortBy, userLocation]);

  const stats = useMemo(() => ({
    providers: new Set(exams.map(e => e.provider)).size,
    cities: new Set(exams.map(e => e.city)).size,
  }), [exams]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white px-4 pt-14 pb-4 sticky top-0 z-30 border-b border-gray-100">
        <div className="mb-3">
          <h1 className="text-2xl font-bold text-gray-900">Upptäck</h1>
          <p className="text-gray-500 text-sm">Hitta din nästa prövning</p>
          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-green-700">
            <ShieldCheck size={13} />
            <span>Verifierade uppgifter från {stats.providers} anordnare i {stats.cities} städer</span>
          </div>
        </div>

        {/* Search + filter */}
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-2xl px-3 py-2.5">
            <Search size={18} className="text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Sök ämne, skola, stad..."
              className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')}>
                <X size={16} className="text-gray-400" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilter(true)}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-colors ${
              hasActiveFilters ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            <SlidersHorizontal size={18} />
          </button>
        </div>

        {/* Subject chips */}
        {!searchQuery && !filterSubject && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
            {FEATURED_SUBJECTS.map(s => (
              <button
                key={s}
                onClick={() => setSearchQuery(s)}
                className="flex-shrink-0 bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-full"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-24">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <Search size={28} className="text-gray-400" />
            </div>
            <h3 className="text-gray-800 font-semibold mb-1">Inga prövningar hittades</h3>
            <p className="text-gray-500 text-sm">Prova att ändra dina filter eller söka på något annat.</p>
          </div>
        ) : (
          <div className="px-4 py-4 space-y-4">
            {/* GPS prompt */}
            {!userLocation && locationStatus !== 'denied' && (
              <button
                onClick={requestLocation}
                disabled={locationStatus === 'pending'}
                className="w-full flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-2xl p-3.5 text-left"
              >
                <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Navigation size={16} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-blue-900 text-sm font-semibold">Hitta prövningar nära dig</p>
                  <p className="text-blue-600 text-xs">Aktivera plats för att se avstånd och sortera närmast först</p>
                </div>
              </button>
            )}

            {/* Results count */}
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <TrendingUp size={15} className="text-blue-500" />
              <span>{filtered.length} prövningar</span>
              {hasActiveFilters && <span className="text-blue-600 font-medium">· Filter aktiva</span>}
              {filterSortBy === 'distance' && userLocation && <span className="text-blue-600 font-medium">· Närmast först</span>}
            </div>

            {filtered.map(exam => (
              <ExamCard key={exam.id} exam={exam} />
            ))}
          </div>
        )}
      </div>

      {showFilter && <FilterSheet onClose={() => setShowFilter(false)} />}
    </div>
  );
}
