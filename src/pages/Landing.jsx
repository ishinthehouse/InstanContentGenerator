import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, Sparkles, Type, Film, FileSpreadsheet, Link2, Palette,
  Wand2, Images, Download, ChevronDown, Check,
} from 'lucide-react';
import { PageTransition, Reveal, Floating } from '../components/marketing/motion';

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

function HeroMockup() {
  return (
    <div className="relative w-full max-w-[420px] mx-auto">
      {/* Glow behind the mockup */}
      <div className="absolute -inset-8 bg-brand-gradient opacity-20 blur-3xl rounded-full pointer-events-none" />

      {/* The slide card */}
      <Floating duration={7} offset={12}>
        <div className="relative aspect-square rounded-3xl overflow-hidden border border-white/15 shadow-panel rotate-[-2deg]">
          {/* Fake photo background */}
          <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_20%_0%,#3b2f63_0%,#1d1b33_45%,#0e0d18_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,15,15,0.25)_0%,rgba(15,15,15,0.85)_100%)]" />

          {/* Slide content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-10">
            <span className="px-4 py-1.5 rounded-full text-white text-[11px] font-black tracking-wider bg-insta shadow-lg mb-5">
              DID YOU KNOW?
            </span>
            <p className="font-serif text-white text-2xl leading-snug drop-shadow-lg">
              Your morning routine is silently deciding your entire day.
            </p>
          </div>

          {/* Handle + dots */}
          <div className="absolute bottom-5 inset-x-0 flex flex-col items-center gap-3">
            <div className="flex gap-1.5">
              <span className="w-5 h-1.5 rounded-full bg-white" />
              <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
              <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
              <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
              <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
            </div>
            <span className="text-[10px] text-white/50 font-medium">@yourbrand</span>
          </div>
        </div>
      </Floating>

      {/* Floating status chips */}
      <Floating duration={5} offset={8} delay={0.6} className="absolute -left-6 top-10 hidden sm:block">
        <div className="glass-panel-strong px-3.5 py-2.5 rounded-xl flex items-center gap-2 rotate-[3deg]">
          <span className="w-5 h-5 rounded-full bg-emerald-400/20 flex items-center justify-center">
            <Check className="w-3 h-3 text-emerald-300" />
          </span>
          <span className="text-xs font-semibold text-white/85">Caption + hashtags ready</span>
        </div>
      </Floating>
      <Floating duration={6} offset={9} delay={1.2} className="absolute -right-4 bottom-16 hidden sm:block">
        <div className="glass-panel-strong px-3.5 py-2.5 rounded-xl flex items-center gap-2 rotate-[-3deg]">
          <span className="w-5 h-5 rounded-full bg-vivid/20 flex items-center justify-center">
            <Film className="w-3 h-3 text-insta" />
          </span>
          <span className="text-xs font-semibold text-white/85">Reel rendered · MP4</span>
        </div>
      </Floating>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-grid pointer-events-none" />
      <div className="max-w-6xl mx-auto px-6 pt-16 md:pt-24 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-14 items-center relative">
        {/* Copy */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/10 mb-6"
          >
            <Sparkles className="w-3.5 h-3.5 text-insta" />
            <span className="text-xs font-semibold text-white/70">
              Claude · GPT · Gemini under the hood
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08, ease: 'easeOut' }}
            className="font-display font-extrabold text-white text-4xl md:text-5xl xl:text-6xl leading-[1.08] tracking-tight"
          >
            Turn one idea into a{' '}
            <span className="text-transparent bg-clip-text bg-brand-gradient">
              scroll-stopping post
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.16, ease: 'easeOut' }}
            className="text-white/55 text-lg leading-relaxed mt-6 max-w-xl"
          >
            Type a topic — or paste a link — and InstaForge writes the caption,
            hashtags, and slide-by-slide script, matches it with stock photos or
            video, and exports finished carousels and reels. No design skills needed.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.24, ease: 'easeOut' }}
            className="flex flex-col sm:flex-row gap-3 mt-9"
          >
            <Link
              to="/studio"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-base font-bold text-white bg-brand-gradient hover:shadow-glow transition-all active:scale-[0.98]"
            >
              Start creating — it's free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="/#how-it-works"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-base font-semibold text-white/80 bg-white/[0.05] border border-white/10 hover:bg-white/[0.1] hover:text-white transition-all"
            >
              See how it works
            </a>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-xs text-white/35 mt-5"
          >
            Free daily generations — no signup, no credit card.
          </motion.p>
        </div>

        {/* Mockup */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
        >
          <HeroMockup />
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Features                                                            */
/* ------------------------------------------------------------------ */

const FEATURES = [
  {
    icon: Type,
    title: 'AI captions & scripts',
    desc: 'A hook, story beats, and CTA written for your topic and tone — plus niche and broad hashtags, in English or Hinglish.',
  },
  {
    icon: Images,
    title: 'Media, matched for you',
    desc: 'Relevant, licensed photos and videos pulled from Pexels automatically. Pick your favorites and they spread across slides.',
  },
  {
    icon: Film,
    title: 'Rendered video reels',
    desc: 'Animated hook labels and word-by-word captions baked directly into an MP4/WebM — ready to upload, no editor required.',
  },
  {
    icon: FileSpreadsheet,
    title: 'Bulk from a spreadsheet',
    desc: 'Drop an Excel or CSV content calendar and export a ZIP of finished posts — slides, reels, captions, and hashtags per row.',
  },
  {
    icon: Link2,
    title: 'Repurpose any link',
    desc: 'Paste a blog post, article, or YouTube video and turn its ideas into a fresh carousel in seconds.',
  },
  {
    icon: Palette,
    title: 'Your look, your brand',
    desc: 'Six display fonts, 18 Instagram-style photo filters, 3–10 slides per post, and your handle on every design.',
  },
];

function Features() {
  return (
    <section id="features" className="max-w-6xl mx-auto px-6 py-20">
      <Reveal className="text-center mb-14">
        <p className="text-xs font-bold text-insta uppercase tracking-[0.2em] mb-3">Features</p>
        <h2 className="font-display font-bold text-white text-3xl md:text-4xl tracking-tight">
          Everything between idea and post
        </h2>
        <p className="text-white/50 text-base mt-4 max-w-xl mx-auto">
          One workspace replaces the writer, the stock-photo hunt, and the video editor.
        </p>
      </Reveal>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {FEATURES.map((f, i) => (
          <Reveal key={f.title} delay={(i % 3) * 0.08}>
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              className="glass-panel p-6 h-full"
            >
              <div className="w-11 h-11 rounded-xl bg-brand-gradient/20 bg-white/[0.06] border border-white/10 flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-insta" />
              </div>
              <h3 className="text-white font-semibold text-base mb-2 font-display">{f.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* How it works                                                        */
/* ------------------------------------------------------------------ */

const STEPS = [
  {
    icon: Wand2,
    step: '01',
    title: 'Plan',
    desc: 'Describe your topic or paste a link. Choose tone, language, photos or video, and 3–10 slides.',
  },
  {
    icon: Sparkles,
    step: '02',
    title: 'Produce',
    desc: 'AI writes the script and pairs it with media. Watch the live carousel or reel build itself.',
  },
  {
    icon: Download,
    step: '03',
    title: 'Polish & post',
    desc: 'Swap fonts, apply filters, shuffle media — then export PNG slides or a rendered reel with captions.',
  },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-20 overflow-hidden">
      <div className="absolute inset-0 bg-glow-radial pointer-events-none" />
      <div className="max-w-6xl mx-auto px-6 relative">
        <Reveal className="text-center mb-14">
          <p className="text-xs font-bold text-insta uppercase tracking-[0.2em] mb-3">How it works</p>
          <h2 className="font-display font-bold text-white text-3xl md:text-4xl tracking-tight">
            From topic to post in three steps
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {STEPS.map((s, i) => (
            <Reveal key={s.step} delay={i * 0.12}>
              <div className="glass-panel p-7 h-full relative overflow-hidden">
                <span className="absolute -top-3 right-4 text-[80px] font-display font-extrabold text-white/[0.05] select-none">
                  {s.step}
                </span>
                <div className="w-12 h-12 rounded-2xl bg-brand-gradient flex items-center justify-center shadow-glow-royal mb-5">
                  <s.icon className="w-5.5 h-5.5 text-white" />
                </div>
                <h3 className="text-white font-bold text-lg mb-2 font-display">{s.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Pricing teaser                                                      */
/* ------------------------------------------------------------------ */

function PricingTeaser() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-20">
      <Reveal>
        <div className="glass-panel-strong p-10 md:p-14 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-glow-radial pointer-events-none" />
          <h2 className="font-display font-bold text-white text-3xl md:text-4xl tracking-tight relative">
            Free to start. Yours to scale.
          </h2>
          <p className="text-white/50 text-base mt-4 max-w-lg mx-auto relative">
            Use the free hosted AI every day, or plug in your own API key for
            unlimited generations and bulk workflows.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8 relative">
            <Link
              to="/studio"
              className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl text-sm font-bold text-white bg-brand-gradient hover:shadow-glow transition-all active:scale-[0.98]"
            >
              Open the Studio
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/pricing"
              className="inline-flex items-center justify-center px-7 py-3 rounded-xl text-sm font-semibold text-white/80 bg-white/[0.05] border border-white/10 hover:bg-white/[0.1] hover:text-white transition-all"
            >
              Compare plans
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* FAQ                                                                 */
/* ------------------------------------------------------------------ */

const FAQS = [
  {
    q: 'Is InstaForge really free?',
    a: 'Yes. The hosted generator gives you free AI generations every day with no signup. If you want unlimited generations or bulk processing, add your own AI provider key (Claude, OpenAI, or Gemini) in Settings — you pay your provider directly, nothing extra to us.',
  },
  {
    q: 'What exactly can I export?',
    a: 'PNG slides for carousels, MP4/WebM video reels with animated captions baked in, and your caption + hashtags as text. Bulk mode packages everything into a ZIP, organized per post.',
  },
  {
    q: 'Where do the photos and videos come from?',
    a: 'From Pexels — a library of free-to-use, licensed stock photos and videos. Add your free Pexels API key in Settings and InstaForge searches it automatically using AI-chosen keywords.',
  },
  {
    q: 'Do I need design or video-editing skills?',
    a: 'No. The AI structures the content, the layout system designs the slides, and the reel renderer animates captions over your chosen clips. You just pick what you like and export.',
  },
  {
    q: 'Can I create a whole week of content at once?',
    a: 'Yes — switch to Bulk Upload and drop an Excel/CSV content calendar. Each row becomes a full post with media, and you download the entire batch as a ZIP. Bulk runs many AI calls, so it uses your own API key.',
  },
];

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass-panel overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 p-5 text-left"
      >
        <span className="text-white font-semibold text-sm md:text-base">{q}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-white/40 flex-shrink-0" />
        </motion.span>
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="overflow-hidden"
      >
        <p className="px-5 pb-5 text-sm text-white/50 leading-relaxed">{a}</p>
      </motion.div>
    </div>
  );
}

function Faq() {
  return (
    <section className="max-w-3xl mx-auto px-6 py-20">
      <Reveal className="text-center mb-12">
        <p className="text-xs font-bold text-insta uppercase tracking-[0.2em] mb-3">FAQ</p>
        <h2 className="font-display font-bold text-white text-3xl md:text-4xl tracking-tight">
          Questions, answered
        </h2>
      </Reveal>
      <div className="space-y-3">
        {FAQS.map((f, i) => (
          <Reveal key={f.q} delay={i * 0.05}>
            <FaqItem q={f.q} a={f.a} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function Landing() {
  return (
    <PageTransition>
      <Hero />
      <Features />
      <HowItWorks />
      <PricingTeaser />
      <Faq />
    </PageTransition>
  );
}
