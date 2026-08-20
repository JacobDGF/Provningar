import { useState, useMemo, lazy, Suspense } from 'react';
import {
  Search,
  MapPin,
  Navigation,
  HelpCircle,
  SlidersHorizontal,
  Loader2,
  X,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { ExamCard } from '../components/ExamCard';
import { FilterSheet } from '../components/FilterSheet';
import { StatusFilterBar } from '../components/StatusFilterBar';
import { haversineDistanceKm } from '../lib/distance';
import { isOpenForRegistration, compareByPeriod } from '../lib/examStatus';
import { getStatusKey } from '../lib/examStatusColor';
import { getRegistrationFlow } from '../lib/registrationFlow';
import { useMinuteTick } from '../hooks/useMinuteTick';

const MapView = lazy(() => import('../components/MapView').then((m) => ({ default: m.MapView })));

function MapFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-sand">
      <Loader2 size={24} className="text-brand-400 animate-spin" />
    </div>
  );
}

const SUBJECT_CHIPS = ['Alla ämnen', 'Matematik', 'Engelska', 'Svenska', 'Kemi', 'Fysik'];

/** The four the design names, plus "Hela Sverige". Each is a real city in the
    dataset, so a chip never filters to nothing. */
const CITY_CHIPS = ['Hela Sverige', 'Stockholm', 'Göteborg', 'Malmö', 'Umeå'];

export function Discover() {
  const {
    exams,
    searchQuery,
    setSearchQuery,
    filterSubject,
    filterRegion,
    filterSortBy,
    setFilterSortBy,
    filterDirectOnly,
    filterOpenOnly,
    setFilterOpenOnly,
    filterStatus,
    setFilterStatus,
    setFilterSubject,
    setFilterRegion,
    setFilterDirectOnly,
    userLocation,
    locationStatus,
    requestLocation,
    setShowingFaq,
  } = useStore();
  const [showFilter, setShowFilter] = useState(false);
  const [city, setCity] = useState('Hela Sverige');
  const tick = useMinuteTick();

  const near = filterSortBy === 'distance' && !!userLocation;
  const hasActiveFilters = !!(
    filterSubject ||
    filterRegion ||
    filterDirectOnly ||
    filterOpenOnly ||
    filterStatus ||
    city !== 'Hela Sverige'
  );

  const clearFilters = () => {
    setFilterSubject('');
    setFilterRegion('');
    setFilterDirectOnly(false);
    setFilterOpenOnly(false);
    setFilterStatus('');
    setSearchQuery('');
    setCity('Hela Sverige');
  };

  const filtered = useMemo(() => {
    const result = exams.filter((e) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        e.schoolName.toLowerCase().includes(q) ||
        e.subject.toLowerCase().includes(q) ||
        e.course.toLowerCase().includes(q) ||
        e.city.toLowerCase().includes(q) ||
        e.courseCode.toLowerCase().includes(q) ||
        e.provider.toLowerCase().includes(q);
      const matchesSubject = !filterSubject || e.subject === filterSubject;
      const matchesRegion = !filterRegion || e.region === filterRegion;
      const matchesCity = city === 'Hela Sverige' || e.city === city;
      const matchesDirect = !filterDirectOnly || getRegistrationFlow(e).direct;
      const matchesOpen = !filterOpenOnly || isOpenForRegistration(e);
      const matchesStatus = !filterStatus || getStatusKey(e) === filterStatus;
      return (
        matchesSearch &&
        matchesSubject &&
        matchesRegion &&
        matchesCity &&
        matchesDirect &&
        matchesOpen &&
        matchesStatus
      );
    });

    if (filterSortBy === 'distance' && userLocation) {
      result.sort(
        (a, b) =>
          haversineDistanceKm(userLocation.lat, userLocation.lng, a.lat, a.lng) -
          haversineDistanceKm(userLocation.lat, userLocation.lng, b.lat, b.lng),
      );
    } else if (filterSortBy === 'name') {
      result.sort((a, b) => a.schoolName.localeCompare(b.schoolName, 'sv'));
    } else {
      result.sort(compareByPeriod);
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    exams,
    searchQuery,
    filterSubject,
    filterRegion,
    city,
    filterSortBy,
    filterDirectOnly,
    filterOpenOnly,
    filterStatus,
    // Status buckets are computed against the clock.
    tick,
    userLocation,
  ]);

  const openNow = useMemo(
    () => exams.filter(isOpenForRegistration).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [exams, tick],
  );

  const cityCount = useMemo(() => new Set(filtered.map((e) => e.city)).size, [filtered]);

  const toggleNear = () => {
    if (near) setFilterSortBy('date');
    else if (userLocation) setFilterSortBy('distance');
    else requestLocation();
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-cream">
      {/* Mobile utility bar — the sidebar carries this on desktop */}
      <div className="lg:hidden sticky top-0 z-30 bg-cream/95 backdrop-blur-sm border-b border-line px-4 py-2 flex items-center justify-between">
        <span className="font-display text-lg font-semibold text-ink">Prövningar</span>
        <button
          onClick={() => setShowingFaq(true)}
          aria-label="Vanliga frågor"
          className="w-9 h-9 rounded-xl bg-violet-tint flex items-center justify-center"
        >
          <HelpCircle size={17} className="text-violet-ink" />
        </button>
      </div>

      <div className="max-w-screen-xl mx-auto w-full px-4 lg:px-8 py-6 lg:py-8 flex flex-col gap-5 animate-rise-in pb-28 lg:pb-10">
        <div>
          <h1 className="font-hero-xl text-[38px] sm:text-[48px] lg:text-[56px] leading-none text-ink">
            Vilket ämne ska upp?
          </h1>
          <p className="font-display italic text-[17px] sm:text-[20px] text-ink-soft mt-2">
            {exams.length} prövningar i hela Sverige — välj ett ämne och se när nästa omgång öppnar.
          </p>
        </div>

        {/* Search. The teal frame is always on, not only at focus: a grey box
            in a grey column reads as a label, not as something you type in. */}
        <div className="focus-ring-host flex items-center gap-3 bg-brand-50 border-2 border-brand-500 rounded-[26px] pl-5 pr-2 py-1.5">
          <Search size={19} strokeWidth={2.2} className="text-brand-500 flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Sök ämne, kurs eller stad"
            aria-label="Sök bland prövningar"
            enterKeyHint="search"
            autoComplete="off"
            spellCheck={false}
            className="flex-1 min-w-0 bg-transparent border-0 outline-none text-[16.5px] font-semibold text-brand-700 placeholder-brand-400 py-3.5"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              aria-label="Rensa sökningen"
              className="w-8 h-8 rounded-full hover:bg-brand-100 flex items-center justify-center flex-shrink-0"
            >
              <X size={15} className="text-brand-700" />
            </button>
          )}
          <button
            onClick={() => setShowFilter(true)}
            aria-label="Fler filter"
            className={`w-10 h-10 rounded-[18px] flex items-center justify-center flex-shrink-0 transition-colors ${
              hasActiveFilters ? 'bg-accent2-500 text-white' : 'text-brand-700 hover:bg-brand-100'
            }`}
          >
            <SlidersHorizontal size={17} />
          </button>
          <span className="bg-brand-500 text-white font-bold text-[13.5px] px-[18px] py-3 rounded-[20px] whitespace-nowrap tnum">
            {filtered.length} träffar
          </span>
        </div>

        {/* Subject chips */}
        <div className="flex gap-2.5 flex-wrap">
          {SUBJECT_CHIPS.map((label) => {
            const isAll = label === 'Alla ämnen';
            const selected = isAll ? !filterSubject : filterSubject === label;
            return (
              <button
                key={label}
                onClick={() => setFilterSubject(isAll ? '' : label)}
                aria-pressed={selected}
                className={`rounded-full px-5 py-3 text-[14px] font-bold transition-transform hover:-translate-y-0.5 ${
                  selected
                    ? 'bg-ink text-cream'
                    : 'bg-surface text-ink-soft border-[1.5px] border-line hover:border-ink'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Colour key, doubling as the status filter */}
        <StatusFilterBar exams={exams} />

        {/* Map card */}
        <div className="bg-surface border-[1.5px] border-line rounded-[32px] overflow-hidden">
          <div className="flex items-center justify-between gap-3.5 px-[22px] py-[18px] flex-wrap">
            <div className="flex items-center gap-3">
              <span className="w-[38px] h-[38px] rounded-[14px] bg-brand-50 flex items-center justify-center flex-shrink-0">
                <MapPin size={18} strokeWidth={2.1} className="text-brand-500" />
              </span>
              <div>
                <p className="font-display font-semibold text-[19px] text-ink">Nära dig</p>
                <p className="text-[13px] text-ink-soft">
                  {cityCount} {cityCount === 1 ? 'ort' : 'orter'} · {openNow} går att boka nu
                </p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              <button
                onClick={toggleNear}
                disabled={locationStatus === 'pending'}
                aria-pressed={near}
                className={`inline-flex items-center gap-2 rounded-full px-[17px] py-2.5 text-[13px] font-bold transition-transform hover:-translate-y-0.5 disabled:opacity-60 ${
                  near ? 'bg-trust-500 text-white' : 'bg-trust-50 text-trust-700'
                }`}
              >
                <Navigation size={15} strokeWidth={2.2} />
                Nära mig
              </button>
              {CITY_CHIPS.map((c) => (
                <button
                  key={c}
                  onClick={() => setCity(c)}
                  aria-pressed={city === c}
                  className={`rounded-full px-4 py-2.5 text-[13px] font-bold transition-transform hover:-translate-y-0.5 ${
                    city === c ? 'bg-brand-500 text-white' : 'bg-cream text-ink-soft hover:bg-sand'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[300px] bg-sand">
            <Suspense fallback={<MapFallback />}>
              <MapView exams={filtered} className="w-full h-full" />
            </Suspense>
          </div>
        </div>

        {/* Cards */}
        {filtered.length === 0 ? (
          <div className="bg-surface border-[1.5px] border-dashed border-line rounded-[26px] p-9 text-center">
            <p className="font-display italic text-[18px] text-ink-soft">
              Inga prövningar matchar det här.
            </p>
            <button
              onClick={clearFilters}
              className="mt-4 inline-flex items-center gap-2 bg-ink text-cream text-[14px] font-bold px-5 py-3 rounded-[20px]"
            >
              <X size={15} /> Rensa filtren
            </button>
          </div>
        ) : (
          <div className="grid gap-3.5 [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]">
            {filtered.map((exam) => (
              <ExamCard key={exam.id} exam={exam} showDistance={near} />
            ))}
          </div>
        )}
      </div>

      {showFilter && <FilterSheet onClose={() => setShowFilter(false)} />}
    </div>
  );
}
