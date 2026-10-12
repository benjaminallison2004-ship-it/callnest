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

/** Where Sitedrop is. Set directly on window by the preview and by a published site. */
function apiBase(): string {
  const direct = typeof window !== 'undefined' ? (window as any).__sitedrop_api_base : '';
  return String(direct || env('VITE_SITEDROP_API_BASE') || '').replace(/\/+$/, '');
}

function projectId(): string {
  const direct = typeof window !== 'undefined' ? (window as any).__sitedrop_project_id : '';
  return String(direct || env('VITE_SITEDROP_PROJECT_ID') || '');
}

/**
 * Which capability tier to answer on. Sitedrop picks the model.
 *
 * The legacy bucket names still work so sites built before tiers keep running.
 */
export type AITier =
  | 'gpt-mini'        // base model, the cheapest — what text features use unless a bigger one was asked for
  | 'gemini'          // base model; also what a call with no tier gets
  | 'claude-haiku'    // base model
  | 'gpt'             // larger, several times the price — only when the user named it
  | 'claude'          // larger, several times the price — only when the user named it
  | 'claude-opus'     // largest and by far the most expensive — only when the user named it
  // Ids from before the tiers were renamed. They still resolve server-side, so
  // sites built earlier keep running on exactly the model they were quoted.
  | 'fast' | 'standard' | 'most-capable' | 'openai';

/**
 * Ask the AI something and get text back.
 *
 * NEVER THROWS. On any failure it returns a sentence worth showing the visitor,
 * so the call site is:
 *
 *   setLoading(true);
 *   const answer = await callAI(prompt);
 *   setLoading(false);
 *   setResult(answer);
 *
 * TO ASK ABOUT A PICTURE — a screenshot, a chart, a receipt, a photo — pass it
 * as the fourth argument and the model LOOKS at it:
 *
 *   const shot = await toImageInput(file);
 *   const answer = await callAI('What price is shown on this chart?', undefined, 'gemini', [shot]);
 *
 * The third argument is the capability tier the site owner chose. Sitedrop maps
 * it to a model server-side, so the price they were quoted is the price they are
 * charged, and the model can be upgraded without touching this site.
 *
 * The API key is read server-side by Sitedrop. It is never in this bundle.
 */
export async function callAI(
  prompt: string,
  system?: string,
  tier: AITier = 'standard',
  images?: ImageInput[],
): Promise<string> {
  return send({ prompt, system, tier, images });
}

/**
 * Ask the AI for DATA rather than prose, and get something you can use.
 *
 * Use this for anything the UI reads fields out of — a nutrition breakdown, a
 * score, a list of suggestions. NEVER call JSON.parse on callAI()'s return
 * value: callAI returns readable English, including when something failed, and
 * parsing that throws a SyntaxError that has nothing to do with what went wrong.
 * That is the "The AI returned an unexpected response" loop.
 *
 * This asks the provider for strict JSON, strips a markdown fence if one turns
 * up anyway, and retries once before giving up. It NEVER throws:
 *
 *   const r = await callAIJson<{ total: number; items: Item[] }>(
 *     'Calories for: ' + text,
 *     'Return {"total": number, "items": [{"name": string, "calories": number}]}',
 *   );
 *   if (!r.ok) { setError(r.error); return; }   // r.error is a readable sentence
 *   setResult(r.data);
 *
 * Always describe the exact shape you want in the system argument, using the
 * real field names your UI reads.
 *
 * Pictures to read go in the fourth argument, exactly as for callAI:
 *
 *   const r = await callAIJson<{ symbol: string; price: number }>(
 *     'Read the ticker and the current price from this chart.',
 *     'Return {"symbol": string, "price": number}',
 *     'gemini',
 *     [await toImageInput(file)],
 *   );
 */
export async function callAIJson<T = any>(
  prompt: string,
  system?: string,
  tier: AITier = 'standard',
  images?: ImageInput[],
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const raw = await send({ prompt, system, tier, json: true, images });
    const cleaned = stripFence(raw);
    if (cleaned) {
      try {
        return { ok: true, data: JSON.parse(cleaned) as T };
      } catch { /* fall through and retry once */ }
    }
    // Nothing usable came back. If it reads like a sentence rather than data,
    // it IS the failure message — show that, not a parser error.
    if (attempt === 1) {
      const looksLikeMessage = raw && !raw.trim().startsWith('{') && !raw.trim().startsWith('[');
      return { ok: false, error: looksLikeMessage ? raw : 'The AI could not answer that one. Try again with a bit more detail.' };
    }
  }
  return { ok: false, error: 'The AI could not answer that one. Try again with a bit more detail.' };
}

/**
 * Pull JSON out of whatever came back.
 *
 * Providers are asked for bare JSON and usually give it. "Usually" is not good
 * enough when the failure is a white screen, so a fence, a preamble, or a
 * trailing note are all stripped here rather than in every generated component.
 */
function stripFence(raw: string): string {
  let t = (raw ?? '').trim();
  const fence = t.match(/^s*```(?:json|JSON)?s*([sS]*?)s*```s*$/);
  if (fence) t = fence[1].trim();

  const open = t.search(/[{[]/);
  if (open < 0) return '';

  // Scan to the matching close rather than the LAST brace in the string. A
  // trailing "Let me know if you want more detail." is common and would make a
  // last-index slice swallow it; a closing brace inside a string value would
  // make a naive scan stop early. Both happen, so both are handled.
  const openCh = t[open];
  const closeCh = openCh === '{' ? '}' : ']';
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = open; i < t.length; i++) {
    const ch = t[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') { inString = true; continue; }
    if (ch === openCh) depth++;
    else if (ch === closeCh) {
      depth--;
      if (depth === 0) return t.slice(open, i + 1);
    }
  }
  return '';
}

async function send(args: { prompt: string; system?: string; tier: AITier; json?: boolean; images?: ImageInput[] }): Promise<string> {
  const { prompt, system, tier, json } = args;
  const id = projectId();
  if (!id) {
    return 'This tool is not connected yet (the preview is still starting up). Reload the preview and try again.';
  }
  // Pictures to READ ride in the same request as the question. Same limits as
  // generateImage: four at most, and one JSON body under the platform's 4.5MB.
  const images = (args.images || []).filter((i) => i && typeof i.dataBase64 === 'string' && i.dataBase64).slice(0, 4);
  const totalBase64 = images.reduce((n, i) => n + i.dataBase64.length, 0);
  if (totalBase64 > 3_500_000) {
    return 'Those images are too large to send together. Use fewer, or smaller ones.';
  }
  const payload = {
    projectId: id, prompt, system, model: tier,
    ...(json ? { json: true } : {}),
    ...(images.length ? { images } : {}),
  };

  // IN THE PREVIEW: relay through the parent window, which calls Sitedrop
  // same-origin. A direct call cannot work here — https sandbox, http API in
  // local development, blocked as mixed content before it is sent.
  if (env('VITE_AUTH_RELAY') && typeof window !== 'undefined' && window.parent !== window) {
    return new Promise<string>((resolve) => {
      const rid = Math.random().toString(36).slice(2);
      let settled = false;
      let timer: any = null;
      function done(text: string) {
        if (settled) return;
        settled = true;
        // Clear the timer as well as the listener. Left running it keeps a
        // 60-second handle alive per call long after the answer arrived, so a
        // page that makes a dozen AI calls holds a dozen of them.
        if (timer) clearTimeout(timer);
        window.removeEventListener('message', onMsg);
        resolve(text);
      }
      function onMsg(e: MessageEvent) {
        const d: any = e.data;
        if (!d || d.type !== '__sitedrop_fb_response' || d.id !== rid) return;
        const body = d.body || {};
        // A refusal carries a readable sentence in the same field a success
        // does — running out of fuel must read as a message, not as an error.
        if (typeof body.text === 'string' && body.text) return done(body.text);
        if (typeof body.error === 'string' && body.error) return done(body.error);
        done('The AI service did not respond. Please try again.');
      }
      window.addEventListener('message', onMsg);
      window.parent.postMessage({ type: '__sitedrop_fb_request', id: rid, path: 'ai', payload, token: null }, '*');
      timer = setTimeout(() => done('That took too long. Please try again.'), 60000);
    });
  }

  const base = apiBase();
  if (!base) {
    return 'This tool is not connected yet (the preview is still starting up). Reload the preview and try again.';
  }
  try {
    const r = await fetch(base + '/api/multipage-v2/ai-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const j = await r.json().catch(() => ({} as any));
    if (typeof j.text === 'string' && j.text) return j.text;
    if (typeof j.error === 'string' && j.error) return j.error;
    return 'The AI service did not respond. Please try again.';
  } catch {
    return 'The AI service is unreachable right now. Please try again.';
  }
}

// ── PICTURES ────────────────────────────────────────────────────────────────

export type ImageInput = { mimeType: string; dataBase64: string };
export type ImageResult =
  | { ok: true; mimeType: string; dataBase64: string; dataUrl: string }
  | { ok: false; error: string };

/**
 * Turn a File from <input type="file"> into something callAI, callAIJson and
 * generateImage accept.
 *
 * IT DOWNSCALES, and it has to.
 *
 * This used to read the file as-is. A photo from any phone is 3-6MB, base64
 * inflates it by a third, and the whole request rides in ONE JSON body against
 * a 4.5MB platform limit — so a single holiday snap was rejected with HTTP 413
 * before the request even reached the server. The visitor saw "Something went
 * wrong: HTTP 413" on a tool whose entire purpose is uploading a photo, and
 * nothing in the app or the error said the picture was simply too big.
 *
 * But a picture is also something to READ — the price on a chart, the total on
 * a receipt — and small print is what a heavy squeeze destroys first. So:
 * 2048px on the long edge (what the vision models work at), a screenshot kept
 * as PNG when it fits (sharp edges on text, no JPEG smear), a photo as
 * high-quality JPEG, and only if that is still too big, a smaller size. Each
 * picture stays under ~800KB of base64, so four still fit in one request.
 *
 * Falls back to the raw bytes if the canvas path is unavailable, because a
 * slightly-too-large request that MIGHT work beats refusing to read the file.
 */
const MAX_IMAGE_EDGE = 2048;
const IMAGE_BUDGET_BASE64 = 800_000;

export function toImageInput(file: Blob): Promise<ImageInput> {
  const raw = () => new Promise<ImageInput>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const s = String(r.result || '');
      resolve({ mimeType: (file as any).type || 'image/png', dataBase64: s.split(',')[1] || '' });
    };
    r.onerror = () => reject(new Error('Could not read that image.'));
    r.readAsDataURL(file);
  });

  if (typeof document === 'undefined' || typeof createImageBitmap === 'undefined') return raw();

  const isGraphic = /png|webp|gif/i.test(String((file as any).type || ''));
  return createImageBitmap(file)
    .then((bmp) => {
      const draw = (edge: number) => {
        const scale = Math.min(1, edge / Math.max(bmp.width, bmp.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(bmp.width * scale));
        canvas.height = Math.max(1, Math.round(bmp.height * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('no 2d context');
        ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
        return canvas;
      };
      const encode = (canvas: HTMLCanvasElement, type: string, quality?: number): ImageInput => {
        const dataUrl = canvas.toDataURL(type, quality);
        return { mimeType: type, dataBase64: dataUrl.split(',')[1] || '' };
      };
      const full = draw(MAX_IMAGE_EDGE);
      // Sharpest first, smallest last; the first that fits the budget wins.
      const attempts: Array<() => ImageInput> = [
        ...(isGraphic ? [() => encode(full, 'image/png')] : []),
        () => encode(full, 'image/jpeg', 0.92),
        () => encode(full, 'image/jpeg', 0.85),
        () => encode(draw(1600), 'image/jpeg', 0.85),
      ];
      let out: ImageInput | null = null;
      for (const attempt of attempts) {
        out = attempt();
        if (out.dataBase64.length <= IMAGE_BUDGET_BASE64) break;
      }
      bmp.close && bmp.close();
      return out as ImageInput;
    })
    .catch(() => raw());
}

/**
 * Generate a PICTURE, optionally from pictures the visitor supplied.
 *
 *   const a = await toImageInput(fileA);
 *   const b = await toImageInput(fileB);
 *   const out = await generateImage('Combine these two into one poster', [a, b]);
 *   if (out.ok) setSrc(out.dataUrl);   // dataUrl drops straight into <img src>
 *   else setError(out.error);
 *
 * NEVER THROWS — a refusal, a safety block and an outage all come back as
 * { ok: false, error } with a sentence worth showing the visitor.
 *
 * Costs the site owner noticeably more fuel than a text reply, so generate on a
 * button press, never on page load or on every keystroke.
 */
export async function generateImage(prompt: string, inputs?: ImageInput[]): Promise<ImageResult> {
  const id = projectId();
  if (!id) return { ok: false, error: 'This tool is not connected yet. Reload the preview and try again.' };
  // The request is ONE JSON body against a 4.5MB platform limit, and base64 is
  // already a third bigger than the bytes it encodes. toImageInput downscales,
  // but a caller can hand us anything, so the total is checked here too — a
  // sentence the visitor can act on beats an HTTP 413 they cannot.
  const picked = (inputs || []).slice(0, 4);
  const totalBase64 = picked.reduce((n, i) => n + (i && i.dataBase64 ? i.dataBase64.length : 0), 0);
  if (totalBase64 > 3_500_000) {
    return {
      ok: false,
      error: 'Those images are too large to send together. Use fewer, or smaller ones.',
    };
  }
  const payload: Record<string, unknown> = {
    projectId: id,
    prompt,
    kind: 'image',
    ...(picked.length ? { images: picked } : {}),
  };

  const body = await rawSend(payload);
  if (!body) return { ok: false, error: 'The AI service did not respond. Please try again.' };
  if (body.image && typeof body.image.dataBase64 === 'string' && body.image.dataBase64) {
    const mimeType = String(body.image.mimeType || 'image/png');
    const dataBase64 = String(body.image.dataBase64);
    return { ok: true, mimeType, dataBase64, dataUrl: 'data:' + mimeType + ';base64,' + dataBase64 };
  }
  if (typeof body.error === 'string' && body.error) return { ok: false, error: body.error };
  if (typeof body.text === 'string' && body.text) return { ok: false, error: body.text };
  return { ok: false, error: 'No image came back. Please try again.' };
}

/**
 * The same transport send() uses, returning the WHOLE body instead of a string.
 *
 * send() collapses everything to text, which is right for a text answer and
 * loses an image entirely. Kept beside it rather than refactored into it,
 * because send() is on the path every existing generated site already runs.
 */
async function rawSend(payload: Record<string, unknown>): Promise<any> {
  if (env('VITE_AUTH_RELAY') && typeof window !== 'undefined' && window.parent !== window) {
    return new Promise<any>((resolve) => {
      const rid = Math.random().toString(36).slice(2);
      let settled = false;
      let timer: any = null;
      function done(v: any) {
        if (settled) return;
        settled = true;
        if (timer) clearTimeout(timer);
        window.removeEventListener('message', onMsg);
        resolve(v);
      }
      function onMsg(e: MessageEvent) {
        const d: any = e.data;
        if (!d || d.type !== '__sitedrop_fb_response' || d.id !== rid) return;
        done(d.body || null);
      }
      window.addEventListener('message', onMsg);
      window.parent.postMessage({ type: '__sitedrop_fb_request', id: rid, path: 'ai', payload, token: null }, '*');
      // Longer than the text timeout: drawing takes longer than writing.
      timer = setTimeout(() => done({ error: 'That took too long. Please try again.' }), 120000);
    });
  }
  const base = apiBase();
  if (!base) return { error: 'This tool is not connected yet. Reload the preview and try again.' };
  try {
    const r = await fetch(base + '/api/multipage-v2/ai-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await r.json();
  } catch {
    return { error: 'The AI service is unreachable right now. Please try again.' };
  }
}
