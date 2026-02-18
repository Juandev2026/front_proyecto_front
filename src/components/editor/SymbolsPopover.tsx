import React, { useState, useRef, useEffect } from 'react';

interface SymbolsPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (latex: string) => void;
  /** Anchor element for positioning */
  anchorRef?: React.RefObject<HTMLElement>;
}

interface SymbolItem {
  display: string;
  latex: string;
  title: string;
}

const SYMBOL_CATEGORIES: Record<string, SymbolItem[]> = {
  'Básicos': [
    { display: '+', latex: '+', title: 'Suma' },
    { display: '−', latex: '-', title: 'Resta' },
    { display: '×', latex: '\\times', title: 'Multiplicación' },
    { display: '÷', latex: '\\div', title: 'División' },
    { display: '=', latex: '=', title: 'Igual' },
    { display: '≠', latex: '\\neq', title: 'No igual' },
    { display: '<', latex: '<', title: 'Menor que' },
    { display: '>', latex: '>', title: 'Mayor que' },
    { display: '≤', latex: '\\leq', title: 'Menor o igual' },
    { display: '≥', latex: '\\geq', title: 'Mayor o igual' },
    { display: '±', latex: '\\pm', title: 'Más menos' },
    { display: '∓', latex: '\\mp', title: 'Menos más' },
    { display: '·', latex: '\\cdot', title: 'Producto punto' },
    { display: '∞', latex: '\\infty', title: 'Infinito' },
    { display: '≈', latex: '\\approx', title: 'Aproximadamente' },
    { display: '∝', latex: '\\propto', title: 'Proporcional a' },
    { display: '…', latex: '\\dots', title: 'Puntos suspensivos' },
    { display: '∴', latex: '\\therefore', title: 'Por lo tanto' },
  ],
  'Álgebra': [
    { display: 'α', latex: '\\alpha', title: 'Alpha' },
    { display: 'β', latex: '\\beta', title: 'Beta' },
    { display: 'γ', latex: '\\gamma', title: 'Gamma' },
    { display: 'δ', latex: '\\delta', title: 'Delta' },
    { display: 'ε', latex: '\\epsilon', title: 'Epsilon' },
    { display: 'θ', latex: '\\theta', title: 'Theta' },
    { display: 'λ', latex: '\\lambda', title: 'Lambda' },
    { display: 'μ', latex: '\\mu', title: 'Mu' },
    { display: 'π', latex: '\\pi', title: 'Pi' },
    { display: 'σ', latex: '\\sigma', title: 'Sigma (minúscula)' },
    { display: 'Σ', latex: '\\Sigma', title: 'Sigma (mayúscula)' },
    { display: 'φ', latex: '\\phi', title: 'Phi' },
    { display: 'ω', latex: '\\omega', title: 'Omega' },
    { display: 'Ω', latex: '\\Omega', title: 'Omega (mayúscula)' },
    { display: 'Δ', latex: '\\Delta', title: 'Delta (mayúscula)' },
    { display: 'Π', latex: '\\Pi', title: 'Pi (mayúscula)' },
  ],
  'Geometría': [
    { display: '∠', latex: '\\angle', title: 'Ángulo' },
    { display: '△', latex: '\\triangle', title: 'Triángulo' },
    { display: '⊥', latex: '\\perp', title: 'Perpendicular' },
    { display: '∥', latex: '\\parallel', title: 'Paralelo' },
    { display: '≅', latex: '\\cong', title: 'Congruente' },
    { display: '~', latex: '\\sim', title: 'Similar' },
    { display: '°', latex: '^{\\circ}', title: 'Grado' },
    { display: '□', latex: '\\square', title: 'Cuadrado' },
    { display: '⊂', latex: '\\subset', title: 'Subconjunto' },
    { display: '⊃', latex: '\\supset', title: 'Superconjunto' },
    { display: '∈', latex: '\\in', title: 'Pertenece a' },
    { display: '∉', latex: '\\notin', title: 'No pertenece a' },
  ],
  'Cálculo': [
    { display: '∫', latex: '\\int', title: 'Integral' },
    { display: '∬', latex: '\\iint', title: 'Integral doble' },
    { display: '∮', latex: '\\oint', title: 'Integral de línea' },
    { display: '∂', latex: '\\partial', title: 'Derivada parcial' },
    { display: '∇', latex: '\\nabla', title: 'Nabla' },
    { display: '∑', latex: '\\sum', title: 'Sumatoria' },
    { display: '∏', latex: '\\prod', title: 'Productoria' },
    { display: 'lim', latex: '\\lim', title: 'Límite' },
    { display: '→', latex: '\\to', title: 'Tiende a' },
    { display: '⇒', latex: '\\Rightarrow', title: 'Implica' },
    { display: '⇔', latex: '\\Leftrightarrow', title: 'Si y solo si' },
    { display: 'dx', latex: 'dx', title: 'Diferencial x' },
  ],
  'Lógica': [
    { display: '∧', latex: '\\land', title: 'Y lógico (AND)' },
    { display: '∨', latex: '\\lor', title: 'O lógico (OR)' },
    { display: '¬', latex: '\\neg', title: 'Negación (NOT)' },
    { display: '∀', latex: '\\forall', title: 'Para todo' },
    { display: '∃', latex: '\\exists', title: 'Existe' },
    { display: '∄', latex: '\\nexists', title: 'No existe' },
    { display: '⊢', latex: '\\vdash', title: 'Demuestra' },
    { display: '⊨', latex: '\\models', title: 'Modela' },
    { display: '∅', latex: '\\emptyset', title: 'Conjunto vacío' },
    { display: '∪', latex: '\\cup', title: 'Unión' },
    { display: '∩', latex: '\\cap', title: 'Intersección' },
    { display: '⊆', latex: '\\subseteq', title: 'Subconjunto o igual' },
  ],
};

const CATEGORY_NAMES = Object.keys(SYMBOL_CATEGORIES);

const SymbolsPopover: React.FC<SymbolsPopoverProps> = ({
  isOpen,
  onClose,
  onInsert,
}) => {
  const [activeTab, setActiveTab] = useState<string>(CATEGORY_NAMES[0] || '');
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Delay to avoid closing immediately
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handler);
    }, 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handler);
    };
  }, [isOpen, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const symbols = SYMBOL_CATEGORIES[activeTab] || [];

  return (
    <div
      ref={popoverRef}
      className="absolute top-full left-0 mt-2 z-[9999] bg-white rounded-xl shadow-2xl border border-gray-200 w-80 overflow-hidden"
      style={{ maxHeight: '400px' }}
    >
      {/* Tabs */}
      <div className="px-3 py-2 border-b border-gray-100 flex flex-wrap gap-1.5">
        {CATEGORY_NAMES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveTab(cat)}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors
              ${activeTab === cat
                ? 'bg-blue-50 text-secondary'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Symbol Grid */}
      <div className="p-3 grid grid-cols-6 gap-1.5 max-h-60 overflow-y-auto">
        {symbols.map((sym: SymbolItem) => (
          <button
            key={sym.latex}
            type="button"
            onClick={() => {
              onInsert(sym.latex);
              onClose();
            }}
            title={sym.title}
            className="w-10 h-10 flex items-center justify-center text-lg rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-primary hover:text-primary transition-all text-gray-700 bg-white"
          >
            {sym.display}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SymbolsPopover;
