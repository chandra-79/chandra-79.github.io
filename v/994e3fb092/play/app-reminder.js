// The daily reminder in the Ziggle apps (2.11, D-21): one notification a day at a time the player picks, like a
// "your puzzle is ready" nudge. It is off until switched on, and skipped on a day you've already played. It is
// scheduled on the phone itself (Capacitor Local Notifications), so nothing is sent to any server. Web browsers
// don't get it: a reminder there would need a push service, and email covers the rest (the opt-in weekly note).
const KEY = 'ziggle-app-reminder-v1';
const IDS = [7101, 7102, 7103, 7104, 7105, 7106, 7107];
const LINES = [
  'Today’s Ziggle is ready: eight puzzles, starting easy.',
  'A fresh Letter Lock and seven friends are waiting.',
  'Five minutes for today’s Ziggle?',
  'Your streak would love a visit today.',
  'New boards are up. Start easy and climb.',
  'Today’s word search has your name on it.',
  'Sum Spark, Sudoku and more: today’s set is ready.',
];
const plugin = () => globalThis.Capacitor?.Plugins?.LocalNotifications;
export const available = () => Boolean(plugin());

export function readReminder() {
  try { const value = JSON.parse(localStorage.getItem(KEY) || 'null'); if (value && /^\d{2}:\d{2}$/.test(value.time)) return { on: value.on === true, time: value.time }; } catch {}
  return { on: false, time: '19:00' };
}

/** The next seven reminder times, leaving out today when it's already played or the time has passed. */
export function reminderTimes({ time = '19:00', playedToday = false, now = new Date() } = {}) {
  const [hours, minutes] = time.split(':').map(Number);
  const times = [];
  for (let day = 0; times.length < IDS.length && day < 9; day++) {
    const at = new Date(now.getFullYear(), now.getMonth(), now.getDate() + day, hours, minutes, 0, 0);
    if (day === 0 && (playedToday || at <= now)) continue;
    times.push(at);
  }
  return times;
}

/** Re-plan the week's reminders (on opening the app, and when today's first daily is done). */
export async function refreshReminders(playedToday = false) {
  const notes = plugin(); if (!notes) return false;
  try {
    await notes.cancel({ notifications: IDS.map(id => ({ id })) });
    const { on, time } = readReminder();
    if (!on) return true;
    const notifications = reminderTimes({ time, playedToday }).map((at, i) => ({
      id: IDS[i], title: 'Ziggle', body: LINES[(at.getDate() + i) % LINES.length], schedule: { at, allowWhileIdle: true },
    }));
    await notes.schedule({ notifications });
    return true;
  } catch { return false; }
}

/** Switch the reminder on or off, or change its time. Asks the phone for permission the first time. */
export async function setReminder(on, time = readReminder().time) {
  const notes = plugin(); if (!notes) return { ok: false, message: 'Daily reminders work in the Ziggle app.' };
  if (on) {
    try {
      let state = (await notes.checkPermissions())?.display;
      if (state !== 'granted') state = (await notes.requestPermissions())?.display;
      if (state !== 'granted') return { ok: false, message: 'Notifications are off for Ziggle. Turn them on in your phone’s settings, then try again.' };
    } catch { return { ok: false, message: 'This phone didn’t allow the reminder.' }; }
  }
  try { localStorage.setItem(KEY, JSON.stringify({ on, time })); } catch {}
  const playedToday = Boolean(globalThis.Ziggle?.playedToday?.());
  await refreshReminders(playedToday);
  return { ok: true, message: on ? `Daily reminder on at ${time}. It skips days you’ve already played.` : 'Daily reminder off.' };
}
