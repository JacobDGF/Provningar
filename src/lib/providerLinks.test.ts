import { describe, it, expect } from 'vitest';
import { getProviderLinks } from './providerLinks';
import { EXAMS } from '../data/exams';
import { Exam } from '../types';

const base = EXAMS[0];
const withUrls = (registrationUrl: string, infoUrl: string): Exam => ({
  ...base,
  registrationUrl,
  infoUrl,
});

describe('getProviderLinks', () => {
  it('offers the info page as the alternative when it differs from the booking', () => {
    const links = getProviderLinks(
      withUrls('https://stockholm.alvis.se/provning/amnesomrade', 'https://exempel.se/provning/'),
    );
    expect(links.booking).toBe('https://stockholm.alvis.se/provning/amnesomrade');
    expect(links.site).toBe('https://exempel.se/provning/');
    expect(links.siteIsHomepage).toBe(false);
    expect(links.hasAlternative).toBe(true);
  });

  it('falls back to the homepage when the booking link *is* the info page', () => {
    const links = getProviderLinks(
      withUrls('https://exempel.se/provning/anmalan/', 'https://exempel.se/provning/anmalan/'),
    );
    expect(links.site).toBe('https://exempel.se/');
    expect(links.siteIsHomepage).toBe(true);
    expect(links.hasAlternative).toBe(true);
  });

  it('derives the homepage from the provider, never from a shared booking platform', () => {
    // The point of the second button: a user who wants to do it themselves is
    // looking for the school, not for alvis.se.
    const links = getProviderLinks(
      withUrls('https://stockholm.alvis.se/provning/amnesomrade', 'https://exempel.se/provning/'),
    );
    expect(links.siteLabel).toBe('exempel.se');
  });

  it('strips www from the label so the button caption stays readable', () => {
    const links = getProviderLinks(
      withUrls('https://shop.exempel.se/kurs/1', 'https://www.exempel.se/provning'),
    );
    expect(links.siteLabel).toBe('exempel.se');
  });

  it('reports no alternative rather than pointing the second button at the first', () => {
    const links = getProviderLinks(withUrls('https://exempel.se/', 'https://exempel.se/'));
    expect(links.hasAlternative).toBe(false);
  });

  it('survives a malformed URL without throwing', () => {
    const links = getProviderLinks(withUrls('inte-en-url', 'inte-heller'));
    expect(links.hasAlternative).toBe(false);
    expect(links.siteLabel).toBe('');
  });

  describe('over the whole dataset', () => {
    it('gives every listing a booking destination', () => {
      for (const exam of EXAMS) {
        expect(getProviderLinks(exam).booking, exam.id).toMatch(/^https:\/\//);
      }
    });

    it('never sends the alternative button to the same place as the primary', () => {
      for (const exam of EXAMS) {
        const links = getProviderLinks(exam);
        if (links.hasAlternative) expect(links.site, exam.id).not.toBe(links.booking);
      }
    });

    it('always has an alternative to offer — every listing has a real site', () => {
      for (const exam of EXAMS) {
        expect(getProviderLinks(exam).hasAlternative, exam.id).toBe(true);
      }
    });
  });
});
