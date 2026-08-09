import { useState, useMemo } from 'react';
import {
  Search,
  SlidersHorizontal,
  X,
  TrendingUp,
  Navigation,
  HelpCircle,
  List,
  Map as MapIcon,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { ExamCard } from '../components/ExamCard';
import { FilterSheet } from '../components/FilterSheet';
import { MapView } from '../components/MapView';
import { HeroMap } from '../components/HeroMap';
import { haversineDistanceKm } from '../lib/distance';
import { isOpenForRegistration } from '../lib/examStatus';
import { useMinuteTick } from '../hooks/useMinuteTick';

const FEATURED_SUBJECTS = ['Matematik', 'Engelska', 'Svenska', 'Biologi', 'Kemi', 'Fysik'];

const STEPS = [
  {
    n: '01',
    title: 'Hitta på kartan',
    body: 'Zooma in på din stad och se alla verifierade tillfällen nära dig.',
  },
  {
    n: '02',
    title: 'Jämför tillfällen',
    body: 'Se riktiga datum, ämne och anordnare samlat på en plats — aldrig gissade.',
  },
  { n: '03', title: 'Anmäl dig', body: 'Gå vidare direkt till anordnarens egen anmälan.' },
];

export function Discover() {
  const {
    exams,
    searchQuery,
    setSearchQuery,
    filterSubject,
    filterRegion,
    filterSortBy,
    userLocation,
    locationStatus,
    requestLocation,
    setShowingFaq,
  } = useStore();
  const [showFilter, setShowFilter] = useState(false);
  const [view, setView] = useState<'list' | 'map'>('list');
  const tick = useMinuteTick();

  const hasActiveFilters = !!(filterSubject || filterRegion);

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
      return matchesSearch && matchesSubject && matchesRegion;
    });

    const periodDate = (e: (typeof result)[0]) =>
      e.nextPeriod.confirmed
        ? e.nextPeriod.applicationEnd || e.nextPeriod.examWindowStart
        : undefined;

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
      result.sort(
        (a, b) =>
          haversineDistanceKm(userLocation.lat, userLocation.lng, a.lat, a.lng) -
          haversineDistanceKm(userLocation.lat, userLocation.lng, b.lat, b.lng),
      );
    } else {
      result.sort((a, b) => a.schoolName.localeCompare(b.schoolName));
    }

    return result;
  }, [exams, searchQuery, filterSubject, filterRegion, filterSortBy, userLocation]);

  // tick isn't read below, it's a trigger so the live "öppna just nu" count
  // recomputes each minute
  const stats = useMemo(
    () => ({
      providers: new Set(exams.map((e) => e.provider)).size,
      cities: new Set(exams.map((e) => e.city)).size,
      openNow: exams.filter(isOpenForRegistration).length,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [exams, tick],
  );

  const topCities = useMemo(() => {
    const counts = new Map<string, number>();
    exams.forEach((e) => counts.set(e.city, (counts.get(e.city) || 0) + 1));
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([city, count]) => ({ city, count }));
  }, [exams]);

  const eyebrow = userLocation
    ? `${userLocation.lat.toFixed(4)}° N · ${userLocation.lng.toFixed(4)}° Ö — din plats`
    : 'Hela Sverige — börja där du står';

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Sticky utility bar: FAQ + view toggle, stays out of the editorial hero's way */}
      <div className="sticky top-0 z-30 bg-cream/95 backdrop-blur-sm border-b border-line px-4 lg:px-8 py-2 flex items-center justify-between">
        <span className="font-display text-lg font-semibold text-ink">Prövningar</span>
        <div className="flex items-center gap-2">
          <div className="flex bg-sand rounded p-0.5">
            <button
              onClick={() => setView('list')}
              aria-label="Listvy"
              className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${
                view === 'list' ? 'bg-surface shadow-sm text-ink' : 'text-ink-soft'
              }`}
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setView('map')}
              aria-label="Kartvy"
              className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${
                view === 'map' ? 'bg-surface shadow-sm text-ink' : 'text-ink-soft'
              }`}
            >
              <MapIcon size={16} />
            </button>
          </div>
          <button
            onClick={() => setShowingFaq(true)}
            aria-label="Vanliga frågor"
            className="w-8 h-8 rounded bg-sand flex items-center justify-center active:scale-90 hover:bg-line transition-colors"
          >
            <HelpCircle size={16} className="text-ink-soft" />
          </button>
        </div>
      </div>

      {view === 'map' ? (
        <div className="flex-1 min-h-0" style={{ height: 'calc(100vh - 44px)' }}>
          <MapView exams={filtered} className="w-full h-full" />
        </div>
      ) : (
        <>
          {/* HERO */}
          <section className="max-w-screen-xl mx-auto w-full px-4 lg:px-8 pt-8 lg:pt-12 pb-6 lg:pb-8 grid grid-cols-1 lg:grid-cols-[minmax(320px,5fr)_7fr] gap-8 lg:gap-10 items-center">
            <div>
              <h6 className="text-brand-700 text-xs font-semibold uppercase tracking-wider mb-3">
                {eyebrow}
              </h6>
              <h1 className="font-display text-4xl lg:text-6xl font-semibold text-ink leading-tight -ml-px mb-3 max-w-[14ch]">
                Varje prövning i Sverige. På en karta.
              </h1>
              <p className="text-base lg:text-lg text-ink-soft max-w-[42ch] mb-6">
                Sök, jämför och anmäl dig till {exams.length} verifierade prövningstillfällen i hela
                landet. Samlat, uppdaterat — och alltid länkat direkt till anordnarens egen anmälan.
              </p>
              <div className="flex items-center gap-2 max-w-[440px] mb-3">
                <div className="flex-1 flex items-center gap-2 bg-sand rounded px-3 py-2.5 relative">
                  <Search size={16} className="text-ink-faint flex-shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Sök stad, ämne eller skola..."
                    className="flex-1 bg-transparent text-sm text-ink placeholder-ink-faint outline-none"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')}>
                      <X size={14} className="text-ink-faint" />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setShowFilter(true)}
                  className={`w-10 h-10 rounded flex items-center justify-center transition-colors flex-shrink-0 ${
                    hasActiveFilters
                      ? 'bg-brand-500 text-white'
                      : 'bg-sand text-ink-soft hover:bg-line'
                  }`}
                >
                  <SlidersHorizontal size={16} />
                </button>
              </div>
              <p className="text-xs text-ink-faint">
                {stats.providers} verifierade anordnare · 500 kr lagstadgad avgift, gratis vid
                tidigare F
              </p>
            </div>

            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                <button
                  onClick={() => setSearchQuery('')}
                  className={`text-xs px-2.5 py-1 rounded-sm border transition-colors ${
                    !searchQuery
                      ? 'bg-brand-100 text-brand-800 border-brand-200'
                      : 'border-line text-ink-soft hover:bg-sand'
                  }`}
                >
                  Alla ämnen
                </button>
                {FEATURED_SUBJECTS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSearchQuery(s)}
                    className={`text-xs px-2.5 py-1 rounded-sm border transition-colors ${
                      searchQuery === s
                        ? 'bg-brand-100 text-brand-800 border-brand-200'
                        : 'border-line text-ink-soft hover:bg-sand'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="relative">
                <div className="h-[340px] lg:h-[420px] rounded shadow-lg overflow-hidden">
                  <HeroMap
                    exams={filtered}
                    onCityClick={setSearchQuery}
                    className="w-full h-full"
                  />
                </div>
                <div className="absolute bottom-3 left-3 z-[500] bg-cream border border-accent2-200 text-accent2-700 text-xs font-semibold px-2.5 py-1.5 rounded shadow-sm flex items-center gap-1.5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent2-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent2-500" />
                  </span>
                  {filtered.length} tillfällen live just nu
                </div>
              </div>
            </div>
          </section>

          {/* STATS */}
          <section className="max-w-screen-xl mx-auto w-full px-4 lg:px-8 py-6 flex gap-8 lg:gap-12 flex-wrap border-t border-line">
            <div>
              <h2 className="font-display text-3xl font-semibold text-brand-700 mb-0.5">
                {stats.cities}+
              </h2>
              <p className="text-xs text-ink-faint">städer på kartan, från Kiruna till Ystad</p>
            </div>
            <div>
              <h2 className="font-display text-3xl font-semibold text-brand-700 mb-0.5">
                {exams.length}
              </h2>
              <p className="text-xs text-ink-faint">verifierade prövningstillfällen</p>
            </div>
            <div>
              <h2 className="font-display text-3xl font-semibold text-brand-700 mb-0.5">Live</h2>
              <p className="text-xs text-ink-faint">status uppdateras varje minut</p>
            </div>
          </section>

          {/* HOW IT WORKS */}
          <section className="max-w-screen-xl mx-auto w-full px-4 lg:px-8 py-8 border-t border-line">
            <h6 className="text-brand-700 text-xs font-semibold uppercase tracking-wider mb-2">
              Från karta till anmälan
            </h6>
            <h2 className="font-display text-2xl font-semibold text-ink mb-6">Hur det fungerar</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 lg:gap-10">
              {STEPS.map((step) => (
                <div key={step.n}>
                  <div className="font-display text-5xl font-semibold text-brand-700 leading-none mb-2 opacity-90">
                    {step.n}
                  </div>
                  <h4 className="font-display text-base font-semibold text-ink mb-1">
                    {step.title}
                  </h4>
                  <p className="text-sm text-ink-soft">{step.body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* CITIES */}
          {topCities.length > 0 && (
            <section className="max-w-screen-xl mx-auto w-full px-4 lg:px-8 py-8 border-t border-line">
              <h6 className="text-brand-700 text-xs font-semibold uppercase tracking-wider mb-2">
                Flest tillfällen just nu
              </h6>
              <h2 className="font-display text-2xl font-semibold text-ink mb-4">Populära städer</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {topCities.map(({ city, count }) => (
                  <button
                    key={city}
                    onClick={() => setSearchQuery(city)}
                    className="text-left bg-surface rounded p-3 hover:shadow-md hover:-translate-y-0.5 transition-all"
                  >
                    <p className="font-display font-semibold text-ink text-sm">{city}</p>
                    <p className="text-xs text-ink-faint mt-0.5">{count} tillfällen</p>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* RESULTS */}
          <section className="max-w-screen-xl mx-auto w-full px-4 lg:px-8 py-8 border-t border-line pb-28 lg:pb-16">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
                <div className="w-16 h-16 bg-sand rounded flex items-center justify-center mb-4">
                  <Search size={28} className="text-ink-faint" />
                </div>
                <h3 className="text-ink font-display font-semibold mb-1">
                  Inga prövningar hittades
                </h3>
                <p className="text-ink-soft text-sm">
                  Prova att ändra dina filter eller söka på något annat.
                </p>
              </div>
            ) : (
              <>
                {!userLocation && locationStatus !== 'denied' && (
                  <button
                    onClick={requestLocation}
                    disabled={locationStatus === 'pending'}
                    className="w-full flex items-center gap-3 bg-brand-50 border border-brand-100 rounded p-4 text-left active:scale-98 transition-transform mb-4"
                  >
                    <div className="w-11 h-11 bg-brand-500 rounded flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Navigation size={20} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-ink text-sm font-bold">Hitta prövningar nära dig</p>
                      <p className="text-ink-soft text-xs">
                        Aktivera plats för att se avstånd och sortera närmast först
                      </p>
                    </div>
                  </button>
                )}

                <div className="flex items-center gap-2 text-sm text-ink-soft mb-4">
                  <TrendingUp size={15} className="text-brand-500" />
                  <span className="font-medium">{filtered.length} prövningar</span>
                  {hasActiveFilters && (
                    <span className="text-brand-700 font-semibold">· Filter aktiva</span>
                  )}
                  {filterSortBy === 'distance' && userLocation && (
                    <span className="text-brand-700 font-semibold">· Närmast först</span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filtered.map((exam) => (
                    <ExamCard key={exam.id} exam={exam} />
                  ))}
                </div>
              </>
            )}
          </section>
        </>
      )}

      {showFilter && <FilterSheet onClose={() => setShowFilter(false)} />}
    </div>
  );
}
