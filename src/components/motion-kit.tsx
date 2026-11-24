import { motion, useReducedMotion, type HTMLMotionProps } from 'motion/react';
import { useEffect, useRef, useState, type ReactNode } from 'react';

const ease = [0.22, 1, 0.36, 1] as const;

/** Fades and lifts content in once it scrolls into view. */
export function Reveal({ children, delay = 0, y = 16, ...rest }: { children: ReactNode; delay?: number; y?: number } & HTMLMotionProps<'div'>) {
  const reduce = useReducedMotion();
  return (
    <motion.div initial={reduce ? false : { opacity: 0, transform: `translateY(${y}px)` }} whileInView={{ opacity: 1, transform: 'translateY(0px)' }} viewport={{ once: true, margin: '-24px' }} transition={{ duration: 0.4, ease, delay }} {...rest}>
      {children}
    </motion.div>
  );
}

/** Staggers its direct StaggerItem children. */
export function Stagger({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-24px' }} variants={{ hidden: {}, show: { transition: { staggerChildren: 0.055 } } }}>
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div className={className} variants={reduce ? {} : { hidden: { opacity: 0, transform: 'translateY(16px)' }, show: { opacity: 1, transform: 'translateY(0px)', transition: { duration: 0.4, ease } } }}>
      {children}
    </motion.div>
  );
}

/** True once the page has scrolled past the threshold (for the header's depth effect). */
export function useScrolled(threshold = 12) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > threshold);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, [threshold]);
  return scrolled;
}

/** One restrained intro; no continuous scroll work or moving text. */
export function useHeroMotion() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let cleanup = () => {};
    let cancelled = false;
    void import('gsap').then(({ gsap }) => {
      if (cancelled) return;
      const ctx = gsap.context(() => {
        gsap.timeline({ defaults: { ease: 'expo.out' } })
          .fromTo('.hero-image', { scale: 1.025 }, { scale: 1, duration: 1 })
          .fromTo('.hero-line', { yPercent: 100 }, { yPercent: 0, duration: 0.65 }, 0.1)
          .fromTo('.hero-fade', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.45, stagger: 0.05 }, 0.15);
      }, root);
      cleanup = () => ctx.revert();
    });
    return () => { cancelled = true; cleanup(); };
  }, []);
  return ref;
}
