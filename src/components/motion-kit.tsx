import { motion, useReducedMotion, type HTMLMotionProps } from 'motion/react';
import { useEffect, useRef, useState, type ReactNode } from 'react';

const ease = [0.22, 1, 0.36, 1] as const;

/** Fades and lifts content in once it scrolls into view. */
export function Reveal({ children, delay = 0, y = 28, ...rest }: { children: ReactNode; delay?: number; y?: number } & HTMLMotionProps<'div'>) {
  const reduce = useReducedMotion();
  return (
    <motion.div initial={reduce ? false : { opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.9, ease, delay }} {...rest}>
      {children}
    </motion.div>
  );
}

/** Staggers its direct StaggerItem children. */
export function Stagger({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }} variants={{ hidden: {}, show: { transition: { staggerChildren: 0.09 } } }}>
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div className={className} variants={reduce ? {} : { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.8, ease } } }}>
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

/** GSAP intro timeline + scroll parallax for the hero; loaded in the browser only. */
export function useHeroMotion() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let cleanup = () => {};
    let cancelled = false;
    void Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(([{ gsap }, { ScrollTrigger }]) => {
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      const ctx = gsap.context(() => {
        gsap.timeline({ defaults: { ease: 'expo.out' } })
          .fromTo('.hero-image', { scale: 1.14, opacity: 0 }, { scale: 1.04, opacity: 1, duration: 2.2 })
          .fromTo('.hero-line', { yPercent: 110 }, { yPercent: 0, duration: 1.3, stagger: 0.12 }, 0.25)
          .fromTo('.hero-fade', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 1, stagger: 0.1 }, 0.7);
        gsap.to('.hero-image', { yPercent: 12, ease: 'none', scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: true } });
        gsap.to('.hero-content', { yPercent: -18, opacity: 0.2, ease: 'none', scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: true } });
      }, root);
      cleanup = () => ctx.revert();
    });
    return () => { cancelled = true; cleanup(); };
  }, []);
  return ref;
}
