import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon } from '@heroicons/react/outline';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 3000 }) => {
  const onCloseRef = React.useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const timer = setTimeout(() => {
      onCloseRef.current();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const config = {
    success: {
      bg: 'bg-[#EBFFF1]',
      border: 'border-[#B5F5C1]',
      text: 'text-[#008037]',
      icon: <CheckCircleIcon className="h-6 w-6 text-[#008037]" />,
    },
    error: {
      bg: 'bg-[#FFF2F0]',
      border: 'border-[#FFCCC7]',
      text: 'text-[#FF4D4F]',
      icon: <XCircleIcon className="h-6 w-6 text-[#FF4D4F]" />,
    },
    info: {
      bg: 'bg-[#E6F7FF]',
      border: 'border-[#91D5FF]',
      text: 'text-[#1890FF]',
      icon: <InformationCircleIcon className="h-6 w-6 text-[#1890FF]" />,
    },
  };

  const { bg, border, text, icon } = config[type];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      className={`flex items-center gap-3 px-6 py-4 rounded-xl border shadow-xl ${bg} ${border} ${text} min-w-[300px] max-w-[90vw]`}
    >
      <div className="flex-shrink-0">{icon}</div>
      <p className="text-sm font-bold">{message}</p>
    </motion.div>
  );
};

export default Toast;
