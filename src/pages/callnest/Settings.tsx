import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { db } from '../../lib/db'
import { eventsToCSV } from '../../lib/callnest/events'
import { reviewsToCSV, CallnestReview } from '../../lib/callnest/reviewHelpers'

export default function Settings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    businessName: '',
    servicePrice: '',
    googleReviewLink: '',
    showReviews: true,
    respectOptOut: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const [deletion, setDeletion] = useState(false);

  useEffect(() => {
    document.title = 'Settings | Callnest';
    db.mine('callnest_settings')
      .then((x: any) => {
        if (x) setSettings(s => ({ ...s, ...x, servicePrice: String(x.servicePrice ?? '') }));
      })
      .catch((x: any) => setError(x?.message || 'Could not load settings.'))
      .finally(() => setLoading(false));
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await db.saveMine('callnest_settings', {
        ...settings,
        servicePrice: parseFloat(settings.servicePrice) || null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (x: any) {
      setError(x?.message || 'Could not save settings.');
    } finally {
      setSaving(false);
    }
  };

  const downloadEvents = async () => {
    try {
      // Events are stored with db.add (authenticated, scoped) — read with db.list
      const rows = await db.list('callnest_events');
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([eventsToCSV(rows as any)], { type: 'text/csv' }));
      a.download = 'callnest-events.csv';
      a.click();
    } catch (x: any) { setError(x?.message || 'Could not export events.'); }
  };

  const downloadReviews = async () => {
    try {
      // Reviews are stored with db.addPublic — read with db.listPublic, filter by owner
      const rows = await db.listPublic('callnest_reviews');
      const mine = (rows as CallnestReview[]).filter(x => x.business_id === user?.id);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([reviewsToCSV(mine)], { type: 'text/csv' }));
      a.download = 'callnest-reviews.csv';
      a.click();
    } catch (x: any) { setError(x?.message || 'Could not export reviews.'); }
  };

  const del = async () => {
    setDeletion(true);
    try {
      await db.add('callnest_deletion_requests', {
        userId: user?.id,
        email: user?.email,
        requestedAt: new Date().toISOString(),
      });
      setDeleteConfirm(false);
      setDeleteText('');
      setError('Deletion request submitted. We\'ll process this within 30 days.');
    } catch (x: any) {
      setError(x?.message || 'Could not submit deletion request.');
    } finally {
      setDeletion(false);
    }
  };

  if (loading) return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <div className="h-64 animate-pulse rounded-xl bg-slate-200" />
    </main>
  );

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-black">Settings</h1>

      <form onSubmit={save} className="cn-card mt-8 max-w-2xl space-y-5">
        <h2 className="text-xl font-bold">Business information</h2>

        <label className="block font-semibold">
          Business Name
          <input
            type="text"
            className="mt-2 h-11 w-full rounded-lg border px-3"
            value={settings.businessName}
            onChange={e => setSettings({ ...settings, businessName: e.target.value })}
            placeholder="e.g. Dave's Pest Control"
          />
          <span className="text-xs text-slate-500 mt-1 block">Used on your results card and public booking page.</span>
        </label>

        <label className="block font-semibold">
          Service price (your average job value)
          <div className="relative mt-2">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              className="h-11 w-full rounded-lg border px-3 pl-7"
              value={settings.servicePrice}
              onChange={e => setSettings({ ...settings, servicePrice: e.target.value })}
              placeholder="150"
            />
          </div>
          <span className="text-xs text-slate-500 mt-1 block">Used to estimate revenue recovered in your dashboard. Leave blank to hide the revenue figure.</span>
        </label>

        <label className="block font-semibold">
          Google review link
          <input
            type="url"
            className="mt-2 h-11 w-full rounded-lg border px-3"
            value={settings.googleReviewLink}
            onChange={e => setSettings({ ...settings, googleReviewLink: e.target.value })}
            placeholder="https://g.page/r/..."
          />
          <span className="text-xs text-slate-500 mt-1 block">Customers leaving 4–5★ reviews will see an option to also leave a Google review.</span>
        </label>

        <label className="flex items-center gap-3 font-semibold">
          <input
            type="checkbox"
            checked={settings.showReviews}
            onChange={e => setSettings({ ...settings, showReviews: e.target.checked })}
          />
          Show reviews on my public booking page
        </label>

        <label className="flex items-center gap-3 text-slate-500">
          <input type="checkbox" checked readOnly className="opacity-60" />
          Respect SMS opt-outs (always on — cannot be disabled)
        </label>

        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {saved && <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">✅ Settings saved</p>}

        <button disabled={saving} type="submit" className="cn-btn-primary">
          {saving ? 'Saving…' : 'Save settings'}
        </button>
      </form>

      <section className="cn-card mt-8 max-w-2xl">
        <h2 className="text-xl font-bold">Your data</h2>
        <p className="mt-2 text-sm text-slate-500">Your data belongs to you. Download everything at any time.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button onClick={downloadEvents} className="cn-btn-outline text-sm">Export events CSV</button>
          <button onClick={downloadReviews} className="cn-btn-outline text-sm">Export reviews CSV</button>
        </div>
      </section>

      <section className="cn-card mt-8 max-w-2xl border-amber-200 bg-amber-50">
        <h2 className="font-bold">SMS opt-outs</h2>
        <p className="mt-2 text-sm text-amber-800">
          Customers can reply STOP to any Callnest text to opt out. Opt-outs are stored and respected automatically.
          You can view opt-out records in your Sitedrop Cloud dashboard.
        </p>
        <p className="mt-2 text-sm text-amber-800">
          Opt-outs must be honoured immediately to comply with SMS regulations.
        </p>
      </section>

      <section className="cn-card mt-8 max-w-2xl border-red-200 bg-red-50">
        <h2 className="font-bold text-red-800">Account deletion</h2>
        <p className="mt-2 text-sm text-red-700">
          Deleting your account will remove your events, reviews, and settings. This cannot be undone.
        </p>
        {!deleteConfirm ? (
          <button
            onClick={() => setDeleteConfirm(true)}
            className="cn-btn-outline mt-5 border-red-400 text-sm text-red-700"
          >
            Request account deletion
          </button>
        ) : (
          <div className="mt-5">
            <p className="text-sm font-semibold text-red-800">Type DELETE to confirm:</p>
            <input
              className="mt-2 h-11 w-full rounded-lg border border-red-300 px-3"
              value={deleteText}
              onChange={e => setDeleteText(e.target.value)}
            />
            <div className="mt-4 flex gap-3">
              <button onClick={() => { setDeleteConfirm(false); setDeleteText(''); }} className="cn-btn-outline text-sm">
                Cancel
              </button>
              <button
                disabled={deleteText !== 'DELETE' || deletion}
                onClick={del}
                className="cn-btn-primary bg-red-600 text-sm hover:bg-red-700 disabled:opacity-50"
              >
                {deletion ? 'Sending…' : 'Submit deletion request'}
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
