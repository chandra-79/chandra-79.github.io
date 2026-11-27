/** Signup is optional and never stores the address in browser progress or backups. */
export async function subscribeToDaily(email, { signal } = {}) {
  if (typeof email !== 'string' || email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return { ok: false, message: 'Please enter a valid email address.' };
  }
  const controller = new AbortController();
  const cancel = () => controller.abort();
  const timeout = setTimeout(cancel, 12000);
  if (signal?.aborted) cancel();
  signal?.addEventListener('abort', cancel, { once: true });
  try {
    if (globalThis.Ziggle?.serverless?.()) return { ok: false, message: 'Email reminders aren’t part of this version of the app.' };
    const response = await fetch(globalThis.Ziggle?.apiUrl?.('/api/daily-reminders') ?? '/api/daily-reminders', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), consent: true }), signal: controller.signal,
    });
    if (response.status === 404 || response.status === 503 || !response.headers.get('content-type')?.includes('application/json')) {
      return { ok: false, message: 'Email reminders aren’t available yet. You can still play the daily challenge here anytime.' };
    }
    const result = await response.json();
    if (response.ok && result.ok === true) return { ok: true, message: 'You’re signed up. Look out for your daily challenge.' };
    return { ok: false, message: typeof result.message === 'string' ? result.message : 'We couldn’t confirm your signup. Please try again later.' };
  } catch {
    return { ok: false, message: 'Couldn’t connect to the email service. Please try again later; you can keep playing.' };
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', cancel);
  }
}
