import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Intro Wrapper ─────────────────────────────────────────────
// Shows intro animation on first visit, then mounts the real page.
export default function IntroWrapper({ children }: { children: React.ReactNode }) {
  const alreadySeen =
    typeof sessionStorage !== 'undefined' && sessionStorage.getItem('intro_seen') === '1';

  const [phase, setPhase] = useState<'intro' | 'animating' | 'done'>(
    alreadySeen ? 'done' : 'intro'
  );

  const isDone = phase === 'done';
  const isAnimating = phase === 'animating';

  // Wait 0.8s then start animation (reduced from 1.6s)
  useEffect(() => {
    if (alreadySeen) return;
    const t = setTimeout(() => setPhase('animating'), 800);
    return () => clearTimeout(t);
  }, []);

  // Mark done when animation finishes — we set a safety timeout slightly longer 
  // than the physics duration to ensure the handover is perfectly smooth.
  useEffect(() => {
    if (phase !== 'animating') return;
    const t = setTimeout(() => {
      setPhase('done');
      sessionStorage.setItem('intro_seen', '1');
    }, 1200); // Increased to 1.2s to match the luxurious, slower spring
    return () => clearTimeout(t);
  }, [phase]);

  // Already seen → render children immediately, no overhead
  if (alreadySeen) return <>{children}</>;

  return (
    <>
      {/* ── White intro overlay ── */}
      <AnimatePresence>
        {!isDone && (
          <motion.div
            key="overlay"
            className="fixed inset-0 z-50 bg-white"
            initial={{ opacity: 1 }}
            animate={{ opacity: isAnimating ? 0 : 1 }}
            transition={{ duration: 0.65, delay: 0.1, ease: 'easeInOut' }}
          />
        )}
      </AnimatePresence>

      {/* ── Flying logo: large center → exact header size/position ── */}
      <AnimatePresence>
        {!isDone && (
          <motion.div
            key="flying-logo"
            className="fixed z-[60] pointer-events-none"
            // Start: centered on screen
            initial={{ top: '50%', left: '50%', x: '-50%', y: '-50%' }}
            // End: aligns with header logo — px-4 (16px) left padding + ml-1 (4px) = 20px
            // top: header py-3 (12px) with -my-5 (-20px) = image bleeds to top ~0px
            animate={
              isAnimating
                ? { top: '-48px', left: '20px', x: '0%', y: '0%' }
                : { top: '50%', left: '50%', x: '-50%', y: '-50%' }
            }
            transition={{
              type: 'spring',
              stiffness: 70, // Slightly slower for more elegance
              damping: 24,   // Higher damping to prevent oscillation
              mass: 1.2,     // More mass for a 'heavier', premium feel
            }}
          >
            <motion.img
              src="/brand-logo.png"
              alt="Logo"
              draggable={false}
              className="select-none object-contain"
              fetchPriority="high"
              initial={{ width: '350px', height: '350px', filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.1))' }}
              animate={{
                width: isAnimating ? '160px' : '350px',
                height: isAnimating ? '160px' : '350px',
                filter: isAnimating ? 'drop-shadow(0 0px 0px rgba(0,0,0,0))' : 'drop-shadow(0 20px 40px rgba(0,0,0,0.1))'
              }}
              transition={{
                type: 'spring',
                stiffness: 70,
                damping: 24,
                mass: 1.2,
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Children (Home page) — mount early to start fetching, but hide visually ── */}
      <div 
        className={`transition-opacity duration-700 ${isDone ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        {children}
      </div>
    </>
  );
}
