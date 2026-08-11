import { Exam } from '../types';

/**
 * The two ways out of a listing.
 *
 * Every listing links to somebody else's system, and users arrive wanting one
 * of two different things. Most want the shortest path to a booked seat — that
 * is `booking`, the deep link the dataset verifies. But some want to read the
 * provider's own page first and do the whole thing themselves: check the terms,
 * find a phone number, compare courses. Sending that second group through the
 * booking deep link drops them mid-flow on a form with no context, so they get
 * their own destination — `site` — instead of a back button.
 *
 * `site` prefers the provider's own prövningssida when the dataset has one that
 * differs from the booking link. When the two are the same URL, the page *is*
 * the booking, so the alternative becomes the provider's homepage — the place
 * you'd start from if you wanted to navigate there yourself.
 */

export interface ProviderLinks {
  /** Deep link to the booking, as verified against the provider's own site. */
  booking: string;
  /** Where to start if you'd rather find your own way — info page or homepage. */
  site: string;
  /** True when `site` is a bare homepage rather than a page about the prövning. */
  siteIsHomepage: boolean;
  /** Host of `site`, without `www.` — shown under the button so the user knows where they land. */
  siteLabel: string;
  /** False when the dataset only has one usable destination; hide the second button. */
  hasAlternative: boolean;
}

/** `https://x.se/a/b?c` → `https://x.se/`. Returns '' for anything unparseable. */
function homepageOf(url: string): string {
  try {
    return new URL(url).origin + '/';
  } catch {
    return '';
  }
}

function hostLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

/** A destination we're willing to put behind a button. */
function isUsable(url: string): boolean {
  try {
    return /^https?:$/.test(new URL(url).protocol);
  } catch {
    return false;
  }
}

export function getProviderLinks(exam: Exam): ProviderLinks {
  const booking = exam.registrationUrl;
  const infoDiffers = exam.infoUrl !== '' && exam.infoUrl !== booking;
  const homepage = homepageOf(exam.infoUrl || booking);

  // The info page beats a bare homepage when we have one. Falling back to the
  // homepage of the booking link would be wrong for the ~40 listings whose
  // booking sits on a shared platform (alvis.se, a webshop): the user asked for
  // *the school's* site, not the platform's front door — so derive the homepage
  // from infoUrl, which always points at the provider itself.
  const site = infoDiffers ? exam.infoUrl : homepage;
  const siteIsHomepage = !infoDiffers;

  return {
    booking,
    site,
    siteIsHomepage,
    siteLabel: hostLabel(site),
    // Nothing to offer when the URL is unusable, or when the "alternative"
    // would just be the booking URL again. A second button that 404s is worse
    // than no second button.
    hasAlternative: isUsable(site) && site !== booking,
  };
}
