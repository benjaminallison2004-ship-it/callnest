import { useEffect, useRef } from 'react';
import { useScrollAnimation } from '../lib/useScrollAnimation';

const tattooServices = [
  ['📸', 'Photo-Realistic Tattoos', 'Detailed portraits, faces and scenes with dimensional shading.'],
  ['🧊', '3D-Style Tattoos', 'Visual depth and illusion designed to give your piece presence.'],
  ['🎨', 'Colour Ink Tattoos', 'Vibrant colour work planned around your skin and placement.'],
  ['✍️', 'Custom Lettering', 'Personal scripts, names and statements drawn for you.'],
  ['〰️', 'Fine Line Tattoos', 'Precise, delicate linework with an understated finish.'],
  ['⬛', 'Solid Blackwork', 'Confident shapes, contrast and bold graphic composition.'],
  ['💪', 'Sleeve Tattoos', 'Connected compositions that flow naturally around the arm.'],
  ['♻️', 'Cover-Ups & Reworks', 'Thoughtful redesigns that transform existing ink.'],
  ['🩹', 'Scar Camouflage', 'Sensitive, consultation-led work for selected scar areas.'],
  ['✦', 'Geometric & Mandala', 'Balanced geometry, symmetry and intentional detail.'],
  ['🐉', 'Japanese Style', 'Flowing traditional-inspired pieces with strong movement.'],
  ['◒', 'Tribal Designs', 'Bold rhythmic patterns built for impact and flow.'],
  ['👥', 'Figurative Tattoos', 'Meaningful silhouettes and human stories rendered in ink.']
];

const beautyServices = [
  ['💎', 'Nose & Ear Piercing', 'Clean, considered piercing services for your personal style.'],
  ['✨', 'Eyebrow Piercing', 'A sharp facial accent with professional guidance.'],
  ['⛓️', 'Industrial Piercings', 'Statement ear styling planned with placement in mind.'],
  ['🧶', 'Dreadlock Extensions', 'Add length, fullness and character to your loc journey.'],
  ['🔄', 'Dreadlock Retwist & Maintenance', 'Refresh, retwist and maintain your locs with care.'],
  ['🌟', 'Hair Bleaching', 'Bold colour preparation with an expressive finish.'],
  ['💫', 'Jerry Curls', 'A distinctive textured hair look tailored to you.'],
  ['🖊️', 'Microblading', 'Defined brows shaped to complement your features.'],
  ['👁️', 'Permanent Eyeliner', 'A polished eye look designed for everyday confidence.'],
  ['💋', 'Pink Lips Balm', 'A soft, refreshed lip tint treatment.'],
  ['🍽️', 'Private Chef & Catering', 'Creative food service for private occasions and events.']
];

function ServiceGroup({ title, items }: { title: string; items: string[][] }) {
  return <div className="fade-in-up">
    <h3 className="mb-6 font-cinzel text-xl tracking-widest text-[#C9A84C]">{title}</h3>
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(([icon, name, description]) => <article key={name} className="border-l-2 border-[#C9A84C] bg-[#1a1a1a] p-6 transition duration-200 hover:border hover:border-[#C9A84C] hover:shadow-[0_0_20px_rgba(201,168,76,0.15)]">
        <div className="mb-4 text-2xl" aria-hidden="true">{icon}</div>
        <h4 className="font-cinzel text-lg text-white">{name}</h4>
        <p className="mt-3 text-sm leading-6 text-[#a0a0a0]">{description}</p>
      </article>)}
    </div>
  </div>;
}

export default function ServicesSection() {
  const ref = useRef<HTMLElement>(null);
  useScrollAnimation(ref);
  useEffect(() => { document.title = 'Services | Kreative Hub'; }, []);
  return <section ref={ref} id="services" className="border-t border-[#C9A84C] bg-[#111111] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
    <div className="mx-auto max-w-7xl">
      <div className="mb-12 fade-in-up"><p className="text-sm uppercase tracking-[0.3em] text-[#C9A84C]">Crafted for your expression</p><h2 className="mt-3 font-cinzel text-4xl text-white sm:text-5xl">Our Services</h2></div>
      <div className="space-y-16"><ServiceGroup title="Tattoo Services" items={tattooServices} /><ServiceGroup title="Beauty Services" items={beautyServices} /></div>
    </div>
  </section>;
}