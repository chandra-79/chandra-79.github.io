// Ziggle spaced review: one small scheduler shared by every trainer (typing letter pairs, emoji and
// flag cards, memory recall, cube cases). Leitner boxes with growing gaps, because spaced, tested
// review beats rereading (Roediger & Karpicke 2006; Cepeda et al. 2008).
export const GAPS_DAYS = Object.freeze([0, 1, 3, 7, 21, 60]);
const DAY = 86_400_000;

/** A new card is due straight away. */
export const newCard = (id, now = Date.now()) => ({ id, box: 0, due: now, seen: 0, right: 0 });

/** Record an answer: right moves the card up a box (longer gap), wrong sends it back to box 1. */
export function review(card, correct, now = Date.now()) {
  const box = correct ? Math.min(GAPS_DAYS.length - 1, card.box + 1) : 1;
  return { ...card, box, due: now + GAPS_DAYS[box] * DAY, seen: card.seen + 1, right: card.right + (correct ? 1 : 0), last: now };
}

/** Cards due now, most overdue first, then lowest box. */
export function dueCards(cards, now = Date.now(), limit = 20) {
  return cards.filter(card => card.due <= now).sort((a, b) => a.due - b.due || a.box - b.box).slice(0, limit);
}

/** Share of cards in the top two boxes: a simple "mastered" figure. */
export function mastery(cards) {
  if (!cards.length) return 0;
  return Math.round(100 * cards.filter(card => card.box >= GAPS_DAYS.length - 2).length / cards.length);
}
