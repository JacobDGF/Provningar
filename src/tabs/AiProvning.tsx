import { useEffect, useRef, useState } from 'react';
import { Sparkles, HelpCircle, Loader2, ArrowUp, RotateCcw } from 'lucide-react';
import { useStore } from '../store/useStore';
import { ExamCard } from '../components/ExamCard';
import { answerAsk } from '../lib/askProvningar';
import { askClaude, isAiConfigured } from '../lib/aiProvning';
import {
  carriedSentence,
  followUpSuggestions,
  historyFor,
  makeTurn,
  type AiTurn,
} from '../lib/aiThread';
import { track } from '../lib/analytics';

/**
 * AI-prövning: skriv meningen, få prövningarna — och fråga vidare.
 *
 * Sökrutan i Upptäck tar ett ord. Det folk kommer hit med är en mening — "jag
 * bor i Göteborg och vill höja mitt betyg i Matte 2b innan december" — och den
 * bär fyra villkor som annars ska matas in i fyra olika kontroller, av någon
 * som först måste lista ut att kontrollerna finns.
 *
 * Den andra meningen är den fliken tidigare tappade. Varje fråga lästes för
 * sig, så "visa bara de i Göteborg" var en fråga utan kurs och gav noll träffar
 * — det enda man kunde göra var att skriva om hela meningen igen. Nu läses en
 * uppföljning mot förra svarets tolkning (`answerAsk`), och samtalet följer med
 * till modellen (`askClaude`). Vad appen fyllde i åt användaren står utskrivet,
 * av samma skäl som tolkningen alltid står utskriven.
 *
 * Fortfarande inga bubblor, ingen skrivande-punkt, ingen avatar: frågan står
 * som en rubrik, svaret som ett stycke, och under det ligger vanliga
 * listningskort — samma kort som i resten av appen, med samma färg och samma
 * väg vidare in i anmälan. Ett samtal är vad fliken gör, inte vad den ser ut
 * som. Skrivfältet sitter kvar högst upp när tråden växer, eftersom nästa fråga
 * är det man är här för.
 *
 * Svarsstycket kommer från Claude när sajten har en endpoint konfigurerad
 * (`VITE_AI_ENDPOINT`), och annars — och när anropet faller — från appens egen
 * läsning av meningen. Korten kommer alltid från datan. Se
 * [`lib/aiProvning.ts`](../lib/aiProvning.ts) för varför nyckeln inte kan bo i
 * ett statiskt bygge.
 */

const EXAMPLES = [
  'Jag bor i Göteborg och vill höja mitt betyg i Matte 2b innan december',
  'Var kan jag pröva Engelska 6 i Skåne?',
  'Naturkunskap 1b någonstans i Stockholm, helst snart',
];

export function AiProvning() {
  const { exams, setShowingFaq, aiThread, addAiTurn, setAiAnswer, clearAiThread } = useStore();
  const [draft, setDraft] = useState('');
  const [pendingId, setPendingId] = useState<string | null>(null);
  const inFlight = useRef<AbortController | null>(null);
  const newest = useRef<HTMLElement | null>(null);

  // Abort a model call the user has already moved past — the turn keeps the
  // dataset answer that is on screen, which was never wrong, just plainer.
  useEffect(() => () => inFlight.current?.abort(), []);

  // The transcript grows downwards, so without this the answer to the question
  // you just asked appears below the fold and the tab feels like it did nothing.
  useEffect(() => {
    if (aiThread.length) newest.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [aiThread.length]);

  const ask = async (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || pendingId) return;

    const last = aiThread[aiThread.length - 1];
    const result = answerAsk(trimmed, exams, new Date(), last?.ask);
    const turn = makeTurn(trimmed, result);

    setDraft('');
    addAiTurn(turn);
    // Utfallet, aldrig frågan: antal träffar, om tolkningen bar och om
    // sökningen fick vidgas. En fråga som "jag bor i Göteborg och vill höja
    // Matte 2b" är användarens egen mening och lämnar aldrig enheten.
    track.aiAsked({
      hits: result.matches.length,
      widened: result.widened,
      understood: turn.understood,
    });

    if (!isAiConfigured() || !turn.understood || result.matches.length === 0) return;

    // The dataset answer is already on screen. The model only ever replaces the
    // paragraph above the cards, so a failure here costs the user nothing.
    inFlight.current?.abort();
    const controller = new AbortController();
    inFlight.current = controller;
    setPendingId(turn.id);
    try {
      const answer = await askClaude(trimmed, result.matches, {
        history: historyFor(aiThread),
        signal: controller.signal,
      });
      setAiAnswer(turn.id, answer);
    } catch {
      // Keep the dataset answer, which is already correct.
    } finally {
      if (inFlight.current === controller) inFlight.current = null;
      setPendingId((id) => (id === turn.id ? null : id));
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    void ask(draft);
  };

  const startOver = () => {
    inFlight.current?.abort();
    inFlight.current = null;
    setPendingId(null);
    clearAiThread();
    setDraft('');
  };

  const started = aiThread.length > 0;
  const latest = aiThread[aiThread.length - 1];
  const suggestions = latest ? followUpSuggestions(latest, isAiConfigured()) : [];

  return (
    <div className="flex flex-col h-full bg-cream">
      <div className="lg:hidden flex-shrink-0 z-30 bg-cream/95 backdrop-blur-sm border-b border-line px-4 py-2 flex items-center justify-between">
        <span className="font-display text-lg font-semibold text-ink">AI-prövning</span>
        <button
          onClick={() => setShowingFaq(true)}
          aria-label="Vanliga frågor"
          className="w-9 h-9 rounded-xl bg-violet-tint flex items-center justify-center"
        >
          <HelpCircle size={17} className="text-violet-ink" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-screen-md mx-auto w-full px-4 lg:px-8 flex flex-col animate-rise-in pb-28 lg:pb-10">
          {!started && (
            <div className="pt-6 lg:pt-8">
              <h1 className="font-hero-xl text-[38px] sm:text-[48px] lg:text-[56px] leading-none text-ink">
                Fråga om din prövning
              </h1>
              <p className="font-display italic text-[17px] sm:text-[20px] text-ink-soft mt-2">
                Skriv med egna ord, och fråga vidare på svaret. Allt bygger på appens {exams.length}{' '}
                kontrollerade prövningar — aldrig på ett gissat datum.
              </p>
            </div>
          )}

          {/* Pinned rather than scrolling away with the first question: once
              there is a thread, the next question is the whole point of the
              screen, and a composer you have to scroll back up to find is a
              conversation that ends after one turn. */}
          <div className="sticky top-0 z-20 bg-cream pt-4 pb-3 -mx-4 px-4 lg:-mx-8 lg:px-8">
            <form onSubmit={submit} className="flex flex-col gap-3">
              <div className="focus-ring-host flex items-end gap-2 bg-lapis-tint border-2 border-lapis-ink rounded-[26px] pl-5 pr-2 py-2">
                {/* Pinned to the first line rather than to the field's baseline:
                    the field is two rows tall, and an icon that floats down beside
                    the second row reads as decoration instead of as a label. */}
                <Sparkles
                  size={19}
                  strokeWidth={2.2}
                  className="text-lapis-ink flex-shrink-0 self-start mt-3.5"
                />
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void ask(draft);
                    }
                  }}
                  rows={2}
                  placeholder={
                    started
                      ? 'Följ upp, t.ex. visa bara de i Göteborg'
                      : 'T.ex. Matte 2b i Göteborg'
                  }
                  aria-label={started ? 'Din följdfråga' : 'Din fråga'}
                  className="flex-1 min-w-0 resize-none bg-transparent border-0 outline-none text-[16.5px] font-semibold text-lapis-ink placeholder-lapis-ink/45 py-2.5"
                />
                <button
                  type="submit"
                  disabled={!draft.trim() || pendingId !== null}
                  aria-label={started ? 'Följ upp' : 'Fråga'}
                  className="w-11 h-11 mb-0.5 rounded-[17px] bg-lapis-ink text-white flex items-center justify-center flex-shrink-0 transition-opacity disabled:opacity-30 active:scale-95"
                >
                  {pendingId !== null ? (
                    <Loader2 size={19} className="animate-spin" />
                  ) : (
                    <ArrowUp size={20} strokeWidth={2.4} />
                  )}
                </button>
              </div>

              {!started && (
                <div className="flex flex-col gap-2 pt-1">
                  <p className="text-[11.5px] font-bold uppercase tracking-[.09em] text-ink-faint px-1">
                    Prova att fråga
                  </p>
                  {EXAMPLES.map((example) => (
                    <button
                      key={example}
                      type="button"
                      onClick={() => void ask(example)}
                      className="text-left text-[14.5px] leading-snug text-lapis-ink underline decoration-lapis-ink/25 underline-offset-4 px-1 active:opacity-60"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              )}
            </form>

            {started && (
              <div className="flex items-center justify-between gap-3 pt-2.5">
                <p className="text-[12.5px] text-ink-faint">
                  {aiThread.length === 1 ? '1 fråga' : `${aiThread.length} frågor`} i det här
                  samtalet. Uppföljningar läses mot den förra.
                </p>
                <button
                  type="button"
                  onClick={startOver}
                  className="flex items-center gap-1.5 text-[13px] font-semibold text-ink-soft active:opacity-60 flex-shrink-0"
                >
                  <RotateCcw size={14} strokeWidth={2.3} />
                  Nytt samtal
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-6 pt-2">
            {aiThread.map((turn, i) => (
              <Turn
                key={turn.id}
                turn={turn}
                pending={pendingId === turn.id}
                ref={i === aiThread.length - 1 ? newest : null}
              />
            ))}
          </div>

          {suggestions.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-5">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => void ask(suggestion)}
                  disabled={pendingId !== null}
                  className="text-[13.5px] font-semibold text-lapis-ink bg-lapis-tint border border-lapis-ink/25 rounded-full px-3.5 py-2 active:scale-95 transition-transform disabled:opacity-40"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * One exchange: the question as a heading, the answer as a paragraph, the
 * listings as the same cards the rest of the app uses.
 *
 * `scroll-mt-40` is what keeps the pinned composer from covering the turn it
 * just scrolled into view.
 */
function Turn({
  turn,
  pending,
  ref,
}: {
  turn: AiTurn;
  pending: boolean;
  ref: React.Ref<HTMLElement>;
}) {
  const carried = carriedSentence(turn);

  return (
    <section ref={ref} className="flex flex-col gap-4 scroll-mt-40">
      <div className="border-t border-line pt-5">
        <p className="font-display text-[19px] sm:text-[22px] leading-snug text-ink">
          {turn.question}
        </p>
        <p className="text-[15px] leading-relaxed text-ink-soft mt-2.5">{turn.answer}</p>
        {carried && !turn.answer.includes(carried) && (
          <p className="text-[13px] text-ink-faint mt-1.5 italic">{carried}</p>
        )}
        {pending && (
          <p className="flex items-center gap-2 text-[12.5px] text-ink-faint mt-2">
            <Loader2 size={13} className="animate-spin" />
            Formulerar svaret…
          </p>
        )}
        {turn.fromModel && (
          <p className="text-[12px] text-ink-faint mt-2">
            Svaret är formulerat av Claude ur listningarna nedan. Datum och avgifter gäller bara som
            de står hos anordnaren.
          </p>
        )}
      </div>

      {turn.matches.length > 0 && (
        <div className="grid gap-3.5 sm:grid-cols-2">
          {turn.matches.slice(0, 12).map((exam) => (
            <ExamCard key={exam.id} exam={exam} />
          ))}
        </div>
      )}

      {turn.matches.length > 12 && (
        <p className="text-[13.5px] text-ink-faint">
          Visar 12 av {turn.matches.length} träffar. Smalna av frågan med en kurs eller en kommun.
        </p>
      )}
    </section>
  );
}
