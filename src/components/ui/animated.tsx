/* eslint-disable react-refresh/only-export-components */
import { ReactNode } from 'react';
import { m, AnimatePresence, Variants } from 'framer-motion';

// --- Shared transition presets ---

const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const fadeSlideVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

const collapseVariants: Variants = {
  hidden: { opacity: 0, height: 0, overflow: 'hidden' },
  visible: { opacity: 1, height: 'auto', overflow: 'hidden' },
  exit: { opacity: 0, height: 0, overflow: 'hidden' },
};

const dropdownVariants: Variants = {
  hidden: { opacity: 0, y: -4, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -4, scale: 0.98 },
};

const listItemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, x: -10, transition: { duration: 0.15 } },
};

// --- Components ---

interface FadeInProps {
  children: ReactNode;
  className?: string;
  /** Unique key for AnimatePresence tracking */
  motionKey?: string;
  /** Add slide-up effect */
  slide?: boolean;
  /** Duration in seconds */
  duration?: number;
}

/** Fade in (+ optional slide) a single element. Pair with AnimatePresence for exit. */
export const FadeIn = ({
  children,
  className,
  motionKey,
  slide = false,
  duration = 0.2,
}: FadeInProps) => (
  <m.div
    key={motionKey}
    variants={slide ? fadeSlideVariants : fadeVariants}
    initial="hidden"
    animate="visible"
    exit="exit"
    transition={{ duration, ease: 'easeOut' }}
    className={className}
  >
    {children}
  </m.div>
);

interface AnimatedSwitchProps {
  /** Unique key that changes when the view switches */
  switchKey: string;
  children: ReactNode;
  className?: string;
}

/** Crossfade between two views. Wrap the conditional content, change switchKey to trigger transition. */
export const AnimatedSwitch = ({
  switchKey,
  children,
  className,
}: AnimatedSwitchProps) => (
  <AnimatePresence mode="wait">
    <m.div
      key={switchKey}
      variants={fadeSlideVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className={className}
    >
      {children}
    </m.div>
  </AnimatePresence>
);

interface AnimatedCollapseProps {
  show: boolean;
  children: ReactNode;
  className?: string;
}

/** Animate height + opacity for reveal/collapse. */
export const AnimatedCollapse = ({
  show,
  children,
  className,
}: AnimatedCollapseProps) => (
  <AnimatePresence>
    {show && (
      <m.div
        variants={collapseVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={className}
      >
        {children}
      </m.div>
    )}
  </AnimatePresence>
);

interface AnimatedDropdownProps {
  show: boolean;
  children: ReactNode;
  className?: string;
}

/** Dropdown enter/exit animation. */
export const AnimatedDropdown = ({
  show,
  children,
  className,
}: AnimatedDropdownProps) => (
  <AnimatePresence>
    {show && (
      <m.div
        variants={dropdownVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={className}
      >
        {children}
      </m.div>
    )}
  </AnimatePresence>
);

interface AnimatedListItemProps {
  children: ReactNode;
  className?: string;
  motionKey: string;
  /** Layout animation for reordering */
  layout?: boolean;
}

/** Wrap each list item for enter/exit animations. Parent must have <AnimatePresence>. */
export const AnimatedListItem = ({
  children,
  className,
  motionKey,
  layout = false,
}: AnimatedListItemProps) => (
  <m.div
    key={motionKey}
    variants={listItemVariants}
    initial="hidden"
    animate="visible"
    exit="exit"
    transition={{ duration: 0.2, ease: 'easeOut' }}
    layout={layout}
    className={className}
  >
    {children}
  </m.div>
);

/** Re-export AnimatePresence for convenience */
export { AnimatePresence, m };
