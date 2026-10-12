import { FormEvent, useEffect, useState } from 'react';
import { ChevronDown, Instagram, Facebook } from 'lucide-react';
import { submitForm } from '../lib/forms';

const faqs = [['Do I need to book in advance?', 'Yes, we recommend booking at least 3–5 days in advance for custom work.'], ['How long does a tattoo take?', 'It depends on size and complexity. Small pieces can take 1–2 hours, while sleeves require multiple sessions.'], ['Do you do cover-ups?', 'Yes, we specialise in cover-ups and reworkings.'], ['What aftercare do you provide?', 'Full aftercare guidance and advice is given with every tattoo.'], ['Do you offer other services?', 'Yes. We also offer piercings, dreadlocks, hair bleaching, microblading and more.']];

export default function Contact() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    document.title = 'Contact Kreative Hub | Lagos Tattoo Studio';
  }, []);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.phone || !form.message) {
      setError('Please complete your name, phone number and message.');
      return;
    }
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setSending(true);
    try {
      await submitForm('contact_messages', form);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send your message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return <div className="pt-28"><section className="border-b border-[#C9A84C] bg-[#111111] px-4 py-20 sm:px-6 lg:px-8 lg:py-28"><div className="mx-auto max-w-6xl"><p className="text-sm uppercase tracking-[0.3em] text-[#C9A84C]">Start a conversation</p><h1 className="mt-4 font-cinzel text-4xl sm:text-6xl">Contact Us</h1><p className="mt-5 max-w-2xl text-[#a0a0a0]">Have a concept, question or service enquiry? Reach Kreative Hub in Abule Egba, Ikeja.</p></div></section><section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-24">{sent ? <div className="border border-[#C9A84C] bg-[#1a1a1a] p-8"><h2 className="font-cinzel text-3xl text-[#C9A84C]">Message sent</h2><p className="mt-4 leading-relaxed text-[#a0a0a0]">Thanks for reaching out. Kreative Hub will get back to you shortly.</p></div> : <form onSubmit={submit} className="border border-[#2a2a2a] bg-[#1a1a1a] p-6 sm:p-10">{error && <p className="mb-5 border border-red-500/50 p-3 text-sm text-red-300">{error}</p>}{[['name', 'Name', 'text', true], ['phone', 'Phone', 'tel', true], ['email', 'Email', 'email', false]].map(([key, label, type, required]) => <label className="mt-5 block text-sm text-[#a0a0a0] first:mt-0" key={String(key)}>{String(label)}{Boolean(required) && <span className="text-[#C9A84C]"> *</span>}<input type={String(type)} required={Boolean(required)} value={form[String(key) as keyof typeof form]} onChange={(e) => setForm({ ...form, [String(key)]: e.target.value })} className="mt-2 h-11 w-full border border-[#2a2a2a] bg-[#0a0a0a] px-3 text-white outline-none focus:border-[#C9A84C]" /></label>)}<label className="mt-5 block text-sm text-[#a0a0a0]">Message<span className="text-[#C9A84C]"> *</span><textarea required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="mt-2 min-h-32 w-full border border-[#2a2a2a] bg-[#0a0a0a] p-3 text-white outline-none focus:border-[#C9A84C]" /></label><button disabled={sending} type="submit" className="gold-bg mt-8 h-12 w-full px-6 text-sm font-semibold uppercase tracking-widest text-black disabled:opacity-50">{sending ? 'Sending…' : 'Send Message'}</button></form>}<aside className="border-l-2 border-[#C9A84C] bg-[#1a1a1a] p-6 sm:p-8"><h2 className="font-cinzel text-2xl">Find Kreative Hub</h2><p className="mt-5 text-[#a0a0a0]">Abule Egba, Ikeja 100276, Lagos</p><a href="tel:07061145813" className="mt-4 block text-[#C9A84C]">0706 114 5813</a><a href="https://wa.me/2347061145813?text=Hi%20Kreative%20Hub%2C%20I%27d%20like%20to%20get%20in%20touch." target="_blank" rel="noreferrer noopener" className="mt-3 block text-[#25D366]">WhatsApp us</a><p className="mt-5 text-sm text-[#a0a0a0]">Hours: Demo — please update with your actual opening hours.</p><p className="mt-6 leading-relaxed text-sm text-[#a0a0a0]">Professional tattoos, piercing, dreadlocks, hair bleaching, microblading and other creative beauty services.</p><div className="mt-8 flex gap-4 text-[#C9A84C]"><a href="https://instagram.com" aria-label="Instagram"><Instagram /></a><a href="https://facebook.com" aria-label="Facebook"><Facebook /></a><span aria-label="TikTok" className="text-xl">♪</span></div><div className="mt-8 border border-[#2a2a2a] bg-[#0a0a0a] p-5"><p className="text-sm text-[#a0a0a0]">📍 Find us on Google Maps — Dallas Gold Kreativ Hub, Abule Egba, Ikeja</p><a className="mt-4 inline-flex border border-[#C9A84C] px-4 py-2 text-xs uppercase tracking-widest text-[#C9A84C]" href="https://www.google.com/maps/search/?api=1&query=Dallas+Gold+Kreativ+Hub+Abule+Egba+Ikeja+Lagos">Get Directions</a></div><p className="mt-8 text-[#C9A84C]">⭐ 5.0 / 5.0 on Google (1 Review)</p></aside></section><section className="border-t border-[#C9A84C] bg-[#111111] px-4 py-20 sm:px-6 lg:px-8 lg:py-28"><div className="mx-auto max-w-4xl"><h2 className="font-cinzel text-3xl sm:text-4xl">Frequently Asked Questions</h2><div className="mt-8 space-y-3">{faqs.map(([question, answer], index) => <div className="border border-[#2a2a2a] bg-[#1a1a1a]" key={question}><button onClick={() => setOpen(open === index ? null : index)} className="flex w-full items-center justify-between px-5 py-5 text-left font-medium">{question}<ChevronDown className={`text-[#C9A84C] transition ${open === index ? 'rotate-180' : ''}`} /></button>{open === index && <p className="px-5 pb-6 leading-relaxed text-[#a0a0a0]">{answer}</p>}</div>)}</div></div></section></div>;
}
