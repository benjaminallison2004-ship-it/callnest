import { FormEvent, useState } from 'react';
import { MessageCircle, Send, Sparkles, X } from 'lucide-react';

const whatsappUrl = "https://wa.me/2347061145813?text=Hi%20Kreative%20Hub%2C%20I%27d%20like%20to%20enquire%20about%20a%20tattoo%20appointment.";
const welcome = 'Welcome to Kreative Hub! ✨ I can help you explore tattoo designs, understand our services, get pricing guidance, and start a booking enquiry. What are you looking for today?';

type Message = { role: 'assistant' | 'user'; text: string };

function replyFor(text: string) {
  const lower = text.toLowerCase();
  if (lower.includes('price')) return 'Our demo starting ranges are ₦15,000 for smaller pieces, ₦35,000 for signature custom work and ₦80,000 for larger masterpieces. Final quotes depend on size, placement and detail.';
  if (lower.includes('book') || lower.includes('appointment')) return 'You can start through our booking form, and the studio will confirm availability directly. For a faster response, WhatsApp us on 0706 114 5813.';
  if (lower.includes('design') || lower.includes('gallery')) return 'Explore the Design Gallery for inspiration, then use Try On to visualise a selected concept before sending your enquiry.';
  return 'I can help you browse designs, understand our services or start a booking enquiry. Tell me what kind of tattoo or service you have in mind.';
}

export default function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{ role: 'assistant', text: welcome }]);

  const send = async (event: FormEvent) => {
    event.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    setInput(''); setMessages(current => [...current, { role: 'user', text }]); setSending(true);
    await new Promise(resolve => setTimeout(resolve, 450));
    setMessages(current => [...current, { role: 'assistant', text: replyFor(text) }]);
    setSending(false);
  };

  return <>
    {open && <section className="fixed bottom-24 right-4 z-50 flex h-[min(590px,calc(100vh-7rem))] w-[calc(100vw-2rem)] max-w-[380px] flex-col border border-[#C9A84C] bg-[#111111] shadow-[0_0_30px_rgba(0,0,0,0.6)]" aria-label="Kreative Hub AI Assistant">
      <header className="flex items-center justify-between border-b border-[#2a2a2a] p-5"><div><h2 className="font-cinzel text-lg text-[#C9A84C]">Kreative Hub AI</h2><p className="mt-1 text-xs text-[#888]">Design & Booking Assistant</p></div><button onClick={() => setOpen(false)} aria-label="Close assistant" className="p-2 text-[#C9A84C] hover:bg-[#1a1a1a]"><X className="h-5 w-5" /></button></header>
      <div className="flex-1 space-y-4 overflow-y-auto p-4">{messages.map((message, index) => <div key={`${message.role}-${index}`} className={`max-w-[90%] p-3 text-sm leading-6 ${message.role === 'user' ? 'ml-auto bg-[#C9A84C] text-black' : 'border-l-2 border-[#C9A84C] bg-[#1a1a1a] text-[#ddd]'}`}>{message.text}</div>)}{messages.length === 1 && <div className="flex flex-wrap gap-2">{['Browse designs', 'Pricing info', 'Book appointment'].map(chip => <button key={chip} onClick={() => setInput(chip)} className="border border-[#C9A84C] px-3 py-2 text-xs text-[#C9A84C] hover:bg-[#C9A84C] hover:text-black">{chip}</button>)}<a href="https://wa.me/2347061145813?text=Hi%20Kreative%20Hub%2C%20I%27d%20like%20to%20enquire%20about%20a%20tattoo%20appointment." target="_blank" rel="noreferrer noopener" className="border border-[#25D366] px-3 py-2 text-xs text-[#25D366] hover:bg-[#25D366] hover:text-black">WhatsApp us</a></div>}{sending && <div className="text-xs text-[#C9A84C]">Thinking…</div>}</div>
      <div className="border-t border-[#2a2a2a] p-3"><form onSubmit={send} className="flex gap-2"><input value={input} onChange={event => setInput(event.target.value)} placeholder="Ask about designs or booking" aria-label="Message the assistant" className="h-11 min-w-0 flex-1 border border-[#2a2a2a] bg-[#0a0a0a] px-3 text-sm text-white outline-none focus:border-[#C9A84C]" /><button type="submit" disabled={sending || !input.trim()} aria-label="Send message" className="gold-bg inline-flex h-11 w-11 shrink-0 items-center justify-center text-black disabled:cursor-not-allowed disabled:opacity-50"><Send className="h-4 w-4" /></button></form><a href={whatsappUrl} target="_blank" rel="noreferrer noopener" className="mt-3 inline-block text-xs text-[#25D366] hover:underline">Prefer WhatsApp? Chat with the studio →</a></div>
    </section>}
    <button onClick={() => setOpen(current => !current)} aria-label={open ? 'Close AI Assistant' : 'Open AI Assistant'} className="fixed bottom-[5.5rem] right-5 z-50 inline-flex h-12 w-fit items-center gap-2 border border-[#C9A84C] bg-[#1a1a1a] px-4 text-xs uppercase tracking-widest text-[#C9A84C] shadow-[0_0_20px_rgba(201,168,76,0.15)] transition hover:bg-[#C9A84C] hover:text-black"><Sparkles className="h-5 w-5" /><span className="hidden sm:inline">AI Assistant</span><MessageCircle className="h-4 w-4 sm:hidden" /></button>
  </>;
}
