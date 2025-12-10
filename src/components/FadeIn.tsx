import { useEffect } from 'react';

import { motion, useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  fullWidth?: boolean;
  padding?: boolean;
}

const FadeIn = ({
  children,
  delay = 0,
  direction = 'up',
  fullWidth = false,
  padding = true,
}: FadeInProps) => {
  const controls = useAnimation();
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  useEffect(() => {
    if (inView) {
      controls.start('visible');
    }
  }, [controls, inView]);

  const getInitialY = () => {
    if (direction === 'up') return 40;
    if (direction === 'down') return -40;
    return 0;
  };

  const getInitialX = () => {
    if (direction === 'left') return 40;
    if (direction === 'right') return -40;
    return 0;
  };

  const variants = {
    hidden: {
      opacity: 0,
      y: getInitialY(),
      x: getInitialX(),
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      transition: {
        duration: 0.8,
        ease: [0.6, -0.05, 0.01, 0.99],
        delay,
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      animate={controls}
      initial="hidden"
      variants={variants}
      className={`${fullWidth ? 'w-full' : ''} ${padding ? 'px-4' : ''}`}
    >
      {children}
    </motion.div>
  );
};

export default FadeIn;
