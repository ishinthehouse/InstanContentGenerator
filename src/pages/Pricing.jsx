import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Key, Zap } from 'lucide-react';
import { PageTransition, Reveal } from '../components/marketing/motion';

const TIERS = [
  {
    icon: Zap,
    name: 'Free',
    price: '$0',
    period: 'forever',
    tagline: 'Hosted AI, zero setup',
    highlight: false,
    features: [
      'Free AI generations every day',
      'No signup, no credit card',
      'Carousels with 3–10 slides',
      'Video reels with animated captions',
      'PNG + MP4/WebM export',
      'Photo filters & display fonts',
      'Repurpose blogs, articles & YouTube links',
    ],
    cta: 'Start creating',
    note: 'Daily limit resets every 24 hours.',
  },
  {
    icon: Key,
    name: 'Bring your own key',
    price: '$0',
    period: '+ your API costs',
    tagline: 'Unlimited, powered by your provider',
    highlight: true,
    features: [
      'Everything in Free, plus:',
      'Unlimited generations — no daily cap',
      'Bulk mode: Excel/CSV → ZIP of posts',
      'Choose Claude, GPT-4o, or Gemini',
      'Your key stays in your browser only',
      'Pay your AI provider directly at cost',
    ],
    cta: 'Add your key in Studio',
    note: 'Typical cost is a fraction of a cent per post.',
  },
];

export default function Pricing() {
  return (
    <PageTransition>
      <section className="max-w-5xl mx-auto px-6 pt-16 md:pt-24 pb-24">
        <Reveal className="text-center mb-14">
          <p className="text-xs font-bold text-insta uppercase tracking-[0.2em] mb-3">Pricing</p>
          <h1 className="font-display font-extrabold text-white text-4xl md:text-5xl tracking-tight">
            Simple. Honest. Free.
          </h1>
          <p className="text-white/50 text-lg mt-5 max-w-xl mx-auto">
            InstaForge doesn't charge subscriptions. Use the free hosted AI, or plug
            in your own key and pay your provider at cost.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {TIERS.map((tier, i) => (
            <Reveal key={tier.name} delay={i * 0.1}>
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className={`h-full p-8 rounded-2xl border backdrop-blur-xl relative overflow-hidden ${
                  tier.highlight
                    ? 'bg-white/[0.07] border-vivid/40 shadow-glow'
                    : 'bg-white/[0.04] border-white/10 shadow-panel'
                }`}
              >
                {tier.highlight && (
                  <span className="absolute top-5 right-5 px-2.5 py-1 rounded-full text-[10px] font-bold text-white bg-brand-gradient">
                    MOST FLEXIBLE
                  </span>
                )}

                <div className="w-11 h-11 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center mb-5">
                  <tier.icon className="w-5 h-5 text-insta" />
                </div>

                <h2 className="text-white font-bold text-xl font-display">{tier.name}</h2>
                <p className="text-white/45 text-sm mt-1">{tier.tagline}</p>

                <div className="flex items-baseline gap-2 mt-5 mb-7">
                  <span className="text-4xl font-extrabold text-white font-display">{tier.price}</span>
                  <span className="text-sm text-white/40">{tier.period}</span>
                </div>

                <ul className="space-y-3 mb-8">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-white/70">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  to="/studio"
                  className={`w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all active:scale-[0.98] ${
                    tier.highlight
                      ? 'text-white bg-brand-gradient hover:shadow-glow'
                      : 'text-white/80 bg-white/[0.06] border border-white/10 hover:bg-white/[0.12] hover:text-white'
                  }`}
                >
                  {tier.cta}
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <p className="text-[11px] text-white/30 text-center mt-3">{tier.note}</p>
              </motion.div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.15} className="text-center mt-12">
          <p className="text-sm text-white/40">
            You'll also want a free{' '}
            <a
              href="https://www.pexels.com/api/"
              target="_blank"
              rel="noreferrer"
              className="text-insta hover:underline"
            >
              Pexels API key
            </a>{' '}
            for photo &amp; video search — it takes about a minute to get.
          </p>
        </Reveal>
      </section>
    </PageTransition>
  );
}
