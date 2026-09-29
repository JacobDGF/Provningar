import { useState, useMemo, useRef, useEffect, lazy, Suspense } from 'react';
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
import { WatchButton } from '../components/WatchButton';
import { haversineDistanceKm } from '../lib/distance';
import { matchesQuery } from '../lib/examSearch';
import { isOpenForRegistration, compareByPeriod } from '../lib/examStatus';
import { getStatusKey } from '../lib/examStatusColor';
import { getRegistrationFlow } from '../lib/registrationFlow';
import { useMinuteTick } from '../hooks/useMinuteTick';

/**
 * Hjältekartan är ortsaggregerad, inte en nål per listning.
 *
 * Här satt MapView, som ritar en egen DOM-nod per prövning: 588 absolut
 * positionerade, zoom-animerade divar med var sin box-shadow och var sin
 * bundna popup, alla i dokumentet oavsett vad som syns i rutan. På första
 * skärmen, som alla öppnar. HeroMap fanns redan i repot och säger i sin egen
 * dokumentation att den är gjord för just den här platsen — den slår ihop
 * listningarna till en cirkel per ort i ett enda SVG-lager, alltså ett par
 * tiotal noder i stället för sex hundra, utan att någon listning försvinner
 * från kartan.
 *
 * MapView ligger kvar i repot för den Kartvy-växel HeroMap:s kommentar
 * beskriver men som aldrig byggdes.
 */
const HeroMap = lazy(() => import('../components/HeroMap').then((m) => ({ default: m.HeroMap })));

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

const SORTS = [
  { key: 'date', label: 'Närmast i tid' },
  { key: 'distance', label: 'Närmast mig' },
  { key: 'name', label: 'Skola A–Ö' },
] as const;

/**
 * How many kort the listan monterar åt gången.
 *
 * Upptäck ritade tidigare hela träfflistan i ett svep. Med 588 listningar blev
 * förstasidan ~10 900 DOM-noder och 1 178 klickbara element innan någon hunnit
 * läsa rubriken — och varje kort bär två lager gradient plus ett 9rem-tecken,
 * alltså inte tomma noder utan yta att måla. Det är den profil iOS Safari
 * svarar på genom att döda webbprocessen och säga "A problem repeatedly
 * occurred", och det drabbar första skärmen, alltså alla.
 *
 * 24 är tre skärmars kort på en telefon: nog för att listan ska kännas hel och
 * gå att skrolla i innan nästa hämtas, litet nog att förstapaketet blir en
 * fyrtiondel av vad det var. Antalet träffar räknas fortfarande på hela
 * `filtered`, så "588 träffar" säger samma sak som förut.
 */
const PAGE_SIZE = 24;

/** One heading per filter row, so the block under the map reads as a panel
    rather than as four loose chip rows. */
function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-[11.5px] font-bold uppercase tracking-[.09em] text-ink-faint">{label}</p>
      {children}
    </div>
  );
}

export function Discover() {
  const {
    exams,
    searchQuery,
    setSearchQuery,
    filterSubject,
    filterRegion,
    filterCity,
    setFilterCity,
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
  const tick = useMinuteTick();

  const near = filterSortBy === 'distance' && !!userLocation;
  const hasActiveFilters = !!(
    filterSubject ||
    filterRegion ||
    filterDirectOnly ||
    filterOpenOnly ||
    filterStatus ||
    filterCity
  );

  const clearFilters = () => {
    setFilterSubject('');
    setFilterRegion('');
    setFilterDirectOnly(false);
    setFilterOpenOnly(false);
    setFilterStatus('');
    setSearchQuery('');
    setFilterCity('');
  };

  const filtered = useMemo(() => {
    const result = exams.filter((e) => {
      const matchesSearch = matchesQuery(e, searchQuery);
      const matchesSubject = !filterSubject || e.subject === filterSubject;
      const matchesRegion = !filterRegion || e.region === filterRegion;
      const matchesCity = !filterCity || e.city === filterCity;
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
    filterCity,
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

  // A new search or filter is a new list, and a new list starts at the top with
  // one page shown. Adjusted during render rather than in an effect — the same
  // pattern App uses for visitedTabs — so the first paint after a filter change
  // is already the short list, never a frame of the previous 588.
  const [shownList, setShownList] = useState(filtered);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  if (shownList !== filtered) {
    setShownList(filtered);
    setVisibleCount(PAGE_SIZE);
  }

  const visible = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);
  const hasMore = visibleCount < filtered.length;

  const showMore = () => setVisibleCount((n) => Math.min(n + PAGE_SIZE, filtered.length));

  /**
   * Skrollning hämtar nästa sida, knappen finns för allt annat.
   *
   * Observern är bekvämligheten: den som skrollar ska inte behöva trycka. Men
   * den som tabbar sig fram, kör med reducerad rörelse eller sitter i en
   * webbläsare utan IntersectionObserver ska inte tappa 564 listningar, så
   * knappen under listan är den riktiga vägen vidare och observern bara
   * trycker på den åt den som skrollar.
   */
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) showMore();
      },
      // Börja hämta en skärm innan sentinel-raden syns, så listan hinner växa
      // före kanten i stället för efter den.
      { rootMargin: '600px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
    // `visibleCount` hör hit: en observer rapporterar bara när skärningen
    // ändras, och på en bred skärm ligger sentinel-raden kvar innanför marginalen
    // efter att en sida hämtats. Utan omobservering stannade listan på 48 kort
    // tills någon tryckte på knappen. Omobserveringen fyller i stället på tills
    // raden hamnat utanför marginalen — alltså tills det finns något att skrolla.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, filtered, visibleCount]);

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
            Hitta prövning
          </h1>
          <p className="font-display italic text-[17px] sm:text-[20px] text-ink-soft mt-2">
            {exams.length} prövningar · {openNow} öppna för anmälan just nu
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
          <span className="bg-brand-500 text-white font-bold text-[13.5px] px-[18px] py-3 rounded-[20px] whitespace-nowrap tnum">
            {filtered.length} träffar
          </span>
        </div>

        {/* Only once the search means something. A watch is an ämne and a
            kommun, so until one of them is chosen there is nothing to keep. */}
        <WatchButton subject={filterSubject} city={filterCity} />

        {/* Map — straight under the search field, so the first thing you see
            after typing is where the hits actually are. */}
        <div className="bg-surface border-[1.5px] border-line rounded-[32px] overflow-hidden">
          <div className="flex items-center justify-between gap-3.5 px-[22px] py-[18px] flex-wrap">
            <div className="flex items-center gap-3">
              <span className="w-[38px] h-[38px] rounded-[14px] bg-brand-50 flex items-center justify-center flex-shrink-0">
                <MapPin size={18} strokeWidth={2.1} className="text-brand-500" />
              </span>
              <div>
                <p className="font-display font-semibold text-[19px] text-ink">
                  {filterCity || 'Hela Sverige'}
                </p>
                <p className="text-[13px] text-ink-soft tnum">
                  {cityCount} {cityCount === 1 ? 'ort' : 'orter'} · {openNow} går att boka nu
                </p>
              </div>
            </div>
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
          </div>
          <div className="h-[300px] bg-sand">
            <Suspense fallback={<MapFallback />}>
              <HeroMap exams={filtered} onCityClick={setFilterCity} className="w-full h-full" />
            </Suspense>
          </div>
        </div>

        {/* Every filter and sort in one panel, under the map. Splitting them
            across the page meant hunting for the one you wanted. */}
        <div className="bg-surface border-[1.5px] border-line rounded-[32px] px-[22px] py-[20px] flex flex-col gap-[18px]">
          <FilterRow label="Ämne">
            <div className="flex gap-2 flex-wrap">
              {SUBJECT_CHIPS.map((label) => {
                const isAll = label === 'Alla ämnen';
                const selected = isAll ? !filterSubject : filterSubject === label;
                return (
                  <button
                    key={label}
                    onClick={() => setFilterSubject(isAll ? '' : label)}
                    aria-pressed={selected}
                    className={`rounded-full px-[18px] py-2.5 text-[13.5px] font-bold transition-transform hover:-translate-y-0.5 ${
                      selected
                        ? 'bg-ink text-cream'
                        : 'bg-cream text-ink-soft border-[1.5px] border-line hover:border-ink'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </FilterRow>

          <FilterRow label="Ort">
            <div className="flex gap-2 flex-wrap">
              {CITY_CHIPS.map((c) => (
                <button
                  key={c}
                  onClick={() => setFilterCity(c === 'Hela Sverige' ? '' : c)}
                  aria-pressed={(filterCity || 'Hela Sverige') === c}
                  className={`rounded-full px-[18px] py-2.5 text-[13.5px] font-bold transition-transform hover:-translate-y-0.5 ${
                    (filterCity || 'Hela Sverige') === c
                      ? 'bg-brand-500 text-white'
                      : 'bg-cream text-ink-soft border-[1.5px] border-line hover:border-ink'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </FilterRow>

          {/* Colour key, doubling as the status filter. Carries its own heading
              because it hides itself when fewer than two colours are in play. */}
          <StatusFilterBar exams={exams} label="Status" />

          <FilterRow label="Sortera">
            <div className="flex gap-2 flex-wrap">
              {SORTS.map((s) => {
                const active = filterSortBy === s.key;
                return (
                  <button
                    key={s.key}
                    onClick={() =>
                      s.key === 'distance'
                        ? userLocation
                          ? setFilterSortBy('distance')
                          : requestLocation()
                        : setFilterSortBy(s.key)
                    }
                    disabled={s.key === 'distance' && locationStatus === 'pending'}
                    aria-pressed={active}
                    className={`rounded-full px-[18px] py-2.5 text-[13.5px] font-bold transition-transform hover:-translate-y-0.5 disabled:opacity-60 ${
                      active
                        ? 'bg-violet-ink text-white'
                        : 'bg-cream text-ink-soft border-[1.5px] border-line hover:border-ink'
                    }`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </FilterRow>

          <div className="flex gap-2 flex-wrap pt-1 border-t-[1.5px] border-sand mt-0.5">
            <button
              onClick={() => setShowFilter(true)}
              className={`mt-[18px] inline-flex items-center gap-2 rounded-full px-[18px] py-2.5 text-[13.5px] font-bold transition-transform hover:-translate-y-0.5 ${
                hasActiveFilters
                  ? 'bg-accent2-500 text-white'
                  : 'bg-cream text-ink-soft border-[1.5px] border-line hover:border-ink'
              }`}
            >
              <SlidersHorizontal size={15} strokeWidth={2.2} />
              Fler filter
            </button>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-[18px] inline-flex items-center gap-2 rounded-full px-[18px] py-2.5 text-[13.5px] font-bold text-ink-soft hover:text-red-600 transition-colors"
              >
                <X size={15} strokeWidth={2.2} />
                Rensa allt
              </button>
            )}
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
          <>
            <div className="grid gap-3.5 [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]">
              {visible.map((exam) => (
                <ExamCard key={exam.id} exam={exam} showDistance={near} />
              ))}
            </div>
            {hasMore && (
              <div ref={sentinelRef} className="flex flex-col items-center gap-3 pt-1">
                <p className="text-[13px] text-ink-faint">
                  Visar {visible.length} av {filtered.length}
                </p>
                <button
                  onClick={showMore}
                  className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-line bg-surface px-[18px] py-2.5 text-[13.5px] font-bold text-ink-soft transition-transform hover:-translate-y-0.5 hover:border-ink"
                >
                  Visa fler prövningar
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {showFilter && <FilterSheet onClose={() => setShowFilter(false)} />}
    </div>
  );
}
