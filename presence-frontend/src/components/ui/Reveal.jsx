import { motion } from 'framer-motion';

// Animates its children in when they scroll into view, instead of the page
// silently popping everything in as soon as it mounts. `once: true` means
// it plays on the way down and doesn't replay if the user scrolls back up
// past it — reads as intentional motion, not a distracting loop.
//
//   <Reveal><FeatureCard /></Reveal>
//   <Reveal delay={0.1} direction="left">...</Reveal>
const DIRECTIONS = {
  up: { y: 28 },
  down: { y: -28 },
  left: { x: 28 },
  right: { x: -28 },
  none: {},
};

export function Reveal({ children, delay = 0, direction = 'up', duration = 0.55, className, as = 'div', ...rest }) {
  const Tag = motion[as] || motion.div;
  const offset = DIRECTIONS[direction] || DIRECTIONS.up;
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, ...offset }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

// Wrap a grid/list of items in <RevealGroup>, and each direct
// <RevealItem> child staggers in one after another instead of all at once
// — used for feature grids, step lists, FAQ items, card grids.
export function RevealGroup({ children, className, stagger = 0.09, ...rest }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-60px' }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: stagger } } }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({ children, className, direction = 'up', ...rest }) {
  const offset = DIRECTIONS[direction] || DIRECTIONS.up;
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, ...offset },
        show: { opacity: 1, x: 0, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
      }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
