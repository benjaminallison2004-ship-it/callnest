import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { db } from '../../lib/db'
import { CallnestReview, averageRating, reviewsToCSV } from '../../lib/callnest/reviewHelpers'

export default function MyReviews() {
  const { user, signOut } = useAuth();
  const [r, setR] = useState<CallnestReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rating, setRating] = useState('all');
  const [visibility, setVisibility] = useState('all');
  const [reply, setReply] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = () => {
    setLoading(true);
    // Reviews are stored in public_callnest_reviews via db.addPublic.
    // We read them all and filter by business_id (= the signed-in user's id)
    // so each owner sees only their own business's reviews.
    db.listPublic('callnest_reviews')
      .then(rows => {
        const myReviews = (rows as CallnestReview[]).filter(
          x => x.business_id === user?.id
        );
        setR(myReviews);
      })
      .catch(x => setError(x?.message || 'Could not load reviews.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    document.title = 'My Reviews | Callnest';
    load();
  }, [user?.id]);

  const filtered = useMemo(() =>
    r.filter(x =>
      (rating === 'all' || x.rating === +rating) &&
      (visibility === 'all' ||
        (visibility === 'public' ? (x.showPublicly && x.consent) : (x.private || !x.showPublicly)))
    ),
    [r, rating, visibility]
  );

  const link = `${location.origin}${location.pathname.split('#')[0]}#/review/${btoa(user?.id || 'demo')}`;

  // Toggle showPublicly on a review — uses db.update on the public collection
  const update = async (id: string, data: Partial<CallnestReview>) => {
    setBusy(true);
    try {
      await db.update('public_callnest_reviews', id, data as Record<string, unknown>);
      load();
      setReply(null);
    } catch (x: any) {
      setError(x?.message || 'Could not update review.');
    } finally {
      setBusy(false);
    }
  };

  const signOutHandler = async () => {
    try { await signOut(); location.hash = '#/login'; }
    catch (x: any) { setError(x?.message || 'Could not sign out.'); }
  };

  const downloadCsv = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([reviewsToCSV(r)], { type: 'text/csv' }));
    a.download = 'callnest-reviews.csv';
    a.click();
  };

  const avg = averageRating(r);

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">My Reviews</h1>
          <p className="mt-2 text-slate-600">
            {avg ? `⭐ ${avg}/5 average rating` : 'No public reviews yet'}
          </p>
        </div>
        <button onClick={signOutHandler} className="cn-btn-outline">Sign out</button>
      </div>

      <div className="mt-6 flex flex-wrap gap-6 text-sm text-slate-600">
        <span>Total: <b>{r.length}</b></span>
        <span>Public: <b>{r.filter(x => x.showPublicly && x.consent).length}</b></span>
        <span>Private (1–3★): <b>{r.filter(x => x.private).length}</b></span>
        <span>Avg: <b>{avg || '—'}</b></span>
      </div>

      {/* Review request link */}
      <section className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-5">
        <h2 className="font-bold">Send a review request to a customer</h2>
        <p className="mt-2 text-sm text-slate-600">Copy this link and send it after an appointment (via text, WhatsApp, or email).</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <input readOnly className="h-11 min-w-[260px] flex-1 rounded-lg border bg-white px-3 text-sm" value={link} />
          <button
            className="cn-btn-outline"
            onClick={() => navigator.clipboard.writeText(link).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); })}
          >
            {copied ? 'Copied! ✓' : 'Copy link'}
          </button>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          ℹ️ Automated review requests (2h after booking completion) require Twilio SMS configuration on your server. This manual link is always available.
        </p>
      </section>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        {['all', '1', '2', '3', '4', '5'].map(x => (
          <button
            key={x}
            onClick={() => setRating(x)}
            className={`rounded-full border px-3 py-1.5 text-sm ${rating === x ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-300'}`}
          >
            {x === 'all' ? 'All ratings' : '⭐'.repeat(+x)}
          </button>
        ))}
        <span className="mx-2 text-slate-300">|</span>
        {['all', 'public', 'private'].map(x => (
          <button
            key={x}
            onClick={() => setVisibility(x)}
            className={`rounded-full border px-3 py-1.5 text-sm capitalize ${visibility === x ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-300'}`}
          >
            {x}
          </button>
        ))}
        <button onClick={downloadCsv} className="cn-btn-outline ml-auto text-sm">Download CSV</button>
      </div>

      {/* Reviews list */}
      {loading ? (
        <div className="mt-6 space-y-4">
          <div className="h-32 animate-pulse rounded-xl bg-slate-200" />
          <div className="h-32 animate-pulse rounded-xl bg-slate-200" />
        </div>
      ) : error ? (
        <p className="mt-6 rounded-xl bg-red-50 p-4 text-red-700">{error}</p>
      ) : filtered.length === 0 ? (
        <div className="mt-8 rounded-xl bg-slate-50 p-8 text-center text-slate-500">
          {r.length === 0
            ? 'No reviews yet. Share your review link with customers after their appointment.'
            : 'No reviews match these filters.'}
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {filtered.map(x => (
            <article key={x.id} className="cn-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-lg text-orange-500">{'★'.repeat(x.rating)}{'☆'.repeat(5 - x.rating)}</span>
                  <b className="text-slate-900">{x.customerFirstName}</b>
                  <span className="text-sm text-slate-500">{new Date(x.date).toLocaleDateString()}</span>
                </div>
                <div className="flex gap-2">
                  {x.private && (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">🔒 Private</span>
                  )}
                  {x.consent && x.showPublicly && !x.private && (
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs text-green-700">✓ Public</span>
                  )}
                  {x.consent && !x.showPublicly && (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">Consented — hidden</span>
                  )}
                  {!x.consent && (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-400">🔒 No consent</span>
                  )}
                </div>
              </div>

              {x.comment ? (
                <p className="mt-4 italic leading-7 text-slate-700">"{x.comment}"</p>
              ) : (
                <p className="mt-4 text-sm text-slate-400">No written comment.</p>
              )}

              {x.private && x.rating <= 3 && (
                <div className="mt-4 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
                  This review is private (1–3 stars). Only you can see it. Resolve the issue, then you can choose to make it public.
                </div>
              )}

              {x.ownerReply && (
                <div className="mt-4 rounded-lg bg-blue-50 p-3 text-sm">
                  <b className="text-blue-700">Your reply:</b> {x.ownerReply}
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-3">
                {x.consent && x.id && (
                  <button
                    className="text-sm font-semibold text-blue-600 hover:underline"
                    onClick={() => update(x.id!, { showPublicly: !x.showPublicly })}
                  >
                    {x.showPublicly ? 'Hide from public' : 'Show publicly'}
                  </button>
                )}
                <button
                  className="text-sm font-semibold text-blue-600 hover:underline"
                  onClick={() => { setReply(x.id || null); setText(x.ownerReply || ''); }}
                >
                  {x.ownerReply ? 'Edit reply' : 'Reply'}
                </button>
              </div>

              {reply === x.id && (
                <div className="mt-4">
                  <textarea
                    className="min-h-24 w-full rounded-lg border p-3 text-sm"
                    placeholder="Write your reply..."
                    value={text}
                    onChange={e => setText(e.target.value)}
                  />
                  <div className="mt-3 flex gap-3">
                    <button
                      disabled={busy}
                      className="cn-btn-primary text-sm"
                      onClick={() => x.id && update(x.id, { ownerReply: text })}
                    >
                      {busy ? 'Saving…' : 'Save reply'}
                    </button>
                    <button onClick={() => setReply(null)} className="cn-btn-outline text-sm">Cancel</button>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
