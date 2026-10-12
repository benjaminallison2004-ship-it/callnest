import { useEffect, useRef, useState } from 'react';
import { callAI } from '../../lib/ai';

export type ReceptionistConfig = {
  receptionistName: string;
  businessName: string;
  greeting: string;
  services: string;
  businessHours: string;
  bookingLink: string;
  faqs: string;
  transferNumber: string;
};

type Message = { role: 'caller' | 'receptionist'; text: string };

export default function ReceptionistDemo({ config }: { config: ReceptionistConfig }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const systemPrompt = `You are ${config.receptionistName || 'Aria'}, an AI receptionist for ${config.businessName || 'a local service business'}. You answer calls from customers who missed the business and are calling back.

Your opening greeting: "${config.greeting || "Hi, I'm the AI assistant for this business. How can I help you?"}"

Services offered: ${config.services || 'Not yet configured — set your services in the Settings tab.'}
Business hours: ${config.businessHours || 'Not configured yet.'}
Booking link: ${config.bookingLink || 'Not configured yet.'}
FAQs you know: ${config.faqs || 'No FAQs configured yet.'}
If the caller asks to speak to a human: ${config.transferNumber ? `offer to transfer them to ${config.transferNumber}` : 'explain the owner will call back shortly.'}

Be warm, professional, and concise. Answer questions confidently based on the information above. If you don't know something, say so and offer to have the owner follow up. Do NOT invent prices or services not listed above. Keep responses under 3 sentences — you're on a phone call.`;

  const send = async (value = input) => {
    const text = value.trim();
    if (!text || loading) return;
    setInput('');
    setMessages(current => [...current, { role: 'caller', text }]);
    setLoading(true);
    const response = await callAI(text, systemPrompt, 'gpt-mini');
    setMessages(current => [...current, { role: 'receptionist', text: response }]);
    setLoading(false);
  };

  return <div className="cn-card max-w-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
    <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
      <p className="text-sm font-semibold text-slate-900">Text call preview</p>
      <p className="mt-1 text-xs text-slate-500">{config.receptionistName || 'Aria'} · {config.businessName || 'Your business'}</p>
    </div>
    <div className="min-h-[340px] space-y-4 p-5">
      {messages.length === 0 && <div className="flex min-h-[270px] flex-col items-center justify-center text-center"><div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-xl">🎙️</div><p className="font-semibold text-slate-900">Start the conversation</p><p className="mt-1 text-sm text-slate-500">Try one of these caller questions.</p><div className="mt-5 flex max-w-lg flex-wrap justify-center gap-2">{['What services do you offer?', "I'd like to book an appointment", 'What are your prices?', 'Are you available today?'].map(chip => <button key={chip} type="button" onClick={() => send(chip)} className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 transition hover:border-blue-400 hover:text-blue-600">{chip}</button>)}</div></div>}
      {messages.map((message, index) => <div key={`${message.role}-${index}`} className={`flex ${message.role === 'caller' ? 'justify-end' : 'justify-start'}`}><div className="max-w-[82%]">{message.role === 'receptionist' && <p className="mb-1 text-xs font-medium text-slate-500">{config.receptionistName || 'Aria'}</p>}<div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${message.role === 'caller' ? 'rounded-br-sm bg-slate-100 text-slate-900' : 'rounded-bl-sm bg-blue-600 text-white'}`}>{message.text}</div></div></div>)}
      {loading && <div className="flex justify-start"><div className="rounded-2xl rounded-bl-sm bg-blue-600 px-4 py-3 text-sm text-white"><span className="animate-pulse">● ● ●</span></div></div>}
      <div ref={endRef} />
    </div>
    <div className="border-t border-slate-200 p-4"><div className="flex gap-2"><input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') void send(); }} disabled={loading} placeholder="Ask what a caller might ask..." className="cn-input min-w-0 flex-1" aria-label="Caller question" /><button type="button" onClick={() => void send()} disabled={loading || !input.trim()} className="cn-btn-primary">{loading ? 'Thinking...' : 'Send'}</button></div><button type="button" onClick={() => setMessages([])} className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-800">Reset conversation</button></div>
  </div>;
}