import { Exam, NextChance } from '../types';
import { getExamStatus } from './examStatusColor';

/**
 * Vad anordnaren själv säger om nästa omgång, när den här är slut.
 *
 * En stängd listning är appens enda återvändsgränd. Färgen blir röd eller grå,
 * knappen säger "se nästa omgång" — och sedan får användaren leta reda på den
 * själv, på en sida som oftast inte ens säger när den kommer. Löftet i appen är
 * att man ska hinna anmäla sig innan deadline, och den deadline som fortfarande
 * går att hinna är nästa omgångs.
 *
 * Därför visas det här bara på de listningar där frågan är aktuell: en omgång
 * som är fullbokad, stängd eller över. På en öppen listning vore "nästa chans"
 * brus framför den chans som finns nu.
 */
export function nextChanceFor(exam: Exam): NextChance | undefined {
  const chance = exam.nextPeriod.nextChance;
  if (!chance) return undefined;
  const key = getExamStatus(exam).tone.key;
  return key === 'full' || key === 'closed' ? chance : undefined;
}

/**
 * Raden på kortet: kort nog för en rad, och med ett datum bara när anordnaren
 * har publicerat ett.
 */
export function nextChanceHeadline(chance: NextChance): string {
  if (!chance.opensOn) return 'Nästa anmälan';
  return `Nästa anmälan öppnar ${new Date(chance.opensOn).toLocaleDateString('sv-SE', {
    day: 'numeric',
    month: 'short',
  })}`;
}
