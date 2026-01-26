import React, { useState, useRef, useEffect } from 'react';

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
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // Calculate max height based on line-height
  // Assuming average line-height of 1.75rem (28px) for prose content
  const getMaxHeight = () => {
    const lineHeightMap: { [key: number]: string } = {
      3: '5.25rem',  // 3 * 1.75rem
      4: '7rem',     // 4 * 1.75rem
      5: '8.75rem',  // 5 * 1.75rem
      6: '10.5rem',  // 6 * 1.75rem
    };
    return lineHeightMap[maxLines] || '8.75rem';
  };

  // Check if content is truncated
  useEffect(() => {
    const checkTruncation = () => {
      if (contentRef.current) {
        const element = contentRef.current;
        // Compare scrollHeight (full content height) with clientHeight (visible height)
        const isTruncatedNow = element.scrollHeight > element.clientHeight;
        setIsTruncated(isTruncatedNow);
      }
    };

    // Check on mount and when content changes
    checkTruncation();

    // Also check after a small delay to ensure content is fully rendered
    const timer = setTimeout(checkTruncation, 100);

    return () => clearTimeout(timer);
  }, [htmlContent, maxLines]);

  return (
    <div className="relative">
      <div
        ref={contentRef}
        className={`${className} ${!isExpanded ? 'overflow-hidden' : ''}`}
        style={!isExpanded ? { maxHeight: getMaxHeight() } : undefined}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
      {isTruncated && (
        <button
          onClick={toggleExpanded}
          className="mt-3 text-primary hover:text-blue-700 font-semibold text-sm flex items-center gap-1 transition-colors"
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
                  strokeWidth={2}
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
                  strokeWidth={2}
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

