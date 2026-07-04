import { motion } from 'framer-motion';

/**
 * Shared animation primitives for the marketing pages and route transitions.
 * MotionConfig in App.jsx sets reducedMotion="user", so all of these respect
 * the OS "reduce motion" preference automatically.
 */

/** Route-level enter/exit wrapper — used by every page. */
export function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

/** Scroll-reveal: fades + rises the first time the element enters the viewport. */
export function Reveal({ children, delay = 0, className }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** Gentle infinite float — used for the hero mockup and decorative chips. */
export function Floating({ children, className, duration = 6, offset = 10, delay = 0 }) {
  return (
    <motion.div
      className={className}
      animate={{ y: [0, -offset, 0] }}
      transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut' }}
    >
      {children}
    </motion.div>
  );
}
