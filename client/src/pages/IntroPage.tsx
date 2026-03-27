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

  // After logo finishes travelling (~600ms), mark done (reduced from 900ms)
  useEffect(() => {
    if (phase !== 'animating') return;
    const t = setTimeout(() => {
      setPhase('done');
      sessionStorage.setItem('intro_seen', '1');
    }, 600);
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
                ? { top: '0px', left: '16px', x: '0%', y: '0%' }
                : { top: '50%', left: '50%', x: '-50%', y: '-50%' }
            }
            transition={{
              type: 'spring',
              stiffness: 120,
              damping: 20,
              mass: 0.8,
            }}
          >
            <motion.img
              src="/newlogo.png"
              alt="Logo"
              draggable={false}
              className="select-none object-contain"
              fetchPriority="high"
              initial={{ width: '200px', height: '200px' }}
              animate={{
                width: isAnimating ? '80px' : '200px',
                height: isAnimating ? '80px' : '200px',
              }}
              transition={{
                type: 'spring',
                stiffness: 120,
                damping: 20,
                mass: 0.8,
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
