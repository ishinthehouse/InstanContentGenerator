import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageTransition } from '../components/marketing/motion';

export default function NotFound() {
  return (
    <PageTransition>
      <section className="max-w-2xl mx-auto px-6 py-32 text-center">
        <p className="font-display font-extrabold text-transparent bg-clip-text bg-brand-gradient text-7xl md:text-8xl">
          404
        </p>
        <h1 className="text-white font-bold text-2xl font-display mt-6">
          This page doesn't exist
        </h1>
        <p className="text-white/45 text-sm mt-3">
          The link may be broken, or the page may have moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 mt-8 px-6 py-3 rounded-xl text-sm font-bold text-white bg-brand-gradient hover:shadow-glow transition-all active:scale-[0.98]"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
      </section>
    </PageTransition>
  );
}
