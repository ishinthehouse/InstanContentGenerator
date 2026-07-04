import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sparkles, HelpCircle, ArrowRight } from 'lucide-react';
import SettingsPanel from '../SettingsPanel';
import GuideModal from '../GuideModal';

const LINKS = [
  { to: '/#features', label: 'Features' },
  { to: '/#how-it-works', label: 'How it works' },
  { to: '/pricing', label: 'Pricing' },
];

export default function NavBar() {
  const { pathname } = useLocation();
  const isStudio = pathname.startsWith('/studio');
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-midnight-900/70 border-b border-white/10">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-3 flex justify-between items-center">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center shadow-glow-royal transition-transform group-hover:scale-105">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-white tracking-tight font-display leading-none block">
                InstaForge
              </span>
              <span className="text-[10px] text-white/40 hidden sm:block leading-none">
                AI content studio
              </span>
            </div>
          </Link>

          {/* Center links (marketing) */}
          <nav className="hidden md:flex items-center gap-1">
            {LINKS.map((l) => (
              <Link
                key={l.label}
                to={l.to}
                className="px-3.5 py-2 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {isStudio ? (
              <>
                <button
                  onClick={() => setIsGuideOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-white/70 text-xs font-semibold rounded-full border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:text-white transition-all"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Learn to use</span>
                </button>
                <SettingsPanel />
              </>
            ) : (
              <Link
                to="/studio"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-brand-gradient hover:shadow-glow transition-all active:scale-[0.98]"
              >
                Open Studio
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </header>

      <GuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
    </>
  );
}
