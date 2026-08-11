import { it } from 'vitest';
import { EXAMS } from '../data/exams';
import { getRegistrationFlow } from './registrationFlow';

it('report', () => {
  const byKind: Record<string, string[]> = {};
  for (const e of EXAMS) {
    const k = getRegistrationFlow(e).kind;
    (byKind[k] ??= []).push(`${e.id} | ${e.registrationUrl}`);
  }
  for (const [k, list] of Object.entries(byKind)) {
    console.log(`\n### ${k} (${list.length})`);
    if (k === 'page' || k === 'pdf' || k === 'email') list.forEach((l) => console.log('   ' + l));
  }
});
