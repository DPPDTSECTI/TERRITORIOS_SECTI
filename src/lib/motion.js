export const EASINGS = {
  standard: [0.2, 0, 0, 1],
  emphasized: [0.16, 1, 0.3, 1],
};

export const DURATIONS = {
  fast: 0.12,
  normal: 0.2,
  emphasized: 0.32,
  slow: 0.5,
};

export const SPRING_DEFAULT = {
  type: 'spring',
  stiffness: 380,
  damping: 32,
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
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATIONS.emphasized, ease: EASINGS.emphasized },
  },
  exit: {
    opacity: 0,
    y: 8,
    transition: { duration: DURATIONS.fast, ease: EASINGS.standard },
  },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.96 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: DURATIONS.normal, ease: EASINGS.emphasized },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    transition: { duration: DURATIONS.fast, ease: EASINGS.standard },
  },
};

export const staggerContainer = (staggerChildren = 0.04, delayChildren = 0) => ({
  initial: {},
  animate: {
    transition: {
      staggerChildren,
      delayChildren,
    },
  },
});
