import { describe, it, expect, afterEach, vi } from 'vitest';
import { EXAMS } from '../data/exams';
import { buildMessages, type ChatTurn } from './aiProvning';

/**
 * The request shape, and the two promises that do not depend on the model
 * answering well.
 *
 * Nothing here calls Anthropic. What is worth pinning is the part that fails
 * silently: a conversation replayed with a half-turn dropped, an old shortlist
 * left sitting in an earlier message, or a request going out at all in a build
 * with no endpoint configured. Each of those looks exactly like a model giving
 * a poor answer, which is the one bug report nobody can act on.
 */

const SHORTLIST = EXAMS.slice(0, 3);

function texts(messages: { content: string }[]): string[] {
  return messages.map((m) => m.content);
}

describe('buildMessages', () => {
  it('sends a lone question as a single user message', () => {
    const messages = buildMessages('Matte 2b i Göteborg', SHORTLIST);
    expect(messages).toHaveLength(1);
    expect(messages[0].role).toBe('user');
    expect(messages[0].content).toContain('Matte 2b i Göteborg');
  });

  it('replays the conversation as alternating user and assistant turns', () => {
    const history: ChatTurn[] = [
      { question: 'Matte 2b', answer: 'Det finns 14 prövningar i Matematik 2b.' },
      { question: 'visa bara de i Göteborg', answer: 'Två av dem ligger i Göteborg.' },
    ];
    const messages = buildMessages('hinner jag innan december?', SHORTLIST, history);

    expect(messages.map((m) => m.role)).toEqual(['user', 'assistant', 'user', 'assistant', 'user']);
    expect(texts(messages)[0]).toBe('Matte 2b');
    expect(texts(messages)[1]).toBe('Det finns 14 prövningar i Matematik 2b.');
    expect(texts(messages)[4]).toContain('hinner jag innan december?');
  });

  /**
   * The whole reason the history carries no JSON. Three "current" lists in one
   * request is how the model comes to recommend a round that was filtered out
   * two questions ago.
   */
  it('puts the shortlist only in the last message', () => {
    const history: ChatTurn[] = [{ question: 'Matte 2b', answer: 'Fjorton träffar.' }];
    const messages = buildMessages('och i Göteborg?', SHORTLIST, history);
    const withData = messages.filter((m) => m.content.includes('"kurskod"'));
    expect(withData).toHaveLength(1);
    expect(withData[0]).toBe(messages[messages.length - 1]);
  });

  it('drops a half-finished exchange rather than misattributing it', () => {
    // A turn still waiting for its answer would otherwise put two user messages
    // next to each other, and the API would read them as one question.
    const history: ChatTurn[] = [
      { question: 'Matte 2b', answer: 'Fjorton träffar.' },
      { question: 'och i Göteborg?', answer: '' },
    ];
    const messages = buildMessages('vad kostar de?', SHORTLIST, history);
    expect(messages.map((m) => m.role)).toEqual(['user', 'assistant', 'user']);
  });

  it('keeps the request bounded on a long conversation', () => {
    const history: ChatTurn[] = Array.from({ length: 20 }, (_, i) => ({
      question: `fråga ${i}`,
      answer: `svar ${i}`,
    }));
    const messages = buildMessages('och nu?', SHORTLIST, history);
    // Six exchanges plus the question being asked.
    expect(messages).toHaveLength(13);
    expect(messages[0].content).toBe('fråga 14');
  });

  it('never leaves an empty message for the API to reject', () => {
    const messages = buildMessages('Matte 2b', SHORTLIST, [{ question: '   ', answer: '   ' }]);
    for (const m of messages) expect(m.content.trim()).not.toBe('');
  });

  it('hands the model the provider’s own source url for every listing', () => {
    const [body] = buildMessages('Matte 2b', SHORTLIST);
    const sent: unknown = JSON.parse(body.content.slice(body.content.indexOf('[')));
    expect(Array.isArray(sent)).toBe(true);
    for (const row of sent as { kalla_url: string }[]) {
      expect(row.kalla_url).toMatch(/^https?:\/\//);
    }
  });
});

/** Restarts the module with (or without) an endpoint in the build. */
async function boot(endpoint?: string) {
  vi.resetModules();
  vi.stubEnv('VITE_AI_ENDPOINT', endpoint ?? '');
  return import('./aiProvning');
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  vi.resetModules();
});

describe('askClaude', () => {
  it('makes no request at all in a build with no endpoint', async () => {
    const { askClaude, isAiConfigured } = await boot();
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    expect(isAiConfigured()).toBe(false);
    await expect(askClaude('Matte 2b', SHORTLIST)).rejects.toThrow(/endpoint/i);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('posts the conversation to the configured endpoint', async () => {
    const { askClaude } = await boot('https://proxy.test/ai');
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ content: [{ type: 'text', text: 'Två i Göteborg.' }] }), {
        status: 200,
      }),
    );

    const answer = await askClaude('visa bara de i Göteborg', SHORTLIST, {
      history: [{ question: 'Matte 2b', answer: 'Fjorton träffar.' }],
    });

    expect(answer).toBe('Två i Göteborg.');
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe('https://proxy.test/ai');
    const body = JSON.parse(String((init as RequestInit).body)) as {
      messages: { role: string }[];
      system: string;
    };
    expect(body.messages.map((m) => m.role)).toEqual(['user', 'assistant', 'user']);
    // The rule the multi-turn request depends on being stated.
    expect(body.system).toContain('SENASTE');
  });

  it('throws — rather than inventing prose — when the service fails', async () => {
    const { askClaude } = await boot('https://proxy.test/ai');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('nope', { status: 502 }));
    await expect(askClaude('Matte 2b', SHORTLIST)).rejects.toThrow(/502/);
  });

  it('throws on a body that is not a Messages response', async () => {
    const { askClaude } = await boot('https://proxy.test/ai');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ hello: 'world' }), { status: 200 }),
    );
    await expect(askClaude('Matte 2b', SHORTLIST)).rejects.toThrow(/Oväntat svar/);
  });
});
