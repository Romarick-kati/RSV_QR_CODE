import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

// Counts up from 0 to `value` once it scrolls into view, rather than
// popping in as a static number — small touch, but it's the kind of detail
// that makes a stats row feel alive instead of just printed text.
export default function AnimatedNumber({ value, duration = 1.1, formatter }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const [display, setDisplay] = useState(0);
  const numericTarget = Number(value) || 0;

  useEffect(() => {
    if (!inView) return;
    let raf;
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(numericTarget * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, numericTarget, duration]);

  return (
    <motion.span ref={ref}>
      {formatter ? formatter(display) : display.toLocaleString()}
    </motion.span>
  );
}
