import { useRef } from 'react';
import { CheckCircle2, Quote, Star } from 'lucide-react';
import { useScrollAnimation } from '../lib/useScrollAnimation';

export default function ReviewsSection() {
  const ref = useRef<HTMLElement>(null);
  useScrollAnimation(ref);
  return <section ref={ref} id="reviews" className="border-t border-[#C9A84C] bg-[#111111] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
    <div className="mx-auto max-w-7xl">
      <div className="mb-12 text-center fade-in-up"><p className="text-sm uppercase tracking-[0.3em] text-[#C9A84C]">Real words from Google</p><h2 className="mt-3 font-cinzel text-4xl text-white sm:text-5xl">What Clients Say</h2></div>
      <div className="mx-auto max-w-4xl border-l-2 border-[#C9A84C] bg-[#1a1a1a] p-6 sm:p-10 fade-in-up">
        <Quote className="h-12 w-12 text-[#C9A84C]" />
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4"><div><h3 className="font-cinzel text-2xl text-white">Godwin Malik</h3><div className="mt-2 flex items-center gap-1 text-[#D4AF37]" aria-label="5 out of 5 stars">{[1,2,3,4,5].map(star => <Star key={star} className="h-4 w-4 fill-current" />)}<span className="ml-2 text-xs text-[#a0a0a0]">a month ago</span></div></div><span className="inline-flex items-center gap-2 border border-green-700 px-3 py-2 text-xs text-green-400"><CheckCircle2 className="h-4 w-4" />Verified Google Review</span></div>
        <p className="mt-8 text-xl leading-8 text-[#e5e5e5]">“Nice tattoo bro u get level ur work sharp”</p>
        <div className="mt-8 border-t border-[#2a2a2a] pt-6"><p className="text-xs uppercase tracking-widest text-[#C9A84C]">Studio response</p><p className="mt-3 text-sm leading-6 text-[#a0a0a0]">Thank you for trusting Dallas Gold Kreativ Hub. We truly appreciate your support and look forward to having you again. 🙏</p></div>
      </div>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-4 text-[#D4AF37] fade-in-up"><span className="font-cinzel text-3xl">5.0 / 5.0</span><span className="text-[#a0a0a0]">★★★★★ · 1 Google review</span></div>
      <div className="mt-12 grid gap-5 md:grid-cols-3">{['Your next review could be here.', 'Tell us about your new piece.', 'Share your Kreative Hub experience.'].map(text => <article key={text} className="border border-dashed border-[#444] bg-[#1a1a1a] p-6 text-center fade-in-up"><p className="text-xs uppercase tracking-widest text-[#777]">Demo — Add your own reviews here</p><p className="mt-5 italic leading-7 text-[#777]">“{text}”</p></article>)}</div>
    </div>
  </section>;
}