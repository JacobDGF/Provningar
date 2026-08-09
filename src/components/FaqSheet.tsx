import { X, HelpCircle, ChevronDown, ExternalLink, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

interface FaqItem {
  q: string;
  a: React.ReactNode;
}

const FAQ: FaqItem[] = [
  {
    q: 'Vad är en prövning?',
    a: 'En prövning innebär att du läser in en hel gymnasiekurs på egen hand och sedan gör ett prov för att få betyg i kursen – utan att gå själva kursen. Provet är oftast skriftligt och kan även innehålla muntliga eller laborativa moment beroende på ämne.',
  },
  {
    q: 'Vad kostar en prövning?',
    a: (
      <>
        Avgiften är lagstadgad och kostar <strong>500 kr</strong> per prövning hos alla anordnare,
        enligt Förordning (1991:1124) om avgifter för prövning inom skolväsendet. Har du sedan
        tidigare betyget <strong>F</strong> i kursen är prövningen <strong>kostnadsfri</strong>.
      </>
    ),
  },
  {
    q: 'Hur anmäler jag mig?',
    a: 'Du anmäler dig direkt hos skolan/anordnaren. På varje prövning i appen finns en knapp som tar dig till anordnarens egen anmälningssida. Där betalar du avgiften och får sedan en kallelse med tid och plats. Vi hittar aldrig på egna datum – vi länkar alltid till källan.',
  },
  {
    q: 'Räknas ett prövningsbetyg vid antagning?',
    a: 'Ja. Ett prövningsbetyg är ett fullvärdigt gymnasiebetyg och används i ditt meritvärde vid antagning till högskola och universitet via antagning.se, precis som vanliga kursbetyg.',
  },
  {
    q: 'Kan jag höja ett betyg jag redan har?',
    a: 'Ja, du kan göra prövning även om du redan har ett godkänt betyg (E–A) för att försöka höja det. Då gäller avgiften på 500 kr. Kontrollera med anordnaren hur det nya betyget hanteras i ditt fall.',
  },
  {
    q: 'Vilka kurser kan jag pröva?',
    a: (
      <>
        Gymnasiekurser. Observera att de gamla kurskoderna (Gy11, t.ex. <em>MATMAT02b</em>) gäller
        för prövning till och med <strong>30 juni 2030</strong>. Därefter gäller de nya
        Gy25-kurserna. Vi uppdaterar uppgifterna löpande.
      </>
    ),
  },
  {
    q: 'Hur lång tid tar en prövning?',
    a: 'Det varierar mellan anordnare. Många har bestämda prövningsperioder några gånger per termin, medan andra har mer löpande tillfällen. Du ser aktuella datum på anordnarens sida via länken i appen.',
  },
  {
    q: 'Hur pluggar jag bäst inför en prövning?',
    a: 'Utgå från kursens centrala innehåll och kunskapskrav, och öva på gamla nationella prov från Skolverket. Varje prövning i appen har egna studietips och en lista över provmomenten så att du vet exakt vad som testas.',
  },
];

function FaqRow({ item, open, onToggle }: { item: FaqItem; open: boolean; onToggle: () => void }) {
  return (
    <div className="bg-surface border border-line rounded-md overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 p-4 text-left"
      >
        <span className="font-bold text-ink text-sm">{item.q}</span>
        <ChevronDown
          size={18}
          className={`text-ink-faint flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="px-4 pb-4 -mt-1">
          <p className="text-ink-soft text-sm leading-relaxed">{item.a}</p>
        </div>
      )}
    </div>
  );
}

export function FaqSheet({ onClose }: { onClose: () => void }) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    // Backdrop closes on click as a mouse convenience; the sheet has its own
    // keyboard-reachable close button below, so this isn't the only way out.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end lg:items-center lg:justify-center"
      onClick={onClose}
    >
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events -- stops the backdrop's close-on-click from firing when interacting with the sheet itself */}
      <div
        className="bg-cream w-full lg:max-w-xl max-h-[90vh] lg:max-h-[80vh] rounded-t-lg lg:rounded-lg overflow-hidden flex flex-col animate-sheet-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-surface px-5 pt-5 pb-4 border-b border-line flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-brand-500 rounded-md flex items-center justify-center">
              <HelpCircle size={20} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-ink font-display">Vanliga frågor</h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 bg-sand rounded-full flex items-center justify-center active:scale-90 hover:bg-line transition-colors"
          >
            <X size={18} className="text-ink-soft" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-4 space-y-2.5">
          {FAQ.map((item, i) => (
            <FaqRow
              key={i}
              item={item}
              open={openIdx === i}
              onToggle={() => setOpenIdx(openIdx === i ? null : i)}
            />
          ))}

          {/* Trust footer */}
          <div className="bg-trust-50 border border-trust-100 rounded-md p-4 flex items-start gap-2.5 mt-4">
            <ShieldCheck size={18} className="text-trust-600 flex-shrink-0 mt-0.5" />
            <p className="text-trust-700 text-xs leading-relaxed">
              Uppgifterna bygger på gällande regler från Skolverket och varje anordnares egen
              webbplats. För officiell information, se{' '}
              <a
                href="https://www.skolverket.se/regler-och-ansvar/ansvar-i-skolfragor/provning-for-betyg"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold underline inline-flex items-center gap-0.5"
              >
                Skolverket <ExternalLink size={10} />
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
