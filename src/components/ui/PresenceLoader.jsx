import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ScanLine } from 'lucide-react';

const DEFAULT_MESSAGES = ['Loading…'];

// A calm, branded loading screen — echoes the QR "scan-target" motif used
// throughout the app (BrandMark, the pulsing reticle on the scanner) rather
// than a generic spinner, so it still feels like part of the product while
// something takes a moment.
export default function PresenceLoader({ messages = DEFAULT_MESSAGES, cycleMs = 900, compact = false }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (messages.length <= 1) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % messages.length), cycleMs);
    return () => clearInterval(id);
  }, [messages, cycleMs]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className={`fixed inset-0 z-[999] flex flex-col items-center justify-center gap-7 ${compact ? '' : ''}`}
      style={{ background: 'var(--bg)' }}
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 grain opacity-30" />
        <div className="absolute w-[380px] h-[380px] rounded-full blur-[100px] opacity-20 top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ background: '#22D3A6' }} />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-7">
        {/* Icon stack: outer ring pulse + inner brand mark, small orbiting dot */}
        <div className="relative w-20 h-20 flex items-center justify-center">
          <motion.span
            className="absolute inset-0 rounded-full"
            style={{ border: '2px solid #22D3A6' }}
            animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.span
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#22D3A6,#8B7CF6)' }}
            animate={{ rotate: [0, 8, -8, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ScanLine size={28} color="#04140f" />
          </motion.span>
          <motion.span
            className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full"
            style={{ background: '#F5A623' }}
            animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
          />
        </div>

        <motion.p
          key={index}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }}
          className="font-display text-base sm:text-lg font-semibold text-center px-6"
          style={{ color: 'var(--text)' }}
        >
          {messages[index]}
        </motion.p>

        <div className="w-40 h-1 rounded-full overflow-hidden" style={{ background: 'var(--line-10)' }}>
          <motion.div
            className="h-full w-1/3 rounded-full"
            style={{ background: 'linear-gradient(90deg,#22D3A6,#8B7CF6)' }}
            animate={{ x: ['-100%', '260%'] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </div>
    </motion.div>
  );
}
