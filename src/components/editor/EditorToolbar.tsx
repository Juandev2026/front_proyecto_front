import React, { useState, useRef, useCallback } from 'react';

import { Editor } from '@tiptap/react';

import SymbolsPopover from './SymbolsPopover';

// --- INLINE ICONS (Replacing lucide-react for Next 12 compatibility) ---
const Icons = {
  Undo2: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11" />
    </svg>
  ),
  Redo2: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m15 14 5-5-5-5" />
      <path d="M20 9H9.5A5.5 5.5 0 0 0 4 14.5v0A5.5 5.5 0 0 0 9.5 20H13" />
    </svg>
  ),
  Bold: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 12a4 4 0 0 0 0-8H6v8" />
      <path d="M15 20a4 4 0 0 0 0-8H6v8Z" />
    </svg>
  ),
  Italic: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="19" x2="10" y1="4" y2="4" />
      <line x1="14" x2="5" y1="20" y2="20" />
      <line x1="15" x2="9" y1="4" y2="20" />
    </svg>
  ),
  Underline: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 4v6a6 6 0 0 0 12 0V4" />
      <line x1="4" x2="20" y1="20" y2="20" />
    </svg>
  ),
  Strikethrough: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 4H9a3 3 0 0 0-2.83 4" />
      <path d="M14 12a4 4 0 0 1 0 8H6" />
      <line x1="4" x2="20" y1="12" y2="12" />
    </svg>
  ),
  AlignLeft: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="21" x2="3" y1="6" y2="6" />
      <line x1="15" x2="3" y1="12" y2="12" />
      <line x1="17" x2="3" y1="18" y2="18" />
    </svg>
  ),
  AlignCenter: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="21" x2="3" y1="6" y2="6" />
      <line x1="19" x2="5" y1="12" y2="12" />
      <line x1="21" x2="3" y1="18" y2="18" />
    </svg>
  ),
  AlignRight: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="21" x2="3" y1="6" y2="6" />
      <line x1="21" x2="9" y1="12" y2="12" />
      <line x1="21" x2="7" y1="18" y2="18" />
    </svg>
  ),
  AlignJustify: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="3" x2="21" y1="6" y2="6" />
      <line x1="3" x2="21" y1="12" y2="12" />
      <line x1="3" x2="21" y1="18" y2="18" />
    </svg>
  ),
  Superscript: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m4 6 8 8" />
      <path d="m12 6-8 8" />
      <path d="M20 10V4h-4" />
      <path d="M20 10h-4" />
    </svg>
  ), // Simplified x2 look
  Subscript: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m4 6 8 8" />
      <path d="m12 6-8 8" />
      <path d="M20 19v-6h-4" />
      <path d="M20 19h-4" />
    </svg>
  ),
  Sigma: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 7V4H6l6 8-6 8h12v-3" />
    </svg>
  ),
};

interface EditorToolbarProps {
  editor: Editor | null;
  onOpenFractionModal: () => void;
  onOpenRootModal: () => void;
  onInsertMathSymbol: (latex: string) => void;
}

/**
 * Toolbar button with active state highlighting.
 */
const ToolButton: React.FC<{
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}> = ({ onClick, isActive, disabled, title, children }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-1.5 rounded transition-colors ${
      isActive
        ? 'bg-blue-50 text-secondary' // Keeping bg-blue-50 (light) but text secondary
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
    } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
  >
    {children}
  </button>
);

/** Vertical divider between button groups */
const Divider = () => (
  <div className="h-5 w-px bg-gray-300 mx-1.5 self-center" />
);

const FONT_FAMILIES = [
  { label: 'Arial', value: 'Arial' },
  { label: 'Comic Sans', value: 'Comic Sans MS' },
  { label: 'Courier New', value: 'Courier New' },
  { label: 'Georgia', value: 'Georgia' },
  { label: 'Helvetica', value: 'Helvetica' },
  { label: 'Lucida', value: 'Lucida Console' },
];

const FONT_SIZES = [
  { label: '12px', value: '12px' },
  { label: '14px', value: '14px' },
  { label: '16px', value: '16px' },
  { label: '18px', value: '18px' },
  { label: '20px', value: '20px' },
  { label: '24px', value: '24px' },
];

const EditorToolbar: React.FC<EditorToolbarProps> = ({
  editor,
  onOpenFractionModal,
  onOpenRootModal,
  onInsertMathSymbol,
}) => {
  const [showSymbols, setShowSymbols] = useState(false);
  const sigmaRef = useRef<HTMLDivElement>(null);

  const handleFontSizeChange = useCallback(
    (size: string) => {
      if (!editor) return;
      // Use inline style for font-size via textStyle
      editor.chain().focus().setMark('textStyle', { fontSize: size }).run();
    },
    [editor]
  );

  if (!editor) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-1 gap-y-1.5 bg-white border-b border-gray-200 px-3 py-2 rounded-t-lg">
      {/* Group 1: Undo/Redo */}
      <ToolButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Deshacer"
      >
        <Icons.Undo2 />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Rehacer"
      >
        <Icons.Redo2 />
      </ToolButton>

      <Divider />

      {/* Group 2: Font Family + Size */}
      <select
        className="text-xs border border-gray-300 rounded px-2 py-1 text-gray-700 bg-white focus:outline-none focus:border-primary cursor-pointer"
        onChange={(e) => {
          if (e.target.value === '') {
            editor.chain().focus().unsetFontFamily().run();
          } else {
            editor.chain().focus().setFontFamily(e.target.value).run();
          }
        }}
        value=""
        title="Fuente"
      >
        <option value="">Fuente</option>
        {FONT_FAMILIES.map((f) => (
          <option key={f.value} value={f.value}>
            {f.label}
          </option>
        ))}
      </select>

      <select
        className="text-xs border border-gray-300 rounded px-2 py-1 text-gray-700 bg-white focus:outline-none focus:border-primary cursor-pointer w-16"
        onChange={(e) => handleFontSizeChange(e.target.value)}
        value=""
        title="Tamaño"
      >
        <option value="">16px</option>
        {FONT_SIZES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      <Divider />

      {/* Group 3: Color + Highlight */}
      <div className="flex items-center gap-1 md:gap-1.5">
        <span className="hidden sm:inline text-[10px] md:text-xs text-gray-500 font-medium">
          Color:
        </span>
        <input
          type="color"
          className="w-5 h-5 md:w-6 md:h-6 border border-gray-300 rounded cursor-pointer p-0"
          onChange={(e) =>
            editor.chain().focus().setColor(e.target.value).run()
          }
          defaultValue="#000000"
          title="Color de texto"
        />
      </div>
      <div className="flex items-center gap-1 md:gap-1.5 ml-0.5 md:ml-1">
        <span className="hidden sm:inline text-[10px] md:text-xs text-gray-500 font-medium">
          Resaltar:
        </span>
        <label className="flex items-center cursor-pointer" title="Resaltado">
          <input
            type="checkbox"
            className="w-3.5 h-3.5 md:w-4 md:h-4 rounded border-gray-300 text-yellow-500 focus:ring-yellow-400 cursor-pointer"
            checked={editor.isActive('highlight')}
            onChange={() =>
              editor.chain().focus().toggleHighlight({ color: '#fef08a' }).run()
            }
          />
        </label>
      </div>

      <Divider />

      {/* Group 4: Bold, Italic, Underline, Strike */}
      <ToolButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        title="Negrita"
      >
        <Icons.Bold />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        title="Cursiva"
      >
        <Icons.Italic />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive('underline')}
        title="Subrayado"
      >
        <Icons.Underline />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        title="Tachado"
      >
        <Icons.Strikethrough />
      </ToolButton>

      <Divider />

      {/* Group 5: Alignment */}
      <ToolButton
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        isActive={editor.isActive({ textAlign: 'left' })}
        title="Alinear a la izquierda"
      >
        <Icons.AlignLeft />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        isActive={editor.isActive({ textAlign: 'center' })}
        title="Centrar"
      >
        <Icons.AlignCenter />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        isActive={editor.isActive({ textAlign: 'right' })}
        title="Alinear a la derecha"
      >
        <Icons.AlignRight />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        isActive={editor.isActive({ textAlign: 'justify' })}
        title="Justificar"
      >
        <Icons.AlignJustify />
      </ToolButton>

      <Divider />

      {/* Group 6: Math Buttons */}
      {/* Fraction */}
      <button
        type="button"
        onClick={onOpenFractionModal}
        title="Fracción"
        className="px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded transition-colors border border-gray-200"
      >
        <span className="font-serif italic">a/b</span>
      </button>

      {/* Root */}
      <button
        type="button"
        onClick={onOpenRootModal}
        title="Raíz"
        className="px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded transition-colors border border-gray-200"
      >
        <span className="font-serif">√x</span>
      </button>

      {/* Superscript */}
      <ToolButton
        onClick={() => editor.chain().focus().toggleSuperscript().run()}
        isActive={editor.isActive('superscript')}
        title="Superíndice"
      >
        <Icons.Superscript />
      </ToolButton>

      {/* Subscript */}
      <ToolButton
        onClick={() => editor.chain().focus().toggleSubscript().run()}
        isActive={editor.isActive('subscript')}
        title="Subíndice"
      >
        <Icons.Subscript />
      </ToolButton>

      {/* Sigma / Symbols */}
      <div ref={sigmaRef} className="relative">
        <ToolButton
          onClick={() => setShowSymbols(!showSymbols)}
          isActive={showSymbols}
          title="Símbolos matemáticos"
        >
          <Icons.Sigma />
        </ToolButton>
        <SymbolsPopover
          isOpen={showSymbols}
          onClose={() => setShowSymbols(false)}
          onInsert={(latex) => {
            onInsertMathSymbol(latex);
            setShowSymbols(false);
          }}
        />
      </div>
    </div>
  );
};

export default EditorToolbar;
