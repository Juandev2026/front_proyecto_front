import React, { useState, useRef, useEffect, useMemo } from 'react';

import katex from 'katex';
import MathInputAdornment from './MathInputAdornment';

interface RootModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (latex: string) => void;
  initialLatex?: string;
  isEditing?: boolean;
}

/**
 * Parse \sqrt{rad} or \sqrt[n]{rad} and extract index + radicand.
 */
function parseRoot(latex: string): { index: string; radicand: string } | null {
  // \sqrt[n]{rad}
  const withIndex = latex.match(/^\\sqrt\[([^\]]*)\]\{(.*)\}$/);
  if (withIndex) {
    return { index: withIndex[1] || '', radicand: withIndex[2] || '' };
  }
  // \sqrt{rad}
  const simple = latex.match(/^\\sqrt\{(.*)\}$/);
  if (simple) {
    return { index: '', radicand: simple[1] || '' };
  }
  return null;
}

const PRESETS = [
  { label: '√', index: '', tooltip: 'Raíz cuadrada' },
  { label: '∛', index: '3', tooltip: 'Raíz cúbica' },
  { label: '∜', index: '4', tooltip: 'Raíz cuarta' },
  { label: 'ⁿ√', index: 'n', tooltip: 'Raíz n-ésima' },
];

const RootModal: React.FC<RootModalProps> = ({
  isOpen,
  onClose,
  onInsert,
  initialLatex,
  isEditing = false,
}) => {
  const [index, setIndex] = useState('');
  const [radicand, setRadicand] = useState('');
  const indexRef = useRef<HTMLInputElement>(null);
  const radicandRef = useRef<HTMLInputElement>(null);

  // Pre-fill when editing
  useEffect(() => {
    if (isOpen && initialLatex && isEditing) {
      const parsed = parseRoot(initialLatex);
      if (parsed) {
        setIndex(parsed.index);
        setRadicand(parsed.radicand);
      } else {
        setIndex('');
        setRadicand(initialLatex);
      }
    } else if (isOpen && !isEditing) {
      setIndex('');
      setRadicand('');
    }
  }, [isOpen, initialLatex, isEditing]);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => radicandRef.current?.focus());
    }
  }, [isOpen]);

  // Live preview
  const previewHtml = useMemo(() => {
    const rad = radicand || '?';
    const latex = index ? `\\sqrt[${index}]{${rad}}` : `\\sqrt{${rad}}`;
    try {
      return katex.renderToString(latex, { throwOnError: false, displayMode: false });
    } catch {
      return '<span style="color: #ef4444;">Error de sintaxis</span>';
    }
  }, [index, radicand]);

  const handlePreset = (presetIndex: string) => {
    setIndex(presetIndex);
    requestAnimationFrame(() => radicandRef.current?.focus());
  };

  const handleInsert = () => {
    if (!radicand.trim()) return;
    const latex = index.trim()
      ? `\\sqrt[${index}]{${radicand}}`
      : `\\sqrt{${radicand}}`;
    onInsert(latex);
    setIndex('');
    setRadicand('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-40" onClick={onClose} />

      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-gray-50">
          <h3 className="text-base font-semibold text-gray-800">
            {isEditing ? 'Editar Raíz' : 'Crear Raíz'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-gray-500"><path d="M18 6 6 18"/><path d="m6 6 18 18"/></svg>
          </button>
        </div>

        {/* Presets */}
        <div className="px-5 py-3 border-b border-gray-100 bg-white">
          <p className="text-xs text-gray-500 mb-2 font-medium">Accesos rápidos</p>
          <div className="flex gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => handlePreset(preset.index)}
                title={preset.tooltip}
                className={`px-4 py-2 text-lg rounded-lg border transition-all font-medium
                  ${index === preset.index
                    ? 'bg-blue-50 border-primary text-secondary'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300'
                  }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
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
          {/* Index */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              Índice <span className="text-gray-400 normal-case font-normal">(opcional)</span>
            </label>
            <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary bg-white transition-all">
              <input
                ref={indexRef}
                type="text"
                value={index}
                onChange={(e) => setIndex(e.target.value)}
                className="flex-1 outline-none text-sm text-gray-700 bg-transparent"
                placeholder="Ej: 3 (vacío = raíz cuadrada)"
              />
              <MathInputAdornment
                inputRef={indexRef}
                currentValue={index}
                onValueChange={setIndex}
              />
            </div>
          </div>

          {/* Radicand */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              Radicando
            </label>
            <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary bg-white transition-all">
              <input
                ref={radicandRef}
                type="text"
                value={radicand}
                onChange={(e) => setRadicand(e.target.value)}
                className="flex-1 outline-none text-sm text-gray-700 bg-transparent"
                placeholder="Ej: x^{2} + 1"
              />
              <MathInputAdornment
                inputRef={radicandRef}
                currentValue={radicand}
                onValueChange={setRadicand}
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

export default RootModal;
