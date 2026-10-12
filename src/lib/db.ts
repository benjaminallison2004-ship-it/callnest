import { getEnv } from './env';
const LS = 'sd_auth';
// Hydrate the access token SYNCHRONOUSLY from the persisted session so the very first
// data call never races the async session restore. Expiry is handled by refresh-on-401.
let _token: string | null = (() => { try { return (JSON.parse(localStorage.getItem(LS) || 'null') || {}).access_token || null; } catch { return null; } })();
export function setAuthToken(t: string | null) { _token = t; }
export function getAuthToken() { return _token; }
function fbAttempt(path: string, body: Record<string, unknown>, token: string | null): Promise<any> {
  // PREVIEW: relay through the parent window (calls Sitedrop same-origin).
  if (getEnv('VITE_AUTH_RELAY') && typeof window !== 'undefined' && window.parent !== window) {
    return new Promise<any>((resolve, reject) => {
      const id = Math.random().toString(36).slice(2);
      function onMsg(e: MessageEvent) {
        const d: any = e.data;
        if (!d || d.type !== '__sitedrop_fb_response' || d.id !== id) return;
        window.removeEventListener('message', onMsg);
        if (d.status >= 200 && d.status < 300) resolve(d.body || {});
        else { const err: any = new Error((d.body && d.body.error) || ('Request failed (HTTP ' + d.status + ')')); err.status = d.status; err.reason = d.body && d.body.reason; err.quota = d.body && d.body.quota; reject(err); }
      }
      window.addEventListener('message', onMsg);
      window.parent.postMessage({ type: '__sitedrop_fb_request', id, path, payload: body, token }, '*');
      setTimeout(() => { window.removeEventListener('message', onMsg); reject(new Error('Request timed out — reload the preview.')); }, 20000);
    });
  }
  // PUBLISHED: call the managed endpoint directly.
  const AUTH_BASE = getEnv('VITE_AUTH_BASE');
  if (!AUTH_BASE) return Promise.reject(new Error('App is still connecting to Sitedrop Cloud. Please reload the preview.'));
  const headers: Record<string,string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  // A timeout, so a hung response cannot leave the app waiting forever. The
  // preview relay already had one; the PUBLISHED path did not, which is what let
  // a slow API hold a whole site in its loading state.
  const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const killer = ctl ? setTimeout(() => ctl.abort(), 15000) : null;
  return fetch(AUTH_BASE + '/api/firebase-cloud/' + path, { method:'POST', headers, body: JSON.stringify(body), signal: ctl ? ctl.signal : undefined })
    .finally(() => { if (killer) clearTimeout(killer); })
    .then(async (r) => { const t = await r.text(); const j = t ? JSON.parse(t) : {}; if (!r.ok) { const err: any = new Error(j.error || ('Request failed (HTTP ' + r.status + ')')); err.status = r.status; err.reason = j.reason; err.quota = j.quota; throw err; } return j; });
}
// ONE refresh at a time, for the whole page.
//
// Refresh tokens are single-use: presenting one rotates it and invalidates it.
// There are two places that refresh — the session restore in AuthContext and the
// retry-on-401 here — and with no coordination both could fire at once, each
// presenting the same token. One wins; the loser gets a 401 for a token that was
// perfectly good a millisecond earlier and used to conclude the session was dead.
// Two components fetching on mount was enough to sign the user out.
//
// Everything that needs a refresh now awaits the same promise, so the token is
// spent exactly once and every caller gets the same new pair.
let _refreshing: Promise<any> | null = null;
function refreshOnce(appId: string): Promise<any> {
  if (_refreshing) return _refreshing;
  _refreshing = (async () => {
    const s = JSON.parse(localStorage.getItem(LS) || 'null');
    if (!s || !s.refresh_token) return null;
    const r = await fbAttempt('auth/refresh', { tenantId: appId, refresh_token: s.refresh_token }, null);
    _token = r.access_token;
    localStorage.setItem(LS, JSON.stringify({ ...s, ...r }));
    return r;
  })().finally(() => { _refreshing = null; });
  return _refreshing;
}
async function fbCall(path: string, payload: Record<string, unknown>, useAuth = false): Promise<any> {
  const APP_ID = getEnv('VITE_TENANT_ID');
  if (!APP_ID) throw new Error('App is still connecting to Sitedrop Cloud. Please reload the preview.');
  const body = { tenantId: APP_ID, ...payload };
  try {
    return await fbAttempt(path, body, useAuth ? _token : null);
  } catch (e: any) {
    // Token expired/invalid mid-session → refresh once from the stored session and retry.
    if (useAuth && e && e.status === 401) {
      try {
        const r = await refreshOnce(APP_ID);
        if (r) return await fbAttempt(path, body, _token);
      } catch (re: any) {
        // Only a refused refresh token ends the session. Anything else — offline,
        // a 500, a rate-limit — used to wipe a thirty-day session over a momentary
        // blip, which reads to the owner as "my site logs people out at random".
        if (re && (re.status === 401 || re.status === 403)) {
          localStorage.removeItem(LS); _token = null;
          // TELL THE APP. Clearing the token here left AuthContext holding a
          // user object, so the interface stayed signed in — avatar, dashboard,
          // the lot — while every single call 401'd behind it. Nothing was
          // broken enough to show an error, so the user sat in front of a page
          // that had quietly stopped working and no amount of clicking fixed
          // it. AuthContext listens for this and signs out properly.
          try { window.dispatchEvent(new CustomEvent('sitedrop:session-ended')); } catch {}
        }
      }
    }
    // A missing record on a read is an answer, not a fault: get/getPublic/mine
    // resolve to null for it. Logging it red here made the preview's auto-fix
    // treat "no profile yet" as a crash and spend a repair turn on it.
    const expectedMiss = e && e.status === 404 && /^(?:get|get-public|mine)$/.test(String(payload && payload.op));
    if (!expectedMiss) console.error('[db] error:', path, (e && e.status) || '', (e && e.message) || e);
    throw e;
  }
}
/** Resolve a read's 404 to null; every other failure still throws. */
function nullOn404(e: any): null {
  if (e && e.status === 404) return null;
  throw e;
}
/**
 * Restore the session, sharing the ONE in-flight refresh.
 *
 * A refresh token is single-use: presenting it rotates it and kills the old
 * one. refreshOnce() exists so the whole page spends it exactly once — and the
 * session restore in AuthContext was calling authApi.refresh directly, outside
 * it. So the two refreshers this file's own comment warns about were never
 * actually coordinated: a data call that 401s while the app is mounting spends
 * the same token from the other side, and whichever loses gets a 401 for a
 * token that was valid a millisecond earlier.
 *
 * React StrictMode makes it worse and is force-injected into every preview
 * build: the mount effect runs TWICE, so the restore raced itself even with
 * nothing else on the page. That is the "auth/refresh Request timed out" a
 * customer reported, and the sign-outs that could never be reproduced.
 *
 * Returns null when there is no stored session. Throws only what fbAttempt
 * throws, so the caller can still distinguish a 401 from a dropped connection.
 */
export function restoreSession(): Promise<any> {
  const APP_ID = getEnv('VITE_TENANT_ID');
  if (!APP_ID) return Promise.resolve(null);
  return refreshOnce(APP_ID);
}

export const authApi = {
  signup: (email: string, password: string, metadata?: Record<string, unknown>) => fbCall('auth/signup', { email, password, metadata }),
  login: (email: string, password: string) => fbCall('auth/login', { email, password }),
  refresh: (refresh_token: string) => fbCall('auth/refresh', { refresh_token }),
  logout: (refresh_token: string) => fbCall('auth/logout', { refresh_token }),
  // "Forgot password": Sitedrop emails a 6-digit code if the address has an
  // account. Same answer either way.
  requestPasswordReset: (email: string) => fbCall('auth/reset-request', { email }),
  // Checks that code: new password set, other sessions signed out, a session returned.
  resetPassword: (email: string, code: string, password: string) => fbCall('auth/reset-confirm', { email, code, password }),
};
// Documents are AUTOMATICALLY scoped to the signed-in user (server stamps ownerId +
// returns only the user's own docs). For role 'admin', the authed reads/writes are
// UNSCOPED (manage-all dashboards). Do NOT set ownerId yourself.
// Anonymous access is named, and writing and reading are named separately.
//   inbox_*  anyone may ADD, nobody may read without a token  (submissions)
//   public_* anyone may add AND read                          (public content)
// The helpers add the prefix themselves so neither is a rule the app has to
// remember, and both sides normalise identically — submit('bookings') and the
// owner's Cloud tab are looking at the same collection.
// A hyphen means the same as an underscore here, exactly as it does on the
// server. Matching only 'public_' turned public-gallery into
// public_public-gallery, which is a different, empty collection.
function pub(collection: string): string {
  return /^public[_-]/.test(collection) ? collection : 'public_' + collection;
}
function inbox(collection: string): string {
  if (/^inbox[_-]/.test(collection)) return collection;
  // A 'public_' prefix is STRIPPED, not honoured. submit() means "a stranger
  // sent this and only the owner may read it" — that is the whole reason to call
  // it instead of addPublic. Passing submit('public_bookings') is a mistake, and
  // honouring it turned the one safe helper into the leak it exists to prevent:
  // every booking readable by anyone, from the function whose name promises the
  // opposite. Callers who genuinely want something world-readable have
  // addPublic, which says so.
  return 'inbox_' + collection.replace(/^public[_-]/, '');
}
export const db = {
  /** Several authenticated collections in one request — never for anonymous public pages. */
  listMany,
  list: (collection: string) => fbCall('data', { op:'list', collection }, true).then((r:any) => r.docs as any[]),
  // MISSING IS NOT AN ERROR. Asking for a document that does not exist yet is
  // the commonest question an app has — "does this user have a profile?" — and
  // it used to THROW, because the server answers 404 and fbCall rejects on any
  // non-2xx. A swim-school app called db.get('users_profile', user.id) before
  // registration had written the row, the dashboard died on every visit, and
  // the repair added .catch(() => null) to one file and missed another, so the
  // customer hit it again ten minutes later. nullOn404 ends that whole game: a
  // real failure (offline, 403, 500) still throws.
  /** One document by id, or null when there is no such document. */
  get: (collection: string, id: string) => fbCall('data', { op:'get', collection, id }, true).then((r:any) => r.doc, nullOn404),
  add: (collection: string, data: Record<string, unknown>) => fbCall('data', { op:'add', collection, data }, true).then((r:any) => r.doc),
  update: (collection: string, id: string, data: Record<string, unknown>) => fbCall('data', { op:'update', collection, id, data }, true).then((r:any) => r.doc),
  remove: (collection: string, id: string) => fbCall('data', { op:'delete', collection, id }, true).then(() => true),
  listPublic: (collection: string) => fbCall('data', { op:'list-public', collection: pub(collection) }, false).then((r:any) => r.docs as any[]),
  /** One public document by id, or null when there is no such document. */
  getPublic: (collection: string, id: string) => fbCall('data', { op:'get-public', collection: pub(collection), id }, false).then((r:any) => r.doc, nullOn404),
  addPublic: (collection: string, data: Record<string, unknown>) => fbCall('data', { op:'add-public', collection: pub(collection), data }, false).then((r:any) => r.doc),
  // submit() is what a form calls. Anyone may send one; nobody may read the
  // collection back without a token, so a booking cannot be listed by the next
  // visitor. The owner reads these in their Cloud tab, or in-app from an
  // admin-role session.
  submit: (collection: string, data: Record<string, unknown>) => fbCall('data', { op:'add-public', collection: inbox(collection), data }, false).then((r:any) => r.doc),

  // ── ONE RECORD PER USER — profile, settings, preferences ────────────────
  // db.add makes a random id, so "my profile" can NOT be stored under the
  // user's id, and db.get('profile', user.id) can never find anything. These
  // two find the signed-in user's single record without any id at all:
  //
  //   const me = await db.mine('profile');                 // null before the first save
  //   const saved = await db.saveMine('profile', { name, dob });   // creates it once, then updates it
  //
  // Both REQUIRE a signed-in user. The collection is a plain private name
  // ('profile', 'settings'), never public_ or inbox_.
  mine: (collection: string) => fbCall('data', { op:'mine', collection }, true).then((r:any) => (r.doc as any) || null),
  saveMine: (collection: string, data: Record<string, unknown>) => fbCall('data', { op:'save-mine', collection, data }, true).then((r:any) => r.doc),

  // ── USAGE LIMITS — "5 free uses, 100 on the paid plan" ──────────────────
  // The count lives on the SERVER, per signed-in user, and only the server can
  // lower it: a page cannot reset it, a double click cannot spend one use
  // twice, and the dashboard and the feature show the same number because
  // there is only one. The server also knows who has PAID (it reads the
  // billing record itself), so the page never decides that: it sends both
  // numbers and gets back the one that applies. Both calls REQUIRE a
  // signed-in user.
  //
  //   const LIMITS = { free: 5, paid: 100 };          // one constant, used everywhere; paid: null = no limit once paid
  //   const q = await db.quota('humanize', LIMITS);   // { remaining: 5, limit: 5, tier: 'free', unlimited: false, renewsAt: null }
  //   try {
  //     const q = await db.consume('humanize', LIMITS); // 5 -> 4, atomically; 100 -> 99 for a paying user
  //     runTheFeature();
  //   } catch (e: any) {
  //     if (e.reason === 'limit-reached') { setQuota(e.quota); setShowUpgrade(e.quota.tier === 'free'); }
  //     else setError(e.message);
  //   }
  //
  // An upgrade hands out the paid allowance at once; a subscription gets it
  // again each billing period (renewsAt says when); a downgrade keeps at most
  // the free allowance. Do NOT check billing.isActive before consume — the
  // server already did. The record is in the 'usage' collection, readable
  // with db.list('usage'); writing it is refused.
  quota: (feature: string, limits: number | QuotaLimits) => fbCall('data', { op:'quota', feature, ...quotaArgs(limits) }, true).then((r:any) => r.quota as Quota),
  consume: (feature: string, limits: number | QuotaLimits, amount: number = 1) => fbCall('data', { op:'consume', feature, ...quotaArgs(limits), amount }, true).then((r:any) => r.quota as Quota),
};
/** What the feature allows: uses on the free tier, uses on a paid plan (null or omitted = no limit once paid). */
export type QuotaLimits = { free: number; paid?: number | null };
export type Quota = {
  feature: string;
  /** null when the plan puts no limit on this feature (unlimited === true). */
  remaining: number | null;
  limit: number | null;
  unlimited: boolean;
  tier: 'free' | 'paid';
  /** ISO date a subscription's allowance is handed out again; null for free and one-time. */
  renewsAt: string | null;
};
// A plain number is the original single-limit form: that many uses for
// everyone, and the page gates paid users itself. Kept so older sites work.
function quotaArgs(limits: number | QuotaLimits): Record<string, unknown> {
  if (typeof limits === 'number') return { initial: limits };
  return { limits: { free: limits.free, paid: limits.paid == null ? null : limits.paid } };
}

// ── FILES ───────────────────────────────────────────────────────────────────
// Real file storage. Use this for ANYTHING that is not JSON: a PDF, a photo, a
// signed contract, a CV, a logo, an audio note.
//
// NEVER put a file in db.* — a document is capped at 64KB and a base64'd file
// blows through it. That failure surfaces as "not enough storage", which sounds
// like a quota problem and is really "you used the wrong API".
//
// Bucket names carry permissions, exactly like collection names:
//   inbox_*   anyone may UPLOAD, nobody may read or list without signing in.
//             Job applications, returned contracts, complaint photos.
//   public_*  anyone may upload AND read. Galleries, menu photos.
//   anything else — signed-in users only, each sees only their own files.
//
// Every returned url is ready to drop into <img src> or <a href>. It expires in
// an hour, so re-list when a page mounts rather than storing one for later.
type UploadedFile = {
  id: string; bucket: string; size: number; contentType: string; name: string;
  /**
   * SHORT-LIVED — it expires at expiresAt, within the hour.
   *
   * Fine to render right now. NEVER store it in a document: the row outlives
   * the link, and every customer who opens that record tomorrow gets "This
   * link has expired". Store the id (and the bucket) and call files.objectUrl()
   * when you need to show it.
   */
  url: string;
  expiresAt: string;
};

function fileToBase64(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    // readAsDataURL gives "data:<mime>;base64,<payload>" — the API wants only
    // the payload.
    r.onload = () => resolve(String(r.result || '').split(',')[1] || '');
    r.onerror = () => reject(new Error('Could not read that file.'));
    r.readAsDataURL(file);
  });
}

function absolutise(url: string): string {
  const BASE = getEnv('VITE_AUTH_BASE');
  return url.startsWith('http') ? url : BASE + url;
}

/**
 * Read several collections in ONE request.
 *
 *   const { documents, templates, team } = await db.listMany(['documents', 'templates', 'team']);
 *
 * A dashboard that reads four collections is four round trips done the obvious
 * way, before the user has touched anything — and every tab switch is more.
 * That is how a real app runs into "Too many requests" on its own first screen.
 * Use this on signed-in/admin screens that need more than one authenticated
 * collection. It requires a session and preserves owner scoping. Anonymous
 * public pages must call db.listPublic separately for each public_* collection.
 */
export async function listMany(collections: string[]): Promise<Record<string, any[]>> {
  const r = await fbCall('data', { op: 'list-many', collections }, true);
  return r.collections || {};
}

export const files = {
  /** Upload for the signed-in user. Only they can list or read it back. */
  upload: async (bucket: string, file: File): Promise<UploadedFile> => {
    tooBig(file, 3145728);
    const dataBase64 = await fileToBase64(file);
    const r = await fbCall('files', { op:'upload', bucket, contentType: file.type, dataBase64, name: file.name }, true);
    return { ...r.file, url: absolutise(r.file.url) };
  },
  /** Upload with no account — the bucket must be inbox_* or public_*. */
  uploadPublic: async (bucket: string, file: File): Promise<UploadedFile> => {
    tooBig(file, 1048576);
    const dataBase64 = await fileToBase64(file);
    const r = await fbCall('files', { op:'upload-public', bucket, contentType: file.type, dataBase64, name: file.name }, false);
    return { ...r.file, url: absolutise(r.file.url) };
  },
  /** The signed-in user's own files in this bucket. */
  list: async (bucket: string): Promise<UploadedFile[]> => {
    const r = await fbCall('files', { op:'list', bucket }, true);
    return (r.files || []).map((f: any) => ({ ...f, url: absolutise(f.url) }));
  },
  /** Everything in a public_* bucket. */
  listPublic: async (bucket: string): Promise<UploadedFile[]> => {
    const r = await fbCall('files', { op:'list-public', bucket }, false);
    return (r.files || []).map((f: any) => ({ ...f, url: absolutise(f.url) }));
  },
  /**
   * The file's BYTES — use this to render one, never a stored url.
   *
   * Two reasons, and both of them shipped as bugs:
   *
   *   The url is SHORT-LIVED. It carries its own signed grant and expires
   *   within the hour, so a url written into a document works while you are
   *   testing and returns "This link has expired" to the customer the next day,
   *   permanently.
   *
   *   Inside the Sitedrop preview, every other call this app makes is relayed
   *   through the editor. A plain fetch of the url is the one request that is
   *   not, so it fails on its own whenever the API origin is slow or down —
   *   which is exactly how a PDF signer uploaded a document successfully and
   *   then could not read it back.
   *
   * read() goes down the same path as db and auth, so it works wherever they do.
   */
  read: async (bucket: string, id: string): Promise<Blob> => {
    const r = await fbCall('files', { op:'download', bucket, id }, true);
    return base64ToBlob(r.file.dataBase64, r.file.contentType);
  },
  /** The same, for a public_* bucket, with no account. */
  readPublic: async (bucket: string, id: string): Promise<Blob> => {
    const r = await fbCall('files', { op:'download-public', bucket, id }, false);
    return base64ToBlob(r.file.dataBase64, r.file.contentType);
  },
  /**
   * A blob: URL for <img>, <video>, or a PDF viewer — good until you revoke it.
   *
   *   const src = await files.objectUrl('pdfs', doc.fileId);
   *   ...
   *   useEffect(() => () => URL.revokeObjectURL(src), [src]);   // or it leaks
   */
  objectUrl: async (bucket: string, id: string): Promise<string> =>
    URL.createObjectURL(await files.read(bucket, id)),
  /** Delete one of the signed-in user's own files. */
  remove: (bucket: string, id: string) => fbCall('files', { op:'delete', bucket, id }, true).then(() => true),
};

/**
 * Refuse an oversized file HERE, before it is sent.
 *
 * The server has the same limit and a better message, and for a large file that
 * message can never arrive: the request is rejected by the platform before the
 * route runs, by a response with no CORS headers, which the browser reports as
 * the bare "Failed to fetch". Checking first turns a network error into a
 * sentence the visitor can act on.
 */
function tooBig(file: Blob, cap: number): void {
  if (file && file.size > cap) {
    throw new Error(
      'That file is too large (' + (file.size / 1024 / 1024).toFixed(1) + ' MB). ' +
      'The limit is ' + (cap / 1024 / 1024).toFixed(0) + ' MB.'
    );
  }
}

function base64ToBlob(dataBase64: string, contentType: string): Blob {
  const bin = atob(dataBase64 || '');
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: contentType || 'application/octet-stream' });
}

export interface SendEmailInput {
  /** One address, or up to 10. */
  to: string | string[];
  subject: string;
  /** PLAIN TEXT. Blank lines become paragraphs. HTML is rejected, not escaped. */
  body: string;
  /** Optional button. MUST point at this site — another site's URL is refused. */
  actionUrl?: string;
  /** Button text. Defaults to 'Open'. */
  actionLabel?: string;

  // ── Make it look like YOUR product, not a generic notification ──
  /** Headline above the message: 'You have been asked to sign Contract.pdf'. */
  heading?: string;
  /** The preview line an inbox shows next to the subject. Worth setting. */
  preheader?: string;
  /** Up to 8 facts, shown as a tidy table: [{ label: 'Document', value: doc.name }]. */
  items?: { label: string; value: string }[];
  /** Your accent colour as #rrggbb — colours the header bar and the button. */
  brandColor?: string;
  /** Your logo, hosted on this site (files.uploadPublic gives you a url). */
  logoUrl?: string;
  /** One extra line above the footer: 'Questions? Just reply to this email.' */
  footerNote?: string;
}

/**
 * Email the site's own users.
 *
 * Invite someone to sign, tell the next approver it is their turn, confirm a
 * booking to the person who made it. Sent from the site's name through
 * Sitedrop's mail service — the owner never provides a key.
 *
 *   await email.send({
 *     to: signer.email,
 *     subject: 'Please sign ' + doc.name,
 *     heading: user.email + ' has asked you to sign a document',
 *     preheader: 'Takes about a minute',
 *     body: 'Review the document and add your signature.',
 *     items: [
 *       { label: 'Document', value: doc.name },
 *       { label: 'Sent by', value: user.email },
 *     ],
 *     brandColor: '#6366F1',
 *     actionUrl: window.location.origin + '/sign/' + doc.id,
 *     actionLabel: 'Review and sign',
 *     footerNote: 'Questions? Just reply to this email.',
 *   });
 *
 * THE RULES, so you design within them instead of discovering them:
 *  • The sender must be SIGNED IN. There is no anonymous send — a visitor
 *    reaching the owner uses submitForm() instead.
 *  • The body is plain text. Passing HTML is an error, not a silent escape.
 *  • A link must point back at this site. Anywhere else is refused.
 *  • 20 per signed-in user per hour, 200 per site per day.
 *
 * Throws with a message worth showing. Await it and only confirm afterwards.
 */
export const email = {
  send: async (input: SendEmailInput): Promise<{ sent: number }> => {
    const r = await fbCall('email', {
      ...input,
      to: Array.isArray(input.to) ? input.to : [input.to],
    }, true);
    return { sent: r.sent || 0 };
  },
};

// ── BILLING — who has paid ──────────────────────────────────────────────────
// Written ONLY by Sitedrop when a Stripe checkout completes. A page can read
// it and can never write it, so a "pro" badge here means money actually moved
// and nobody can grant themselves a plan from the console.
//
//   const plan = await billing.current();          // null until they have bought something
//   if (billing.isActive(plan)) { /* paid: show the plan, unlock paid-only screens */ }
//   (A limited feature does NOT check this before db.consume: the server reads
//   the same record and applies the paid allowance itself.)
//
// SENDING SOMEONE TO PAY. The payment link must carry WHO is paying, or the
// purchase can never be attached to their account. Always open it through
// checkoutUrl, and only for a signed-in user — it returns null when nobody is
// signed in, and then the right move is navigate('/login'), never the raw link.
//
//   const url = billing.checkoutUrl(PRO_PAYMENT_LINK);
//   if (!url) navigate('/login'); else window.location.href = url;
//
// After paying, Stripe brings the customer back to THIS site at
// /billing/success (a protected route this site must have). That page awaits
// billing.current() and shows the plan.
export type Billing = {
  id: string;
  /** 'active' | 'trialing' | 'past_due' | 'canceled' for a subscription; 'paid' for a one-time purchase. */
  status: string;
  /** The product name as created in Stripe, e.g. 'Pro Plan'. */
  plan: string;
  productId: string | null;
  priceId: string | null;
  interval: 'month' | 'year' | 'one_time' | string;
  amountUsd: number;
  currency: string;
  /** ISO date the current subscription period ends; null for one-time purchases. */
  currentPeriodEnd: string | null;
  checkoutSessionId: string;
  created_at?: string;
  updated_at?: string;
};
function storedSession(): any { try { return JSON.parse(localStorage.getItem(LS) || 'null'); } catch { return null; } }
export const billing = {
  /** The signed-in user's plan, or null when they have never paid. Requires a signed-in user. */
  current: async (): Promise<Billing | null> => {
    const s = storedSession();
    const me = s && s.user && s.user.id ? String(s.user.id) : null;
    // An admin-role session lists EVERY user's billing row. The plan shown to
    // the person signed in must still be their own, so keep only rows they own.
    const docs = (await db.list('billing')).filter((d: any) => !me || !d.ownerId || String(d.ownerId) === me);
    if (!docs.length) return null;
    docs.sort((a: any, b: any) => String(b.updated_at || b.created_at || '').localeCompare(String(a.updated_at || a.created_at || '')));
    return docs[0] as Billing;
  },
  /** True while a plan entitles them to paid features. */
  isActive: (b: Billing | null | undefined): boolean => !!b && (b.status === 'active' || b.status === 'trialing' || b.status === 'paid'),
  /** The payment link carrying the signed-in user's identity, or null when signed out. */
  checkoutUrl: (paymentLink: string): string | null => {
    const s = storedSession();
    const u = s && s.user;
    // Issued by the managed-auth server and signed with this tenant's secret.
    // A raw browser user id is not proof of identity: localStorage and URL
    // query parameters are editable. The webhook verifies this reference before
    // it grants the billing row to exactly this authenticated account.
    const reference = s && typeof s.billing_reference === 'string' ? s.billing_reference : null;
    if (!u || !u.id || !reference) return null;
    try {
      const url = new URL(paymentLink);
      url.searchParams.set('client_reference_id', reference);
      if (u.email) url.searchParams.set('prefilled_email', String(u.email));
      return url.toString();
    } catch { return null; }
  },
};

// ── SHOP — carts, checkout and orders (goods and per-visit services) ────────
// Two ways to take money, chosen by WHAT is sold:
//   PLAN — a subscription or tier: billing.checkoutUrl + /billing/success (above).
//   SHOP — things: products, a haircut, a bouquet, anything bought per visit,
//          possibly several at once. A cart, ONE Stripe page for the whole cart,
//          and an 'orders' document per completed checkout.
// Sitedrop writes 'orders' when Stripe confirms payment; the site reads them and
// can never write them. Guests may buy: an order with no account is still
// recorded, and the owner sees it in the Cloud tab and any admin area.
//
//   // lib/products.ts holds the products exactly as created in Stripe, with each priceId.
//   const cart = [{ priceId: PRODUCTS[0].priceId, quantity: 2 }];
//   await shop.checkout(cart, { collectShipping: true });   // leaves for Stripe's page
//   const mine = await shop.orders();       // the signed-in user's orders (an admin session: everyone's)
//   const one  = await shop.order(id);      // one order, e.g. from /orders/success?order=…  (guests too)
//   await shop.setStatus(id, 'done');       // admin only: 'new' | 'processing' | 'done' | 'cancelled'
export type OrderItem = { productId: string | null; priceId: string | null; name: string; quantity: number; unitAmountUsd: number; amountUsd: number };
export type Order = {
  id: string;
  /** 'paid' | 'refunded' | 'partially_refunded' */
  status: string;
  /** 'new' | 'processing' | 'done' | 'cancelled' — set by an admin */
  fulfillment: string;
  items: OrderItem[];
  amountUsd: number;
  currency: string;
  email: string | null;
  customerName: string | null;
  phone: string | null;
  shipping: { name: string | null; address: Record<string, string | null> } | null;
  /** Whatever the cart attached, e.g. { appointment: '2026-10-01 15:00' } */
  metadata: Record<string, string>;
  guest: boolean;
  created_at?: string;
  updated_at?: string;
};
export const shop = {
  /** Send the whole cart to Stripe. Signed in or not. Navigates away; resolves with the checkout URL. */
  checkout: async (
    items: { priceId: string; quantity?: number }[],
    opts?: { collectShipping?: boolean; metadata?: Record<string, string>; cancelPath?: string; shippingCountries?: string[] },
  ): Promise<{ url: string }> => {
    // The preview runs the site inside an iframe and Stripe refuses to load in
    // one, so there the checkout opens in a new tab. The tab is opened BEFORE
    // the request so the browser treats it as the click that caused it.
    const inPreview = typeof window !== 'undefined' && window.parent !== window;
    const tab = inPreview ? window.open('', '_blank') : null;
    try {
      const here = window.location.origin + window.location.pathname;
      const cancelUrl = here + '#' + ((opts && opts.cancelPath) || '/cart');
      const r = await fbCall('checkout', {
        items: items.map((i) => ({ priceId: i.priceId, quantity: i.quantity || 1 })),
        metadata: (opts && opts.metadata) || {},
        collectShipping: !!(opts && opts.collectShipping),
        shippingCountries: (opts && opts.shippingCountries) || [],
        cancelUrl,
      }, true);
      if (tab) tab.location.href = r.url; else window.location.href = r.url;
      return { url: String(r.url) };
    } catch (e) { if (tab) tab.close(); throw e; }
  },
  /** The signed-in user's orders, newest last as stored. An admin session lists everyone's. */
  orders: (): Promise<Order[]> => db.list('orders') as Promise<Order[]>,
  /** One order by id. Works for a guest holding the id from the success page. */
  order: (id: string): Promise<Order> => fbCall('data', { op: 'order-get', collection: 'orders', id }, true).then((r: any) => r.doc as Order),
  /** Admin only. */
  setStatus: (id: string, fulfillment: 'new' | 'processing' | 'done' | 'cancelled'): Promise<Order> =>
    fbCall('data', { op: 'order-status', collection: 'orders', id, data: { fulfillment } }, true).then((r: any) => r.doc as Order),
};
