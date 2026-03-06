import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

interface ExpandableDescriptionProps {
  htmlContent: string;
  className?: string;
  maxLines?: number;
}

const ExpandableDescription: React.FC<ExpandableDescriptionProps> = ({
  htmlContent,
  className = '',
  maxLines = 5,
}) => {
  const { isAuthenticated } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // If user is authenticated, we want to show everything
  const effectiveIsExpanded = isAuthenticated || isExpanded;

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };


  // Check if content is truncated
  useEffect(() => {
    const checkTruncation = () => {
      if (contentRef.current) {
        const element = contentRef.current;
        const isTruncatedNow = element.scrollHeight > element.offsetHeight;
        setIsTruncated(isTruncatedNow);
      }
    };

    checkTruncation();
    const timer = setTimeout(checkTruncation, 150);
    window.addEventListener('resize', checkTruncation);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkTruncation);
    };
  }, [htmlContent, maxLines, isExpanded]);

  return (
    <div className="relative">
      <div
        ref={contentRef}
        className={`${className} ${
          !effectiveIsExpanded ? 'line-clamp-none' : ''
        }`}
        style={
          !effectiveIsExpanded
            ? {
                display: '-webkit-box',
                WebkitLineClamp: maxLines,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }
            : {
                display: 'block',
              }
        }
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
      {!isAuthenticated && (isTruncated || isExpanded) && (
        <button
          onClick={toggleExpanded}
          className="mt-3 text-primary hover:text-blue-700 font-bold text-sm flex items-center gap-1 transition-colors bg-white/50 backdrop-blur-sm px-2 py-1 rounded-md"
        >
          {isExpanded ? (
            <>
              Ver menos
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M5 15l7-7 7 7"
                />
              </svg>
            </>
          ) : (
            <>
              Ver más
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default ExpandableDescription;
