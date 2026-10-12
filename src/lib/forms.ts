// Injected by Sitedrop. Do not edit — it is regenerated on every build.
function env(key: string): string {
  const runtime = typeof window !== 'undefined' ? (window as any).__sitedrop_env?.[key] : undefined;
  if (runtime) return runtime;
  try {
    const meta = (import.meta as any).env;
    if (meta && meta[key]) return meta[key];
  } catch { /* not a Vite build */ }
  return '';
}

export interface SubmitResult { ok: true }

/**
 * Send a form to the site owner.
 *
 * Throws with a message worth showing if it fails. Call it inside try/catch and
 * only show the confirmation after it resolves.
 *
 *   await submitForm('reservation', { name, email, date, guests });
 */
export async function submitForm(
  formName: string,
  fields: Record<string, unknown>,
): Promise<SubmitResult> {
  const base = env('VITE_SITEDROP_API_BASE');
  const projectId = env('VITE_SITEDROP_PROJECT_ID');

  // Say which piece is missing. "Couldn't send" with no cause is what makes this
  // impossible to fix from the outside.
  if (!base || !projectId) {
    throw new Error(
      'This form is not connected yet (the preview is still starting up). Reload the preview and try again.',
    );
  }

  const clean: Record<string, string> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (v === undefined || v === null || v === '') continue;
    clean[k] = typeof v === 'string' ? v : String(v);
  }
  const payload = { projectId, formName, fields: clean };

  // IN THE PREVIEW: relay through the parent window, which calls Sitedrop
  // same-origin. A direct call cannot work here — the preview is served over
  // https and the Sitedrop API in local development is http://localhost:3000,
  // which the browser blocks as mixed content before the request is ever made.
  // That is why every form in every preview failed on submit with "could not
  // reach the server": nothing was wrong with the form, the site, or the
  // connection. db and auth have always used this relay; forms did not.
  if (env('VITE_AUTH_RELAY') && typeof window !== 'undefined' && window.parent !== window) {
    return new Promise<SubmitResult>((resolve, reject) => {
      const id = Math.random().toString(36).slice(2);
      function onMsg(e: MessageEvent) {
        const d: any = e.data;
        if (!d || d.type !== '__sitedrop_fb_response' || d.id !== id) return;
        window.removeEventListener('message', onMsg);
        if (d.status >= 200 && d.status < 300) resolve({ ok: true });
        else reject(new Error((d.body && d.body.error) || 'The server rejected the submission (HTTP ' + d.status + ').'));
      }
      window.addEventListener('message', onMsg);
      window.parent.postMessage({ type: '__sitedrop_fb_request', id, path: 'contact-submit', payload, token: null }, '*');
      setTimeout(() => {
        window.removeEventListener('message', onMsg);
        reject(new Error('That took too long. Please try again.'));
      }, 20000);
    });
  }

  let res: Response;
  try {
    res = await fetch(base.replace(/\/+$/, '') + '/api/contact-submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error('Could not reach the server. Check your connection and try again.');
  }

  if (!res.ok) {
    let detail = '';
    try { detail = (await res.json())?.error ?? ''; } catch { /* no body */ }
    if (res.status === 429) throw new Error('Too many submissions just now. Please wait a moment and try again.');
    throw new Error(detail || ('The server rejected the submission (HTTP ' + res.status + ').'));
  }
  return { ok: true };
}
