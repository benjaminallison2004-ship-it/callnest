import { FormEvent, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { submitForm } from '../lib/forms';
import { TattooDesign } from '../data/tattooDesigns';

export default function Booking() {
  const location = useLocation();
  const passed = location.state?.design as TattooDesign | undefined;
  const [form, setForm] = useState({ name: '', phone: '', email: '', date: '', time: 'Morning 9am-12pm', design: passed?.name || '', placement: 'Arm', size: 'Small <3 inches', description: '', service: 'Tattoo', referral: 'Google', terms: false });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState('');

  useEffect(() => {
    document.title = 'Book an Appointment | Kreative Hub';
  }, []);

  const update = (key: string, value: string | boolean) => setForm((old) => ({ ...old, [key]: value }));

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFieldError('');
    setError('');

    if (!form.name || !form.phone || !form.date || !form.design || !form.terms) {
      setFieldError('Please complete all required fields and agree to the enquiry terms.');
      return;
    }

    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) {
      setFieldError('Please enter a valid email address.');
      return;
    }

    setSending(true);
    try {
      await submitForm('booking_enquiries', form);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send your enquiry. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const fields = [['name', 'Full Name', 'text'], ['phone', 'Phone Number', 'tel'], ['email', 'Email Address', 'email'], ['date', 'Preferred Date', 'date']];

  return <div className="pt-28"><section className="border-b border-[#C9A84C] bg-[#111111] px-4 py-20 sm:px-6 lg:px-8 lg:py-28"><div className="mx-auto max-w-6xl"><p className="text-sm uppercase tracking-[0.3em] text-[#C9A84C]">Start your enquiry</p><h1 className="mt-4 font-cinzel text-4xl sm:text-6xl">Book an Appointment</h1><p className="mt-5 text-[#a0a0a0]">Fill in your details and we'll confirm your session. Your appointment is not confirmed until direct confirmation.</p></div></section><section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.25fr_0.75fr] lg:px-8 lg:py-24">{sent ? <div className="border border-[#C9A84C] bg-[#1a1a1a] p-8"><h2 className="font-cinzel text-3xl text-[#C9A84C]">Enquiry received</h2><p className="mt-5 leading-relaxed text-[#a0a0a0]">Your booking enquiry has been sent! Kreative Hub will contact you within 24 hours to confirm your appointment.</p><a className="mt-8 inline-flex border border-[#25D366] px-5 py-3 text-sm text-[#25D366]" href="https://wa.me/2347061145813?text=Hi%20Kreative%20Hub%2C%20I%27d%20like%20to%20book%20an%20appointment.%20I%20just%20submitted%20an%20enquiry%20form." target="_blank" rel="noreferrer noopener">For faster response, chat us on WhatsApp →</a></div> : <form onSubmit={submit} className="border border-[#2a2a2a] bg-[#1a1a1a] p-6 sm:p-8">{fieldError && <p className="mb-5 border border-red-500/50 p-3 text-sm text-red-300">{fieldError}</p>}{error && <p className="mb-5 border border-red-500/50 p-3 text-sm text-red-300">{error}</p>}<div className="grid gap-5 sm:grid-cols-2">{fields.map(([key, label, type]) => <label className="block text-sm text-[#a0a0a0]" key={key}>{label}{key !== 'email' && <span className="text-[#C9A84C]"> *</span>}<input required={key !== 'email'} type={type} value={form[key as keyof typeof form] as string} onChange={(e) => update(key, e.target.value)} className="mt-2 h-11 w-full border border-[#2a2a2a] bg-[#0a0a0a] px-3 text-white outline-none focus:border-[#C9A84C]" /></label>)}</div><div className="mt-5 grid gap-5 sm:grid-cols-2">{[['time', 'Preferred Time', ['Morning 9am-12pm', 'Afternoon 12pm-4pm', 'Evening 4pm-5pm']], ['placement', 'Body Placement', ['Arm', 'Forearm', 'Upper Arm', 'Shoulder', 'Back', 'Chest', 'Leg', 'Thigh', 'Ankle', 'Wrist', 'Neck', 'Other']], ['size', 'Approximate Size', ['Small <3 inches', 'Medium 3-6 inches', 'Large 6-10 inches', 'Extra Large / Sleeve']], ['service', 'Service Type', ['Tattoo', 'Piercing', 'Dreadlocks', 'Hair Service', 'Microblading', 'Other']], ['referral', 'How did you hear about us?', ['Google', 'Instagram', 'Facebook', 'Friend/Referral', 'WhatsApp', 'Other']]].map(([key, label, options]) => <label className="block text-sm text-[#a0a0a0]" key={String(key)}>{String(label)}<select value={form[String(key) as keyof typeof form] as string} onChange={(e) => update(String(key), e.target.value)} className="mt-2 h-11 w-full border border-[#2a2a2a] bg-[#0a0a0a] px-3 text-white outline-none focus:border-[#C9A84C]">{(options as string[]).map((option) => <option key={option}>{option}</option>)}</select></label>)}</div><label className="mt-5 block text-sm text-[#a0a0a0]">Tattoo Design / Concept<span className="text-[#C9A84C]"> *</span><input required value={form.design} onChange={(e) => update('design', e.target.value)} className="mt-2 h-11 w-full border border-[#2a2a2a] bg-[#0a0a0a] px-3 text-white outline-none focus:border-[#C9A84C]" /></label><label className="mt-5 block text-sm text-[#a0a0a0]">Description / Reference Notes<textarea value={form.description} onChange={(e) => update('description', e.target.value)} className="mt-2 min-h-32 w-full border border-[#2a2a2a] bg-[#0a0a0a] p-3 text-white outline-none focus:border-[#C9A84C]" /></label><label className="mt-5 flex gap-3 text-sm text-[#a0a0a0]"><input type="checkbox" checked={form.terms} onChange={(e) => update('terms', e.target.checked)} className="mt-1 accent-[#C9A84C]" />I understand this is an enquiry request and appointment is subject to artist availability.</label><button disabled={sending} type="submit" className="gold-bg mt-8 h-12 w-full px-6 text-sm font-semibold uppercase tracking-widest text-black disabled:opacity-50">{sending ? 'Sending…' : 'Send Booking Request'}</button></form>}<aside className="border-l-2 border-[#C9A84C] bg-[#1a1a1a] p-6 sm:p-8"><h2 className="font-cinzel text-2xl">Visit the Studio</h2><p className="mt-5 leading-relaxed text-[#a0a0a0]">Abule Egba, Ikeja 100276, Lagos</p><a href="tel:07061145813" className="mt-3 block text-[#C9A84C]">0706 114 5813</a><p className="mt-5 text-sm text-[#a0a0a0]">Hours: Demo — please confirm your actual opening hours.</p><h3 className="mt-10 font-cinzel text-xl">What to expect</h3><ol className="mt-4 space-y-3 text-sm text-[#a0a0a0]"><li>1. Submit your enquiry</li><li>2. Receive a confirmation call or message</li><li>3. Pay a deposit if required</li><li>4. Attend your session</li><li>5. Enjoy your new ink</li></ol><p className="mt-10 border-t border-[#2a2a2a] pt-5 text-sm text-[#C9A84C]">Professional aftercare guidance is provided with every tattoo.</p></aside></section></div>;
}
