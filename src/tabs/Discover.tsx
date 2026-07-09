import { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, X, TrendingUp, Navigation, ShieldCheck, HelpCircle, List, Map as MapIcon } from 'lucide-react';
import { useStore } from '../store/useStore';
import { ExamCard } from '../components/ExamCard';
import { FilterSheet } from '../components/FilterSheet';
import { MapView } from '../components/MapView';
import { haversineDistanceKm } from '../lib/distance';
import { isOpenForRegistration } from '../lib/examStatus';
import { useMinuteTick } from '../hooks/useMinuteTick';

const FEATURED_SUBJECTS = ['Matematik', 'Engelska', 'Svenska', 'Biologi', 'Kemi', 'Fysik'];

export function Discover() {
  const {
    exams, searchQuery, setSearchQuery, filterSubject, filterRegion, filterSortBy,
    userLocation, locationStatus, requestLocation, setShowingFaq,
  } = useStore();
  const [showFilter, setShowFilter] = useState(false);
  const [view, setView] = useState<'list' | 'map'>('list');
  const tick = useMinuteTick();

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

  // tick is a dependency so the live "öppna just nu" count recomputes each minute
  const stats = useMemo(() => ({
    providers: new Set(exams.map(e => e.provider)).size,
    cities: new Set(exams.map(e => e.city)).size,
    openNow: exams.filter(isOpenForRegistration).length,
  }), [exams, tick]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-surface px-4 lg:px-8 pt-14 lg:pt-8 pb-4 sticky top-0 z-30 border-b border-line">
        <div className="max-w-screen-2xl mx-auto w-full">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-ink font-display">Upptäck</h1>
              <p className="text-ink-soft text-sm lg:text-base">Hitta och anmäl dig till din nästa prövning</p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs lg:text-sm">
                <div className="flex items-center gap-1.5 text-trust-700 font-medium">
                  <ShieldCheck size={13} />
                  <span>Verifierade uppgifter · {stats.providers} anordnare i {stats.cities} städer</span>
                </div>
                <div className="flex items-center gap-1.5 bg-trust-50 border border-trust-100 text-trust-700 font-semibold px-2 py-0.5 rounded-full">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-trust-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-trust-600" />
                  </span>
                  <span>
                    Live · uppdaterad {new Date(tick).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
                    {stats.openNow > 0 && ` · ${stats.openNow} öppna för anmälan nu`}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowingFaq(true)}
              aria-label="Vanliga frågor"
              className="w-10 h-10 lg:w-12 lg:h-12 bg-sand rounded-2xl flex items-center justify-center flex-shrink-0 active:scale-90 hover:bg-line transition-colors lg:hidden"
            >
              <HelpCircle size={20} className="text-ink-soft" />
            </button>
          </div>

          {/* Search + filter + view toggle */}
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 bg-sand rounded-2xl px-3 py-3 lg:py-3.5">
              <Search size={18} className="text-ink-faint flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Sök ämne, skola, stad..."
                className="flex-1 bg-transparent text-sm lg:text-base text-ink placeholder-ink-faint outline-none"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')}>
                  <X size={16} className="text-ink-faint" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilter(true)}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors flex-shrink-0 ${
                hasActiveFilters ? 'bg-brand-500 text-white' : 'bg-sand text-ink-soft hover:bg-line'
              }`}
            >
              <SlidersHorizontal size={18} />
            </button>
            <div className="hidden sm:flex bg-sand rounded-2xl p-1 flex-shrink-0">
              <button
                onClick={() => setView('list')}
                aria-label="Listvy"
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  view === 'list' ? 'bg-surface shadow-sm text-ink' : 'text-ink-soft'
                }`}
              >
                <List size={18} />
              </button>
              <button
                onClick={() => setView('map')}
                aria-label="Kartvy"
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  view === 'map' ? 'bg-surface shadow-sm text-ink' : 'text-ink-soft'
                }`}
              >
                <MapIcon size={20} />
              </button>
            </div>
          </div>

          {/* Subject chips */}
          {!searchQuery && !filterSubject && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
              {FEATURED_SUBJECTS.map(s => (
                <button
                  key={s}
                  onClick={() => setSearchQuery(s)}
                  className="flex-shrink-0 bg-brand-50 text-brand-700 text-xs lg:text-sm font-semibold px-3 py-1.5 rounded-full hover:bg-brand-100 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {view === 'map' ? (
        <div className="flex-1 min-h-0 pb-16 lg:pb-0">
          <MapView exams={filtered} className="w-full h-full" />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pb-28 lg:pb-8">
          <div className="max-w-screen-2xl mx-auto w-full">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
                <div className="w-16 h-16 bg-sand rounded-2xl flex items-center justify-center mb-4">
                  <Search size={28} className="text-ink-faint" />
                </div>
                <h3 className="text-ink font-bold mb-1">Inga prövningar hittades</h3>
                <p className="text-ink-soft text-sm">Prova att ändra dina filter eller söka på något annat.</p>
              </div>
            ) : (
              <div className="px-4 lg:px-8 py-4 lg:py-6">
                {/* GPS prompt */}
                {!userLocation && locationStatus !== 'denied' && (
                  <button
                    onClick={requestLocation}
                    disabled={locationStatus === 'pending'}
                    className="w-full flex items-center gap-3 bg-brand-50 border border-brand-100 rounded-2xl p-4 text-left active:scale-98 transition-transform mb-4"
                  >
                    <div className="w-11 h-11 bg-brand-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm shadow-brand-200">
                      <Navigation size={20} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-ink text-sm font-bold">Hitta prövningar nära dig</p>
                      <p className="text-ink-soft text-xs">Aktivera plats för att se avstånd och sortera närmast först</p>
                    </div>
                  </button>
                )}

                {/* Results count */}
                <div className="flex items-center gap-2 text-sm text-ink-soft mb-4">
                  <TrendingUp size={15} className="text-brand-500" />
                  <span className="font-medium">{filtered.length} prövningar</span>
                  {hasActiveFilters && <span className="text-brand-600 font-semibold">· Filter aktiva</span>}
                  {filterSortBy === 'distance' && userLocation && <span className="text-brand-600 font-semibold">· Närmast först</span>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filtered.map(exam => (
                    <ExamCard key={exam.id} exam={exam} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showFilter && <FilterSheet onClose={() => setShowFilter(false)} />}
    </div>
  );
}
