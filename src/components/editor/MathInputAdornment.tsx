import React, { useCallback } from 'react';

interface MathInputAdornmentProps {
  inputRef: React.RefObject<HTMLInputElement>;
  onValueChange: (newValue: string) => void;
  currentValue: string;
}

/**
 * Reusable adornment buttons (x² and x₂) that insert ^{} or _{}
 * at the cursor position of a target input.
 */
const MathInputAdornment: React.FC<MathInputAdornmentProps> = ({
  inputRef,
  onValueChange,
  currentValue,
}) => {
  const insertAtCursor = useCallback(
    (textToInsert: string) => {
      const input = inputRef.current;
      if (!input) return;

      const start = input.selectionStart ?? currentValue.length;
      const end = input.selectionEnd ?? currentValue.length;
      const before = currentValue.slice(0, start);
      const after = currentValue.slice(end);
      const newValue = before + textToInsert + after;

      onValueChange(newValue);

      // Set cursor position inside the braces (after the ^{ or _{)
      requestAnimationFrame(() => {
        if (input) {
          const cursorPos = start + textToInsert.length - 1; // Before the closing }
          input.focus();
          input.setSelectionRange(cursorPos, cursorPos);
        }
      });
    },
    [inputRef, onValueChange, currentValue]
  );

  return (
    <div className="flex items-center gap-1 ml-1">
      <button
        type="button"
        onClick={() => insertAtCursor('^{}')}
        className="px-1.5 py-0.5 text-xs font-mono bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded transition-colors text-gray-700"
        title="Superíndice (^{})"
      >
        x<sup className="text-[9px]">2</sup>
      </button>
      <button
        type="button"
        onClick={() => insertAtCursor('_{}')}
        className="px-1.5 py-0.5 text-xs font-mono bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded transition-colors text-gray-700"
        title="Subíndice (_{})"
      >
        x<sub className="text-[9px]">2</sub>
      </button>
    </div>
  );
};

export default MathInputAdornment;
