import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

const COLUMNS = [
  {
    title: 'Product',
    links: [
      { to: '/studio', label: 'Open Studio' },
      { to: '/#features', label: 'Features' },
      { to: '/#how-it-works', label: 'How it works' },
      { to: '/pricing', label: 'Pricing' },
    ],
  },
  {
    title: 'Create',
    links: [
      { to: '/studio', label: 'Carousel posts' },
      { to: '/studio', label: 'Video reels' },
      { to: '/studio', label: 'Bulk from Excel' },
      { to: '/studio', label: 'Repurpose a link' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/10 mt-24">
      <div className="max-w-6xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr] gap-10">
          {/* Brand blurb */}
          <div>
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-base font-bold text-white font-display">InstaForge</span>
            </Link>
            <p className="text-sm text-white/40 leading-relaxed max-w-xs">
              The AI design studio that turns a one-line topic into ready-to-post
              carousels, captions, and video reels.
            </p>
          </div>

          {/* Link columns */}
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-bold text-white/70 uppercase tracking-wider mb-4">
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      to={l.to}
                      className="text-sm text-white/45 hover:text-white transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 mt-12 pt-6 flex flex-col sm:flex-row justify-between gap-3">
          <p className="text-xs text-white/30">
            © {new Date().getFullYear()} InstaForge. Stock photos &amp; videos by Pexels.
          </p>
          <p className="text-xs text-white/30">
            Not affiliated with Instagram or Meta.
          </p>
        </div>
      </div>
    </footer>
  );
}
