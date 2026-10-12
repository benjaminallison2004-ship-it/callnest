import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../../lib/db';

type Testimonial = {
  id: string;
  name: string;
  business: string;
  businessType: string;
  photoUrl?: string;
  quote: string;
  result: string;
  approved: boolean;
  created_at?: string;
};

type FoundingPartnersProps = {
  onStartTrial: () => void;
};

export default function FoundingPartners({ onStartTrial }: FoundingPartnersProps) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    db.listPublic('callnest_testimonials')
      .then((rows) => {
        if (!active) return;

        const approvedTestimonials = (rows as Testimonial[])
          .filter((testimonial) => testimonial.approved)
          .sort((a, b) =>
            String(b.created_at || '').localeCompare(String(a.created_at || '')),
          );

        setTestimonials(approvedTestimonials);
      })
      .catch(() => {
        if (active) setTestimonials([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="cn-section bg-slate-50">
      <div className="cn-container">
        <span className="cn-section-label">FOUNDING PARTNERS</span>
        <h2 className="cn-section-title">Our first success stories</h2>
        <p className="mt-3 text-slate-600">
          Real results from real businesses. We&apos;re building this together.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {loading
            ? [1, 2, 3].map((item) => (
                <div
                  key={`founding-partner-loading-${item}`}
                  className="h-48 animate-pulse rounded-2xl bg-slate-200"
                />
              ))
            : [0, 1, 2].map((index) => {
                const testimonial = testimonials[index];
                const slotKey = `founding-partner-slot-${index}`;

                return testimonial ? (
                  <article
                    className="cn-card border-2 border-blue-100 bg-white"
                    key={slotKey}
                  >
                    {testimonial.photoUrl ? (
                      <img
                        src={testimonial.photoUrl}
                        onError={(event) => {
                          event.currentTarget.style.display = 'none';
                        }}
                        className="h-16 w-16 rounded-full object-cover"
                        alt={`${testimonial.name}, ${testimonial.business}`}
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-700">
                        {testimonial.name[0]}
                      </div>
                    )}
                    <h3 className="mt-3 font-bold">{testimonial.name}</h3>
                    <p className="text-sm text-slate-500">
                      {testimonial.business}
                    </p>
                    <p className="mt-4 border-l-4 border-blue-200 pl-4 italic leading-7 text-slate-700">
                      “{testimonial.quote}”
                    </p>
                    <span className="mt-4 inline-block rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm font-semibold text-green-800">
                      {testimonial.result}
                    </span>
                  </article>
                ) : (
                  <article
                    key={slotKey}
                    className="cn-card border-2 border-dashed border-slate-200 bg-slate-50 text-center"
                  >
                    <div className="text-4xl">🌟</div>
                    <h3 className="mt-3 font-bold text-slate-400">
                      Be our first success story
                    </h3>
                    <p className="mt-2 text-sm text-slate-400">
                      Join the free 30-day pilot. Share your results and we&apos;ll
                      feature you here.
                    </p>
                    <button
                      type="button"
                      onClick={onStartTrial}
                      className="cn-btn-outline mt-4 text-sm"
                    >
                      Join the free pilot →
                    </button>
                  </article>
                );
              })}
        </div>

        <Link
          to="/contact"
          className="mt-6 inline-block w-full text-center font-semibold text-blue-600"
        >
          Apply for our free 30-day pilot →
        </Link>
      </div>
    </section>
  );
}
