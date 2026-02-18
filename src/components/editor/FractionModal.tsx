import React, { useState, useRef, useEffect, useMemo } from 'react';

import katex from 'katex';
import MathInputAdornment from './MathInputAdornment';

interface FractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (latex: string) => void;
  /** When editing an existing node, provide the initial LaTeX */
  initialLatex?: string;
  isEditing?: boolean;
}

/**
 * Parse a \frac{num}{den} string and extract numerator + denominator.
 * Returns null if it doesn't match the fraction pattern.
 */
function parseFraction(latex: string): { numerator: string; denominator: string } | null {
  // Match \frac{...}{...} — handles nested braces via simple extraction
  const match = latex.match(/^\\frac\{(.*)\}\{(.*)\}$/);
  if (!match) return null;

  // For nested braces, we need smarter parsing
  // Simple approach: find balanced braces
  const inner = latex.slice(6); // Remove \frac{
  let depth = 1;
  let i = 0;
  for (; i < inner.length && depth > 0; i++) {
    if (inner[i] === '{') depth++;
    if (inner[i] === '}') depth--;
  }
  const numerator = inner.slice(0, i - 1);
  // Now skip }{
  const rest = inner.slice(i);
  if (!rest.startsWith('{')) return { numerator, denominator: '' };
  const denomInner = rest.slice(1, -1); // Remove { and }
  return { numerator, denominator: denomInner };
}

const FractionModal: React.FC<FractionModalProps> = ({
  isOpen,
  onClose,
  onInsert,
  initialLatex,
  isEditing = false,
}) => {
  const [numerator, setNumerator] = useState('');
  const [denominator, setDenominator] = useState('');
  const numRef = useRef<HTMLInputElement>(null);
  const denRef = useRef<HTMLInputElement>(null);

  // Pre-fill when editing an existing fraction
  useEffect(() => {
    if (isOpen && initialLatex && isEditing) {
      const parsed = parseFraction(initialLatex);
      if (parsed) {
        setNumerator(parsed.numerator);
        setDenominator(parsed.denominator);
      } else {
        setNumerator(initialLatex);
        setDenominator('');
      }
    } else if (isOpen && !isEditing) {
      setNumerator('');
      setDenominator('');
    }
  }, [isOpen, initialLatex, isEditing]);

  // Focus numerator input on open
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => numRef.current?.focus());
    }
  }, [isOpen]);

  // Live preview with error handling
  const previewHtml = useMemo(() => {
    const latex = `\\frac{${numerator || '?'}}{${denominator || '?'}}`;
    try {
      return katex.renderToString(latex, { throwOnError: false, displayMode: false });
    } catch {
      return '<span style="color: #ef4444;">Error de sintaxis</span>';
    }
  }, [numerator, denominator]);

  const handleInsert = () => {
    if (!numerator.trim() && !denominator.trim()) return;
    const latex = `\\frac{${numerator}}{${denominator}}`;
    onInsert(latex);
    setNumerator('');
    setDenominator('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-40" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-gray-50">
          <h3 className="text-base font-semibold text-gray-800">
            {isEditing ? 'Editar Fracción' : 'Crear Fracción'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 rounded-full transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-gray-500"><path d="M18 6 6 18"/><path d="m6 6 18 18"/></svg>
          </button>
        </div>

        {/* Preview */}
        <div className="px-5 py-4 bg-blue-50 border-b border-primary/20">
          <p className="text-xs text-gray-500 mb-2 font-medium">Vista previa</p>
          <div className="bg-white rounded-lg border border-primary/30 p-3 text-center min-h-[48px] flex items-center justify-center">
            <span className="text-gray-700 text-sm">
              Texto ejemplo{' '}
              <span dangerouslySetInnerHTML={{ __html: previewHtml }} />{' '}
              más texto
            </span>
          </div>
        </div>

        {/* Inputs */}
        <div className="px-5 py-4 space-y-4">
          {/* Numerator */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              Numerador
            </label>
            <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary bg-white transition-all">
              <input
                ref={numRef}
                type="text"
                value={numerator}
                onChange={(e) => setNumerator(e.target.value)}
                className="flex-1 outline-none text-sm text-gray-700 bg-transparent"
                placeholder="Ej: x^{2} + 1"
              />
              <MathInputAdornment
                inputRef={numRef}
                currentValue={numerator}
                onValueChange={setNumerator}
              />
            </div>
          </div>

          {/* Denominator */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              Denominador
            </label>
            <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary bg-white transition-all">
              <input
                ref={denRef}
                type="text"
                value={denominator}
                onChange={(e) => setDenominator(e.target.value)}
                className="flex-1 outline-none text-sm text-gray-700 bg-transparent"
                placeholder="Ej: 2y"
              />
              <MathInputAdornment
                inputRef={denRef}
                currentValue={denominator}
                onValueChange={setDenominator}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleInsert}
            className="px-5 py-2 text-sm font-medium text-white bg-primary hover:bg-secondary rounded-lg shadow-sm transition-colors"
          >
            {isEditing ? 'Actualizar' : 'Insertar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FractionModal;
