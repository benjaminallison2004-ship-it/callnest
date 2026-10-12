import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import HeroSection from '../components/HeroSection';
import FeaturedDesigns from '../components/FeaturedDesigns';
import StyleCategories from '../components/StyleCategories';
import StudioIntro from '../components/StudioIntro';
import ServicesSection from '../components/ServicesSection';
import PricingSection from '../components/PricingSection';
import ReviewsSection from '../components/ReviewsSection';

function SEO() {
  useEffect(() => {
    document.title = 'Kreative Hub | Premium Tattoo Studio in Lagos';
    const description = 'Discover custom tattoo artistry, beauty services and creative consultations at Kreative Hub in Abule Egba, Ikeja, Lagos.';
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) { meta = document.createElement('meta'); meta.setAttribute('name', 'description'); document.head.appendChild(meta); }
    meta.setAttribute('content', description);
    let og = document.querySelector('meta[property="og:description"]');
    if (!og) { og = document.createElement('meta'); og.setAttribute('property', 'og:description'); document.head.appendChild(og); }
    og.setAttribute('content', description);
  }, []);
  return null;
}

export default function Home() {
  return <>
    <SEO />
    <h1 className="sr-only">Premium custom tattoo artistry at Kreative Hub Lagos</h1>
    <HeroSection />
    <FeaturedDesigns />
    <StyleCategories />
    <StudioIntro />
    <ServicesSection />
    <PricingSection />
    <section className="border-y border-[#C9A84C] bg-[#111111] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
        <div><p className="mb-3 text-sm uppercase tracking-[0.3em] text-[#C9A84C]">Start your consultation</p><h2 className="font-cinzel text-3xl font-semibold sm:text-5xl">Bring Your Idea To Life</h2><p className="mt-5 max-w-xl leading-relaxed text-[#a0a0a0]">Share your concept with the studio and we’ll help shape the right direction for your next piece.</p></div>
        <Link to="/contact" className="gold-bg inline-flex h-12 w-fit shrink-0 items-center px-6 text-sm font-semibold uppercase tracking-widest text-black transition hover:brightness-110">Contact The Studio →</Link>
      </div>
    </section>
    <ReviewsSection />
  </>;
}