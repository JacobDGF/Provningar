import { Exam } from '../types';

/**
 * The optional half of AI-prövning: letting a model phrase the answer.
 *
 * The app is a static site with no server, so it cannot hold an API key —
 * anything shipped in the bundle is public, and an Anthropic key in a public
 * bundle is somebody else's bill. The request built here is therefore the
 * Messages API's own shape, sent to whatever endpoint `VITE_AI_ENDPOINT` names:
 * a proxy the site's owner runs, which adds the key and forwards to
 * `https://api.anthropic.com/v1/messages`. With the variable unset — which is
 * how the published site is built — nothing is called and the tab answers from
 * the dataset alone.
 *
 * Two rules hold whether or not a model is in the loop, and they are the reason
 * the model is given a shortlist rather than a question:
 *
 * - Every fact it may state is in the JSON it is handed. It is told, in as many
 *   words, never to guess a datum or an avgift, and to send the user to the
 *   provider's own page for anything that isn't there.
 * - The listings under the answer come from `answerAsk`, not from the model.
 *   A sentence can be wrong; a card links to the anmälan it names.
 *
 * The Messages API is stateless, so a conversation is the whole exchange sent
 * again each turn: the earlier questions and answers as alternating user and
 * assistant messages, and the current question last. Only that last message
 * carries a shortlist. Re-sending every turn's JSON would grow the request
 * without bound and, worse, put three different "current" lists in front of the
 * model at once — so the system prompt says in as many words that the list in
 * the last message is the only live one.
 */

const ENDPOINT: string | undefined = import.meta.env.VITE_AI_ENDPOINT;

/** As specified for this app: Sonnet, and a short answer. */
const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 1000;

/** How many listings are worth putting in front of the model. */
const SHORTLIST = 12;

/**
 * How many earlier exchanges travel with a question.
 *
 * Six is enough for the follow-ups people actually string together ("visa bara
 * de i Göteborg", "och innan december?", "vad kostar den första?") and short
 * enough that the request stays a request. The app's own reading has no such
 * window — it carries the constraints forward regardless, so a long
 * conversation loses the model's memory of the wording, never the filter.
 */
const HISTORY_TURNS = 6;

const SYSTEM = [
  'Du är studievägledare i appen Prövningar, som samlar Sveriges betygsprövningar.',
  'Du får en fråga från en elev och en lista med prövningar ur appens egen databas.',
  'Det här är en pågående chatt: eleven kan följa upp på det ni redan sagt, och',
  '"visa bara de i Göteborg" efter en fråga om Matematik 2b betyder Matematik 2b',
  'i Göteborg.',
  '',
  'Regler:',
  '- Använd bara uppgifter som står i listan. Hitta aldrig på datum, avgifter,',
  '  kurskoder eller skolor.',
  '- Bara listan i det SENASTE meddelandet är aktuell. Listor längre upp i',
  '  samtalet är utbytta mot den — svara aldrig utifrån dem, och påstå inte att',
  '  en prövning finns kvar bara för att den nämndes tidigare.',
  '- Om något inte står i listan: säg att det inte står, och hänvisa till',
  '  anordnarens egen sida (fältet kalla_url).',
  '- En prövning där "datum_bekraftat" är false har inga publicerade datum.',
  '  Påstå aldrig när den går att söka — länka vidare i stället.',
  '- Svara på svenska, i högst fem meningar, utan rubriker och punktlistor.',
  '- Eleven ser korten med prövningarna under ditt svar. Räkna inte upp dem —',
  '  säg vad som skiljer dem åt och vilken deadline som är närmast.',
].join('\n');

/** The listing as the model is allowed to see it: facts, and where they came from. */
function forModel(exam: Exam) {
  const p = exam.nextPeriod;
  return {
    id: exam.id,
    skola: exam.schoolName,
    kommun: exam.city,
    lan: exam.region,
    kurs: exam.course,
    kurskod: exam.courseCode,
    avgift_sek: exam.price,
    avgift_villkor: exam.priceNote ?? null,
    datum_bekraftat: p.confirmed,
    anmalan_oppnar: p.applicationStart ?? null,
    sista_anmalan: p.applicationEnd ?? null,
    provperiod_start: p.examWindowStart ?? null,
    provperiod_slut: p.examWindowEnd ?? null,
    fullbokat: p.full === true,
    period: p.label,
    kalla_url: exam.infoUrl,
    anmalan_url: exam.registrationUrl,
  };
}

export function isAiConfigured(): boolean {
  return typeof ENDPOINT === 'string' && ENDPOINT.trim() !== '';
}

/** One finished exchange, as the conversation is replayed to the model. */
export interface ChatTurn {
  question: string;
  answer: string;
}

/**
 * A Messages API message.
 *
 * Declared here rather than imported: the app deliberately does not depend on
 * `@anthropic-ai/sdk`. The bundle is a static site served to the browser, and
 * the SDK's job is to hold a key and talk to `api.anthropic.com` — which is
 * exactly the thing that must not happen from here. What goes over the wire is
 * the API's own request shape, sent to the owner's proxy.
 */
interface AiMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * The conversation as the model receives it.
 *
 * Exported for its test: the shape is easy to get subtly wrong — a dropped
 * assistant turn, two user messages in a row, a stale shortlist left in an
 * earlier message — and every one of those failures looks like the model simply
 * answering badly.
 */
export function buildMessages(
  question: string,
  shortlist: Exam[],
  history: ChatTurn[] = [],
): AiMessage[] {
  const messages: AiMessage[] = [];
  for (const turn of history.slice(-HISTORY_TURNS)) {
    // An exchange with a missing half would put two user messages next to each
    // other and silently re-attribute the question. Skip it whole instead.
    if (!turn.question.trim() || !turn.answer.trim()) continue;
    messages.push({ role: 'user', content: turn.question });
    messages.push({ role: 'assistant', content: turn.answer });
  }

  const context = JSON.stringify(shortlist.slice(0, SHORTLIST).map(forModel));
  messages.push({
    role: 'user',
    content: `Elevens fråga: ${question}\n\nPrövningar ur databasen just nu:\n${context}`,
  });
  return messages;
}

/**
 * Ask the model to phrase an answer over `shortlist`, in the context of
 * `options.history`.
 *
 * Throws for every failure there is — unconfigured, offline, non-2xx, a body
 * that isn't a Messages response. The caller has a complete answer without it,
 * so there is nothing to degrade gracefully into here: the throw *is* the
 * fallback.
 */
export async function askClaude(
  question: string,
  shortlist: Exam[],
  options: { history?: ChatTurn[]; signal?: AbortSignal } = {},
): Promise<string> {
  if (!ENDPOINT) throw new Error('Ingen AI-endpoint konfigurerad');

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: options.signal,
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM,
      messages: buildMessages(question, shortlist, options.history),
    }),
  });

  if (!response.ok) throw new Error(`AI-tjänsten svarade ${response.status}`);

  const body: unknown = await response.json();
  const blocks = (body as { content?: unknown }).content;
  if (!Array.isArray(blocks)) throw new Error('Oväntat svar från AI-tjänsten');

  const text = blocks
    .filter(
      (block): block is { type: 'text'; text: string } =>
        typeof block === 'object' &&
        block !== null &&
        (block as { type?: unknown }).type === 'text' &&
        typeof (block as { text?: unknown }).text === 'string',
    )
    .map((block) => block.text)
    .join('\n')
    .trim();

  if (!text) throw new Error('Tomt svar från AI-tjänsten');
  return text;
}
