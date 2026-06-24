import { ChevronLeft, ChevronRight, Calendar, MapPin, Clock } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';

const MONTHS = ['Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni', 'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'];
const WEEKDAYS = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'];

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function CalendarTab() {
  const { savedExams, exams, setShowingExamDetail, setActiveTab } = useStore();
  const [currentDate, setCurrentDate] = useState(new Date(2026, 3)); // April 2026
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  // Build event map: date string -> exam ids (only confirmed, real dates — never fabricated)
  const eventMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    savedExams.forEach(se => {
      const exam = exams.find(e => e.id === se.examId);
      if (!exam || !exam.nextPeriod.confirmed) return;
      [exam.nextPeriod.applicationEnd, exam.nextPeriod.examWindowStart].forEach(d => {
        if (!d) return;
        if (!map[d]) map[d] = [];
        if (!map[d].includes(se.examId)) map[d].push(se.examId);
      });
    });
    return map;
  }, [savedExams, exams]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Days in month
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  // Monday = 0 offset
  const startOffset = (firstDay.getDay() + 6) % 7;
  const totalCells = Math.ceil((startOffset + lastDay.getDate()) / 7) * 7;

  const cells: (Date | null)[] = [];
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - startOffset + 1;
    if (dayNum < 1 || dayNum > lastDay.getDate()) cells.push(null);
    else cells.push(new Date(year, month, dayNum));
  }

  const today = new Date();

  const selectedDayExams = useMemo(() => {
    if (!selectedDay) return [];
    const key = `${selectedDay.getFullYear()}-${String(selectedDay.getMonth() + 1).padStart(2, '0')}-${String(selectedDay.getDate()).padStart(2, '0')}`;
    const ids = eventMap[key] || [];
    return ids.map(id => {
      const exam = exams.find(e => e.id === id)!;
      const isDeadline = exam.nextPeriod.applicationEnd === key;
      return { exam, isDeadline };
    });
  }, [selectedDay, eventMap, exams]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1));

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white px-4 pt-14 pb-4 sticky top-0 z-30 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kalender</h1>
            <p className="text-gray-500 text-sm">Dina sparade prövningsdatum</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-semibold text-gray-800 min-w-[110px] text-center">
              {MONTHS[month]} {year}
            </span>
            <button
              onClick={nextMonth}
              className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-400" />
            Anmälningsstopp
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            Provdag
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {/* Calendar grid */}
        <div className="bg-white mx-4 mt-4 rounded-2xl overflow-hidden border border-gray-100">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-gray-100">
            {WEEKDAYS.map(d => (
              <div key={d} className="text-center text-xs font-semibold text-gray-400 py-2">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {cells.map((date, i) => {
              if (!date) return <div key={i} className="aspect-square" />;

              const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
              const events = eventMap[key] || [];
              const isToday = isSameDay(date, today);
              const isSelected = selectedDay && isSameDay(date, selectedDay);

              // Find dot colors
              const hasDeadline = events.some(id => {
                const exam = exams.find(e => e.id === id);
                return exam?.nextPeriod.applicationEnd === key;
              });
              const hasExam = events.some(id => {
                const exam = exams.find(e => e.id === id);
                return exam?.nextPeriod.examWindowStart === key;
              });

              return (
                <button
                  key={i}
                  onClick={() => setSelectedDay(isSameDay(date, selectedDay || new Date(0)) ? null : date)}
                  className={`aspect-square flex flex-col items-center justify-center transition-colors relative ${
                    isSelected ? 'bg-blue-600' : isToday ? 'bg-blue-50' : ''
                  }`}
                >
                  <span className={`text-sm font-medium leading-none ${
                    isSelected ? 'text-white' : isToday ? 'text-blue-600' : 'text-gray-700'
                  }`}>
                    {date.getDate()}
                  </span>
                  {events.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {hasDeadline && <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-red-300' : 'bg-red-400'}`} />}
                      {hasExam && <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-blue-300' : 'bg-blue-500'}`} />}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected day events */}
        {selectedDay && (
          <div className="px-4 mt-4 space-y-3">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Calendar size={16} className="text-blue-600" />
              {selectedDay.toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h3>
            {selectedDayExams.length === 0 ? (
              <p className="text-gray-400 text-sm">Inga händelser denna dag.</p>
            ) : (
              selectedDayExams.map(({ exam, isDeadline }) => (
                <button
                  key={`${exam.id}-${isDeadline}`}
                  onClick={() => { setShowingExamDetail(exam.id); setActiveTab('discover'); }}
                  className="w-full bg-white border border-gray-100 rounded-2xl p-4 text-left"
                >
                  <div className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1 mb-2 ${
                    isDeadline ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                  }`}>
                    <Clock size={11} />
                    {isDeadline ? 'Anmälningsstopp' : 'Provdag'}
                  </div>
                  <p className="font-bold text-gray-900 text-sm">{exam.course}</p>
                  <p className="text-gray-500 text-xs mt-0.5 flex items-center gap-1">
                    <MapPin size={11} />
                    {exam.schoolName} · {exam.city}
                  </p>
                </button>
              ))
            )}
          </div>
        )}

        {/* Upcoming events list */}
        {!selectedDay && (
          <div className="px-4 mt-4 space-y-6">
            <div>
              <h3 className="font-bold text-gray-800 mb-3">Kommande händelser</h3>
              {savedExams.length === 0 ? (
                <div className="bg-gray-50 rounded-2xl p-6 text-center">
                  <Calendar size={28} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">Spara prövningar för att se dem i kalendern.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    {savedExams
                      .flatMap(se => {
                        const exam = exams.find(e => e.id === se.examId);
                        if (!exam || !exam.nextPeriod.confirmed) return [];
                        const events: { exam: typeof exam; date: string; type: 'deadline' | 'exam' }[] = [];
                        if (exam.nextPeriod.applicationEnd) events.push({ exam, date: exam.nextPeriod.applicationEnd, type: 'deadline' });
                        if (exam.nextPeriod.examWindowStart) events.push({ exam, date: exam.nextPeriod.examWindowStart, type: 'exam' });
                        return events;
                      })
                      .filter(e => new Date(e.date) >= today)
                      .sort((a, b) => a.date.localeCompare(b.date))
                      .slice(0, 10)
                      .map(({ exam, date, type }) => (
                        <button
                          key={`${exam.id}-${type}`}
                          onClick={() => { setShowingExamDetail(exam.id); setActiveTab('discover'); }}
                          className="w-full bg-white border border-gray-100 rounded-xl p-3 text-left flex items-center gap-3"
                        >
                          <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${
                            type === 'deadline' ? 'bg-red-50' : 'bg-blue-50'
                          }`}>
                            <span className={`text-xs font-bold ${type === 'deadline' ? 'text-red-600' : 'text-blue-600'}`}>
                              {new Date(date).toLocaleDateString('sv-SE', { day: 'numeric' })}
                            </span>
                            <span className={`text-[9px] ${type === 'deadline' ? 'text-red-400' : 'text-blue-400'}`}>
                              {new Date(date).toLocaleDateString('sv-SE', { month: 'short' })}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 text-sm truncate">{exam.course}</p>
                            <p className={`text-xs ${type === 'deadline' ? 'text-red-500' : 'text-blue-500'}`}>
                              {type === 'deadline' ? 'Anmälningsstopp' : 'Provdag'} · {exam.city}
                            </p>
                          </div>
                        </button>
                      ))}
                  </div>
                  {savedExams.every(se => !exams.find(e => e.id === se.examId)?.nextPeriod.confirmed) && (
                    <p className="text-gray-400 text-xs mt-2">
                      Inga av dina sparade prövningar har bekräftade datum ännu — se listan nedan.
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Saved exams without confirmed dates */}
            {savedExams.some(se => !exams.find(e => e.id === se.examId)?.nextPeriod.confirmed) && (
              <div>
                <h3 className="font-bold text-gray-800 mb-3">Väntar på datum från skolan</h3>
                <div className="space-y-2">
                  {savedExams
                    .map(se => exams.find(e => e.id === se.examId))
                    .filter((e): e is NonNullable<typeof e> => !!e && !e.nextPeriod.confirmed)
                    .map(exam => (
                      <button
                        key={exam.id}
                        onClick={() => { setShowingExamDetail(exam.id); setActiveTab('discover'); }}
                        className="w-full bg-white border border-gray-100 rounded-xl p-3 text-left flex items-center gap-3"
                      >
                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                          <Clock size={16} className="text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">{exam.course}</p>
                          <p className="text-xs text-gray-500">{exam.nextPeriod.label} · {exam.city}</p>
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
