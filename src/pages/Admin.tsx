import { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { db } from '../lib/db';

interface Row { id: string; [key: string]: unknown }

function setSeo() {
  document.title = 'Admin | Callnest';
  const description = 'Callnest administration workspace.';
  let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
  if (!meta) { meta = document.createElement('meta'); meta.name = 'description'; document.head.appendChild(meta); }
  meta.content = description;
}

const display = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

export default function Admin() {
  const [designs, setDesigns] = useState<Row[]>([]);
  const [submissions, setSubmissions] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const [designRows, submissionResult] = await Promise.all([
        db.listPublic('tattoo_designs'),
        db.listMany(['inbox_contact', 'inbox_early_access']),
      ]);
      const result = submissionResult as Record<string, Row[]>;
      const contacts = result.inbox_contact || [];
      const earlyAccess = result.inbox_early_access || [];
      setDesigns(designRows as Row[]);
      setSubmissions([...contacts, ...earlyAccess]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load admin data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { setSeo(); void load(); }, [load]);

  return (
    <section className="min-h-screen bg-[#f8fafc] px-4 py-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-5 border-b border-slate-200 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-xs font-semibold tracking-[0.2em] text-[#a48635]">CALLNEST ADMIN</p><h1 className="mt-3 font-cinzel text-3xl font-bold text-slate-900">Workspace overview</h1><p className="mt-2 text-sm text-slate-600">Review shared design records and visitor submissions.</p></div>
          <button type="button" onClick={() => void load(true)} disabled={loading || refreshing} className="inline-flex h-11 w-fit shrink-0 items-center gap-2 border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:border-[#a48635] disabled:cursor-not-allowed disabled:opacity-60"><RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />{refreshing ? 'Refreshing…' : 'Refresh data'}</button>
        </div>
        {error && <div role="alert" className="mt-8 flex flex-wrap items-center gap-4 border border-red-200 bg-red-50 p-4 text-sm text-red-800"><span className="min-w-0 flex-1">{error}</span><button type="button" onClick={() => void load()} className="font-semibold underline underline-offset-4">Try again</button></div>}
        {loading ? <div className="mt-8 grid gap-8 lg:grid-cols-2"><div className="h-64 animate-pulse bg-slate-200" /><div className="h-64 animate-pulse bg-slate-200" /></div> : <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <section className="border border-slate-200 bg-white p-5 sm:p-7"><h2 className="font-cinzel text-xl font-bold text-slate-900">Design records</h2>{designs.length === 0 ? <p className="mt-6 text-sm text-slate-600">No design records have been saved yet.</p> : <div className="mt-6 overflow-x-auto"><table className="w-full min-w-[520px] text-left text-sm"><thead><tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500"><th className="pb-3 pr-4">Name</th><th className="pb-3 pr-4">Category</th><th className="pb-3">Style</th></tr></thead><tbody>{designs.map(row => <tr key={row.id} className="border-b border-slate-100"><td className="py-4 pr-4 font-medium text-slate-900">{display(row.name)}</td><td className="py-4 pr-4 text-slate-600">{display(row.category)}</td><td className="py-4 text-slate-600">{display(row.style)}</td></tr>)}</tbody></table></div>}</section>
          <section className="border border-slate-200 bg-white p-5 sm:p-7"><h2 className="font-cinzel text-xl font-bold text-slate-900">Visitor submissions</h2>{submissions.length === 0 ? <p className="mt-6 text-sm text-slate-600">No visitor submissions have arrived yet.</p> : <div className="mt-6 space-y-4">{submissions.map(row => <article key={row.id} className="border-b border-slate-100 pb-4 last:border-0"><div className="flex flex-wrap gap-x-4 gap-y-1 text-sm"><strong className="text-slate-900">{display(row.name || row.email || row.company)}</strong><span className="text-slate-500">{display(row.email)}</span></div><p className="mt-2 break-words text-sm leading-6 text-slate-600">{display(row.message || row.notes || row.interest || row.status)}</p></article>)}</div>}</section>
        </div>}
      </div>
    </section>
  );
}
