import React, { useState } from 'react';

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

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="relative">
      <div
        className={`${className} ${!isExpanded ? 'relative' : ''}`}
        style={
          !isExpanded
            ? {
                display: '-webkit-box',
                WebkitLineClamp: maxLines,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }
            : undefined
        }
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
      {!isExpanded && (
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none" />
      )}
      <button
        onClick={toggleExpanded}
        className="mt-3 text-primary hover:text-blue-700 font-semibold text-sm flex items-center gap-1 transition-colors relative z-10"
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
    </div>
  );
};

export default ExpandableDescription;
