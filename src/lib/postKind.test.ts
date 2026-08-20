import { describe, it, expect } from 'vitest';
import { Post } from '../types';
import {
  POST_KIND_TONES,
  POST_KIND_ORDER,
  postKindOf,
  postKindTone,
  countByKind,
} from './postKind';

function makePost(overrides: Partial<Post>): Post {
  return {
    id: 'x',
    userId: 'u1',
    userName: 'Test',
    content: 'text',
    createdAt: '2026-01-01T00:00:00Z',
    likes: 0,
    likedBy: [],
    replies: [],
    tags: [],
    ...overrides,
  };
}

describe('postKind tones', () => {
  it('gives every kind its own distinct rail colour', () => {
    const rails = POST_KIND_ORDER.map((k) => POST_KIND_TONES[k].rail);
    expect(new Set(rails).size).toBe(rails.length);
  });

  it('orders questions first and wins last', () => {
    expect(POST_KIND_ORDER[0]).toBe('fråga');
    expect(POST_KIND_ORDER[POST_KIND_ORDER.length - 1]).toBe('seger');
  });

  it('never spends the exam status red on a post — colours are kept apart', () => {
    for (const k of POST_KIND_ORDER) {
      expect(POST_KIND_TONES[k].rail).not.toContain('red');
      expect(POST_KIND_TONES[k].chip).not.toContain('red');
    }
  });
});

describe('postKindOf', () => {
  it('reads the post’s own kind when it has one', () => {
    expect(postKindOf(makePost({ kind: 'seger' }))).toBe('seger');
  });

  it('files a kindless post as a discussion, never as a question or a win', () => {
    expect(postKindOf(makePost({ kind: undefined }))).toBe('diskussion');
  });

  it('resolves a tone for every post, kindless included', () => {
    expect(postKindTone(makePost({ kind: undefined })).key).toBe('diskussion');
    expect(postKindTone(makePost({ kind: 'tips' })).key).toBe('tips');
  });
});

describe('countByKind', () => {
  it('counts each kind, folding kindless posts into diskussion', () => {
    const counts = countByKind([
      makePost({ kind: 'fråga' }),
      makePost({ kind: 'fråga' }),
      makePost({ kind: 'tips' }),
      makePost({ kind: undefined }),
      makePost({ kind: 'diskussion' }),
    ]);
    expect(counts).toEqual({ fråga: 2, tips: 1, diskussion: 2, seger: 0 });
  });

  it('sums to the number of posts', () => {
    const posts = [
      makePost({ kind: 'seger' }),
      makePost({ kind: undefined }),
      makePost({ kind: 'tips' }),
    ];
    const counts = countByKind(posts);
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    expect(total).toBe(posts.length);
  });
});
