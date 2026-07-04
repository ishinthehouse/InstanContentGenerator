import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, MotionConfig } from 'framer-motion';
import { SettingsProvider } from './context/SettingsContext';
import NavBar from './components/marketing/NavBar';
import Footer from './components/marketing/Footer';
import Landing from './pages/Landing';
import Pricing from './pages/Pricing';
import Studio from './pages/Studio';
import NotFound from './pages/NotFound';

/**
 * Scroll behavior across route changes:
 *  - navigating to a hash (e.g. /#features) smooth-scrolls to that section
 *  - navigating to a new page scrolls back to the top
 */
function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      // Let the page transition mount the target section first
      const t = setTimeout(() => {
        document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' });
      }, 80);
      return () => clearTimeout(t);
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

export default function App() {
  const location = useLocation();
  const isStudio = location.pathname.startsWith('/studio');

  return (
    <SettingsProvider>
      {/* reducedMotion="user" disables animations for users with the OS setting */}
      <MotionConfig reducedMotion="user">
        <div className="min-h-screen flex flex-col">
          <NavBar />
          <ScrollManager />
          <div className="flex-1">
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                <Route path="/" element={<Landing />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/studio" element={<Studio />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AnimatePresence>
          </div>
          {/* The studio is a workspace — footer only on marketing pages */}
          {!isStudio && <Footer />}
        </div>
      </MotionConfig>
    </SettingsProvider>
  );
}
