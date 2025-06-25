import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/router';

const animationVariant = 'fade'; // 'fadeScale' | 'slide' | 'fade'

const variants = {
  fadeScale: {
    initial: { opacity: 0, scale: 0.97, y: 30 },
    animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.35, ease: [0.4, 1.4, 0.6, 1] } },
    exit: { opacity: 0, scale: 0.97, y: -30, transition: { duration: 0.28, ease: [0.4, 1.4, 0.6, 1] } },
  },
  slide: {
    initial: { opacity: 0, x: 80 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.35, ease: [0.4, 1.4, 0.6, 1] } },
    exit: { opacity: 0, x: -80, transition: { duration: 0.28, ease: [0.4, 1.4, 0.6, 1] } },
  },
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.28 } },
  },
};

export default function CloudLayout({ children }) {
  const router = useRouter();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={router.pathname}
        initial={variants[animationVariant].initial}
        animate={variants[animationVariant].animate}
        exit={variants[animationVariant].exit}
        style={{ height: '100%' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
} 