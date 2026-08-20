import { Exam } from '../types';
import { getExamStatus } from './examStatusColor';
import { getProviderLinks } from './providerLinks';
import { getRegistrationFlow } from './registrationFlow';

/**
 * What the buttons at the bottom of a listing should promise.
 *
 * The card used to show one brand-blue "Anmäl dig" on every listing, in the
 * same voice whatever the round's state — including on a round the provider
 * had already marked fullbokat. Pressing it took you to a form that opens with
 * "anmälan är stängd". The colour said "closed" at the top of the card and the
 * button said "book me" at the bottom, and the button is the part people act
 * on.
 *
 * So a closed round doesn't get a booking button at all. It gets a red one that
 * says why, pointing at the provider's own page — which is where a återbud or
 * the next omgång actually gets announced. The dead booking link stays
 * reachable as the secondary, for anyone who wants to see the closed form with
 * their own eyes.
 */

export type ActionVariant =
  /** Normal: the link leads to a live booking. */
  | 'book'
  /** The provider says the round is full. */
  | 'full'
  /** The published deadline has passed. */
  | 'closed';

export interface ExamAction {
  variant: ActionVariant;
  /** True only when following the primary button can still end in a seat. */
  live: boolean;
  primary: {
    href: string;
    label: string;
    /** Tooltip / aria detail — where this actually lands. */
    title: string;
  };
  secondary?: {
    href: string;
    label: string;
    title: string;
  };
}

export function getExamAction(exam: Exam): ExamAction {
  const status = getExamStatus(exam);
  const links = getProviderLinks(exam);
  const flow = getRegistrationFlow(exam);

  if (status.tone.key === 'full' || status.tone.key === 'closed') {
    const full = status.tone.key === 'full';
    // Prefer the provider's own page. When the dataset has no separate one, the
    // booking URL is all there is — still worth offering, but the label no
    // longer pretends it leads to a booking.
    const hasSite = links.hasAlternative;
    return {
      variant: full ? 'full' : 'closed',
      live: false,
      primary: {
        href: hasSite ? links.site : links.booking,
        label: full ? 'Fullbokat — se nästa omgång' : `${status.label} — se nästa omgång`,
        title: hasSite
          ? `Öppna ${links.siteLabel}, där ${exam.provider} publicerar nästa omgång`
          : `Öppna ${exam.provider}s sida`,
      },
      secondary: hasSite
        ? {
            href: links.booking,
            label: 'Anmälan',
            title: full
              ? 'Öppna anmälan ändå — platserna är slut, men avbokningar händer'
              : 'Öppna anmälan ändå — omgången är stängd',
          }
        : undefined,
    };
  }

  return {
    variant: 'book',
    live: true,
    primary: {
      href: links.booking,
      label: flow.ctaLabel,
      title: flow.landing,
    },
    secondary: links.hasAlternative
      ? {
          href: links.site,
          label: 'Skolans sida',
          title: `Öppna ${links.siteLabel}`,
        }
      : undefined,
  };
}
