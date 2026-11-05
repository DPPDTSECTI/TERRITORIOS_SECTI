export const EASINGS = {
  standard: [0.2, 0, 0, 1],
  emphasized: [0.16, 1, 0.3, 1],
  smooth: [0.25, 1, 0.5, 1],
};

export const DURATIONS = {
  fast: 0.12,
  normal: 0.2,
  emphasized: 0.26,
  slow: 0.4,
};

export const SPRING_DEFAULT = {
  type: 'spring',
  stiffness: 420,
  damping: 34,
  mass: 0.8,
};

export const SPRING_FLUID = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
  mass: 0.85,
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: DURATIONS.normal, ease: EASINGS.standard },
  },
  exit: {
    opacity: 0,
    transition: { duration: DURATIONS.fast, ease: EASINGS.standard },
  },
};

export const fadeUp = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATIONS.emphasized, ease: EASINGS.emphasized },
  },
  exit: {
    opacity: 0,
    y: 4,
    transition: { duration: DURATIONS.fast, ease: EASINGS.standard },
  },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.97 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: DURATIONS.normal, ease: EASINGS.emphasized },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    transition: { duration: DURATIONS.fast, ease: EASINGS.standard },
  },
};

export const staggerContainer = (staggerChildren = 0.03, delayChildren = 0) => ({
  initial: {},
  animate: {
    transition: {
      staggerChildren,
      delayChildren,
    },
  },
});
