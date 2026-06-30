/**
 * A stable, NON-SECRET per-browser id used only to key the hosted-service usage
 * quota. It is not an auth token and grants no privileges — abusers can rotate
 * it, which is why the server also keys quota on IP. Good enough to stop casual
 * over-use of the shared (cost-bearing) hosted generation endpoint.
 */
const KEY = 'instaforge_session';

export function getSessionId() {
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id =
        (globalThis.crypto?.randomUUID?.() ||
          `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`);
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    // localStorage unavailable (private mode etc.) — fall back to ephemeral id
    return `s_${Math.random().toString(36).slice(2, 12)}`;
  }
}
