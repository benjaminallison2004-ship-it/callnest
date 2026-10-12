import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/db';
import { CallnestEvent } from '../../lib/callnest/events';

type Filter = 'all' | 'booked' | 'no_answer' | 'completed';

type TestFormProps = {
  phone: string;
  setPhone: (value: string) => void;
  outcome: string;
  setOutcome: (value: string) => void;
  booked: boolean;
  setBooked: (value: boolean) => void;
  duration: string;
  setDuration: (value: string) => void;
  saving: boolean;
  addTest: (event: FormEvent<HTMLFormElement>) => Promise<void>;
};

export default function CallLog() {
  const { user } = useAuth();
  const [events, setEvents] = useState<CallnestEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [showTest, setShowTest] = useState(false);
  const [phone, setPhone] = useState('');
  const [outcome, setOutcome] = useState('completed');
  const [booked, setBooked] = useState(false);
  const [duration, setDuration] = useState('60');
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');

    try {
      const rows = await db.list('callnest_events');
      setEvents(
        (rows as CallnestEvent[]).filter((event) =>
          ['ai_callback_made', 'ai_reply_sent'].includes(event.event_type),
        ),
      );
    } catch (e: any) {
      setError(e?.message || 'Could not load call log.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Call Log | Callnest';
    void load();
  }, []);

  const calls = useMemo(
    () => events.filter((event) => event.event_type === 'ai_callback_made'),
    [events],
  );

  const filtered = useMemo(
    () =>
      calls.filter(
        (event) =>
          filter === 'all' ||
          (filter === 'booked'
            ? event.meta?.booked === 'true'
            : event.meta?.outcome === filter.replace('_', '-')),
      ),
    [calls, filter],
  );

  const durations = calls.filter(
    (event) => Number(event.meta?.duration_seconds) > 0,
  );
  const avg =
    durations.reduce(
      (sum, event) => sum + Number(event.meta?.duration_seconds),
      0,
    ) / (durations.length || 1);

  const addTest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!phone.trim() || !user) return;

    setSaving(true);
    setError('');

    try {
      const created = await db.add('callnest_events', {
        business_id: user.id,
        event_type: 'ai_callback_made',
        timestamp: new Date().toISOString(),
        meta: {
          caller: `****${phone.replace(/\D/g, '').slice(-4)}`,
          outcome,
          booked: booked ? 'true' : 'false',
          duration_seconds: Number(duration) || 0,
          transcript: 'Test call entry.',
          call_id: `test-${Date.now()}`,
        },
      });

      setEvents((current) => [...current, created as CallnestEvent]);
      setShowTest(false);
      setPhone('');
    } catch (e: any) {
      setError(e?.message || 'Could not add test call.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
          Callnest workspace
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">Call Log</h1>
        <p className="mt-3 text-slate-600">
          All AI receptionist calls handled by Callnest.
        </p>
      </header>

      {error && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          <span>{error}</span>
          <button onClick={() => void load()} className="font-semibold underline">
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-28 animate-pulse bg-slate-100" />
          ))}
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-4">
            {[
              ['Total calls', calls.length],
              ['Booked', calls.filter((event) => event.meta?.booked === 'true').length],
              ['No answer', calls.filter((event) => event.meta?.outcome === 'no-answer').length],
              ['Avg duration', `${Math.round(avg)}s`],
            ].map(([label, value]) => (
              <div key={String(label)} className="cn-card bg-white p-5">
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
              </div>
            ))}
          </div>

          {calls.length === 0 ? (
            <section className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-8">
              <h2 className="text-xl font-bold text-slate-950">📞 No calls logged yet</h2>
              <p className="mt-3 text-slate-700">
                Your AI Receptionist call log will populate here automatically once your backend server is connected to Bland AI.
              </p>
              <p className="mt-5 font-semibold text-slate-900">To get started, your server needs to:</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-700">
                <li>Call Bland AI's API when a call is missed.</li>
                <li>Receive Bland's webhook when the call finishes.</li>
                <li>Write one event to callnest_events with event_type 'ai_callback_made'.</li>
              </ol>
              <p className="mt-5 text-sm text-slate-700">
                Once that's done, every call appears here in real time — with the caller's number (masked), call duration, outcome, and transcript.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/receptionist" className="cn-btn-primary">
                  Set up my receptionist →
                </Link>
                <button onClick={() => setShowTest((value) => !value)} className="cn-btn-outline">
                  Log a test call
                </button>
              </div>
              {showTest && (
                <TestForm
                  phone={phone}
                  setPhone={setPhone}
                  outcome={outcome}
                  setOutcome={setOutcome}
                  booked={booked}
                  setBooked={setBooked}
                  duration={duration}
                  setDuration={setDuration}
                  saving={saving}
                  addTest={addTest}
                />
              )}
            </section>
          ) : (
            <>
              <div className="mt-8 flex flex-wrap gap-2">
                {(['all', 'booked', 'no_answer', 'completed'] as Filter[]).map((item) => (
                  <button
                    key={item}
                    onClick={() => setFilter(item)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold ${
                      filter === item ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {item === 'all' ? 'All' : item === 'no_answer' ? 'No answer' : item[0].toUpperCase() + item.slice(1)}
                  </button>
                ))}
              </div>

              <div className="cn-card mt-4 overflow-x-auto bg-white">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="p-4">Time</th>
                      <th className="p-4">Caller</th>
                      <th className="p-4">Duration</th>
                      <th className="p-4">Outcome</th>
                      <th className="p-4">Booked</th>
                      <th className="p-4">Transcript</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((event, index) => {
                      const transcript = String(event.meta?.transcript || '');
                      const eventKey = event.id || `${event.timestamp}-${index}`;
                      const isExpanded = expanded === event.id;

                      return (
                        <tr key={eventKey} className="border-b border-slate-100">
                          <td className="p-4 text-slate-600">{new Date(event.timestamp).toLocaleString()}</td>
                          <td className="p-4 font-medium">{event.meta?.caller || 'Unknown'}</td>
                          <td className="p-4">{event.meta?.duration_seconds ? `${event.meta.duration_seconds}s` : '—'}</td>
                          <td className="p-4">
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold">
                              {event.meta?.outcome || 'unknown'}
                            </span>
                          </td>
                          <td className="p-4">{event.meta?.booked === 'true' ? '✅ Yes' : '—'}</td>
                          <td className="max-w-xs p-4 text-slate-600">
                            {transcript ? (
                              <>
                                <span>{isExpanded ? transcript : `${transcript.slice(0, 100)}${transcript.length > 100 ? '…' : ''}`}</span>
                                {transcript.length > 100 && (
                                  <button
                                    onClick={() => setExpanded(isExpanded ? null : event.id || null)}
                                    className="ml-2 font-semibold text-blue-600"
                                  >
                                    {isExpanded ? 'Show less' : 'Show more'}
                                  </button>
                                )}
                              </>
                            ) : (
                              '—'
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="mt-5 text-sm text-slate-500">
                Caller numbers are masked for privacy. Full numbers are never stored in the Callnest database — only the last 4 digits.
              </p>
            </>
          )}
        </>
      )}

      {calls.length > 0 && (
        <Link to="/receptionist" className="mt-6 inline-flex font-semibold text-blue-600">
          Configure your AI receptionist →
        </Link>
      )}
    </div>
  );
}

function TestForm({
  phone,
  setPhone,
  outcome,
  setOutcome,
  booked,
  setBooked,
  duration,
  setDuration,
  saving,
  addTest,
}: TestFormProps) {
  const handlePhoneChange = (event: ChangeEvent<HTMLInputElement>) => setPhone(event.target.value);
  const handleOutcomeChange = (event: ChangeEvent<HTMLSelectElement>) => setOutcome(event.target.value);
  const handleDurationChange = (event: ChangeEvent<HTMLInputElement>) => setDuration(event.target.value);
  const handleBookedChange = (event: ChangeEvent<HTMLInputElement>) => setBooked(event.target.checked);

  return (
    <form onSubmit={addTest} className="mt-6 grid gap-4 border-t border-blue-200 pt-5 sm:grid-cols-2">
      <label className="text-sm font-semibold">
        Caller number
        <input required type="tel" value={phone} onChange={handlePhoneChange} placeholder="+1 (555) 0142" className="cn-input mt-2 w-full" />
      </label>
      <label className="text-sm font-semibold">
        Outcome
        <select value={outcome} onChange={handleOutcomeChange} className="cn-input mt-2 w-full">
          <option value="completed">Completed</option>
          <option value="no-answer">No answer</option>
          <option value="busy">Busy</option>
        </select>
      </label>
      <label className="text-sm font-semibold">
        Duration in seconds
        <input type="number" min="0" value={duration} onChange={handleDurationChange} className="cn-input mt-2 w-full" />
      </label>
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input type="checkbox" checked={booked} onChange={handleBookedChange} />
        Booked
      </label>
      <button disabled={saving} type="submit" className="cn-btn-primary sm:col-span-2">
        {saving ? 'Saving...' : 'Add test call'}
      </button>
    </form>
  );
}
