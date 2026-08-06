import { useEffect, useState } from 'react';
import { CalendarPlus, Check } from 'lucide-react';
import { Exam } from '../types';
import { useStore } from '../store/useStore';
import { downloadExamIcs } from '../lib/calendar';

interface ReminderButtonProps {
  exam: Exam;
  /** 'full' renders a labelled button; 'icon' a square icon-only one for tight rows. */
  variant?: 'full' | 'icon';
  className?: string;
}

/**
 * "Påminn mig" — saves the exam and downloads a calendar reminder for its
 * application deadline. The deadline is the thing students actually miss, and
 * this puts it in the calendar they already look at.
 */
export function ReminderButton({ exam, variant = 'full', className = '' }: ReminderButtonProps) {
  const { saveExam } = useStore();
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setDone(false), 2600);
    return () => clearTimeout(t);
  }, [done]);

  // Nothing honest to put in a calendar without confirmed dates.
  if (!exam.nextPeriod.confirmed) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (downloadExamIcs(exam)) {
      saveExam(exam.id);
      setDone(true);
    }
  };

  const label = done ? 'Tillagd i kalendern' : 'Påminn mig';

  if (variant === 'icon') {
    return (
      <button
        onClick={handleClick}
        aria-label={label}
        title={label}
        className={`w-10 h-10 rounded flex items-center justify-center border transition-colors flex-shrink-0 ${
          done
            ? 'bg-trust-50 border-trust-100 text-trust-700'
            : 'bg-surface border-line text-ink-soft hover:bg-sand hover:text-ink'
        } ${className}`}
      >
        {done ? <Check size={16} /> : <CalendarPlus size={16} />}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`flex items-center justify-center gap-2 text-sm font-semibold py-3 px-3 rounded border transition-colors active:scale-98 ${
        done
          ? 'bg-trust-50 border-trust-100 text-trust-700'
          : 'bg-surface border-line text-ink hover:bg-sand'
      } ${className}`}
    >
      {done ? <Check size={15} /> : <CalendarPlus size={15} />}
      {label}
    </button>
  );
}
