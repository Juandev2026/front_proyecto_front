import React, { useState } from 'react';
import { ShareIcon, ClipboardCopyIcon, CheckIcon } from '@heroicons/react/outline';

interface ShareButtonProps {
  title: string;
  text?: string;
  url: string;
  className?: string;
}

const ShareButton: React.FC<ShareButtonProps> = ({ title, text, url, className = '' }) => {
  const [copied, setCopied] = useState(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation if inside a link
    e.stopPropagation(); // Stop bubbling

    const shareData = {
      title,
      text,
      url,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled or share failed
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy text: ', err);
      }
    }
  };

  return (
    <button
      onClick={handleShare}
      className={`inline-flex items-center justify-center px-4 py-2 border border-blue-200 shadow-sm text-sm font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${className}`}
      title="Compartir"
    >
      {copied ? (
        <>
          <CheckIcon className="h-4 w-4 mr-2 text-green-500" />
          <span>Copiado</span>
        </>
      ) : (
        <>
          <ShareIcon className="h-4 w-4 mr-2" />
          <span>Compartir</span>
        </>
      )}
    </button>
  );
};

export default ShareButton;
