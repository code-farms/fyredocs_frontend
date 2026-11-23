import { useEffect, useRef } from 'react';
import { useSpring, useTransform, m } from 'framer-motion';

interface AnimatedNumberProps {
  value: number;
  /** Number of decimal places (default 0) */
  decimals?: number;
  /** Suffix appended after the number (e.g. "%", " GB") */
  suffix?: string;
  /** Prefix prepended before the number */
  prefix?: string;
  className?: string;
}

/**
 * Smoothly animates between numeric values using a spring animation.
 * When the value changes, the number rolls from the old value to the new one.
 */
export function AnimatedNumber({
  value,
  decimals = 0,
  suffix = '',
  prefix = '',
  className,
}: AnimatedNumberProps) {
  const spring = useSpring(0, { stiffness: 120, damping: 20, mass: 0.5 });
  const display = useTransform(spring, (v) => `${prefix}${v.toFixed(decimals)}${suffix}`);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      // Jump to value immediately on first render (no animation from 0)
      spring.jump(value);
      isFirstRender.current = false;
    } else {
      spring.set(value);
    }
  }, [spring, value]);

  return <m.span className={className}>{display}</m.span>;
}
