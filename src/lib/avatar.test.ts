import { describe, it, expect } from 'vitest';
import { isOwnPhoto, initialsOf, monogramInk } from './avatar';
import { INITIAL_POSTS } from '../data/community';

describe('isOwnPhoto', () => {
  it('accepts a photo taken or picked on this device', () => {
    expect(isOwnPhoto('data:image/jpeg;base64,/9j/4AAQ')).toBe(true);
    expect(isOwnPhoto('blob:http://localhost:5173/abc-123')).toBe(true);
  });

  it('refuses stock portrait services', () => {
    expect(isOwnPhoto('https://i.pravatar.cc/150?img=47')).toBe(false);
    expect(isOwnPhoto('https://randomuser.me/api/portraits/women/1.jpg')).toBe(false);
  });

  it('refuses remote URLs in general, not just the ones we used to ship', () => {
    expect(isOwnPhoto('https://example.com/face.jpg')).toBe(false);
    expect(isOwnPhoto('http://example.com/face.jpg')).toBe(false);
    expect(isOwnPhoto('//example.com/face.jpg')).toBe(false);
  });

  it('refuses a data URL that is not an image', () => {
    expect(isOwnPhoto('data:text/html,<script>alert(1)</script>')).toBe(false);
  });

  it('treats missing values as no photo', () => {
    expect(isOwnPhoto('')).toBe(false);
    expect(isOwnPhoto(undefined)).toBe(false);
    expect(isOwnPhoto(null)).toBe(false);
  });
});

describe('initialsOf', () => {
  it('takes the first and last name', () => {
    expect(initialsOf('Emma Lindqvist')).toBe('EL');
    expect(initialsOf('Karin Anna Svensson')).toBe('KS');
  });

  it('takes two letters from a single name', () => {
    expect(initialsOf('Du')).toBe('DU');
  });

  it('handles hyphenated and punctuated names', () => {
    expect(initialsOf('Anna-Lena Öberg')).toBe('AÖ');
    expect(initialsOf('  Måns   Åkesson ')).toBe('MÅ');
  });

  it('falls back rather than rendering an empty circle', () => {
    expect(initialsOf('')).toBe('?');
    expect(initialsOf('   ')).toBe('?');
    expect(initialsOf('🎉')).toBe('?');
  });
});

describe('monogramInk', () => {
  it('is stable for the same identity', () => {
    expect(monogramInk('u2')).toEqual(monogramInk('u2'));
  });

  it('returns a usable gradient pair', () => {
    const [from, to] = monogramInk('u7');
    expect(from).toMatch(/^#[0-9A-F]{6}$/i);
    expect(to).toMatch(/^#[0-9A-F]{6}$/i);
  });
});

describe('the seeded community', () => {
  it('ships no profile photographs at all', () => {
    for (const post of INITIAL_POSTS) {
      expect(post.userAvatar, post.id).toBeUndefined();
      for (const reply of post.replies) expect(reply.userAvatar, reply.id).toBeUndefined();
    }
  });
});
