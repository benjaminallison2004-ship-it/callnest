import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { useScrollAnimation } from '../lib/useScrollAnimation';

const tiers = [
  {
    name: 'Starter',
    description: 'Small designs, fine-line, minimalist',
    price: '₦15,000',
    items: ['Up to 3 hours', 'Single placement', 'Design consultation', 'Aftercare advice'],
  },
  {
    name: 'Signature',
    description: 'Medium detailed work, custom designs',
    price: '₦35,000',
    popular: true,
    items: ['3–6 hours', 'Custom design', 'Touch-up session', 'Premium aftercare kit'],
  },
  {
    name: 'Masterpiece',
    description: 'Full sleeves, large complex pieces',
    price: '₦80,000',
    items: ['Multiple sessions', 'Full collaboration', 'Priority booking', 'Lifetime touch-up'],
  },
];

export default function PricingSection() {
  const ref = useRef<HTMLElement>(null);
  useScrollAnimation(ref);

  return (
    <section
      ref={ref}
      className="border-t border-[#C9A84C] bg-[#0a0a0a] px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-10">
          <p className="text-sm uppercase tracking-[0.3em] text-[#C9A84C]">Plan your next piece</p>
          <h2 className="mt-3 font-cinzel text-4xl text-white sm:text-5xl">Pricing</h2>
          <p className="mt-4 max-w-xl text-[#a0a0a0]">
            Transparent starting points for every budget. Your final quote is shaped by size,
            placement, detail and session time.
          </p>
        </div>

        <div className="mb-10 border border-[#2a2a2a] bg-[#1a1a1a] p-5 text-sm leading-6 text-[#C9A84C]">
          ⚠️ DEMO PRICING — All prices shown below are example ranges for demonstration purposes
          only. Please contact Kreative Hub directly for a personalised quote.
        </div>

        <div className="grid gap-5 sm:gap-6 lg:grid-cols-3 lg:gap-8">
          {tiers.map((tier) => (
            <article
              key={tier.name}
              className={`relative flex flex-col border bg-[#1a1a1a] p-6 ${
                tier.popular ? 'border-[#C9A84C]' : 'border-[#2a2a2a]'
              }`}
            >
              {tier.popular && (
                <span className="absolute right-0 top-0 bg-[#C9A84C] px-3 py-2 text-xs font-semibold uppercase tracking-widest text-black">
                  Most Popular
                </span>
              )}
              <h3 className="font-cinzel text-2xl text-white">{tier.name}</h3>
              <p className="mt-3 min-h-12 text-sm leading-6 text-[#a0a0a0]">{tier.description}</p>
              <p className="mt-8 font-cinzel text-4xl text-[#D4AF37]">{tier.price}</p>
              <ul className="mt-8 flex-1 space-y-4 border-t border-[#2a2a2a] pt-6">
                {tier.items.map((item) => (
                  <li key={item} className="flex gap-3 text-sm text-[#d0d0d0]">
                    <Check className="h-5 w-5 shrink-0 text-[#C9A84C]" />
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            to="/contact"
            className="gold-bg inline-flex h-12 w-fit items-center px-6 text-sm font-medium uppercase tracking-widest text-black"
          >
            Get a Custom Quote
          </Link>
        </div>
      </div>
    </section>
  );
}
