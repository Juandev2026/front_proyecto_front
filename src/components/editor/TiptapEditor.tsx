import React, { useCallback, useRef, useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import UnderlineExtension from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import FontFamily from '@tiptap/extension-font-family';
import SuperscriptExtension from '@tiptap/extension-superscript';
import SubscriptExtension from '@tiptap/extension-subscript';
import { Extension } from '@tiptap/core';

import EditorToolbar from './EditorToolbar';
import FractionModal from './FractionModal';
import RootModal from './RootModal';
import { MathInline } from './MathNode';

// CSS imports are in _app.tsx (Next.js 12 requires global CSS imports there)

/**
 * Custom TextStyle extension to support fontSize attribute
 */
const FontSize = Extension.create({
  name: 'fontSize',

  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element: HTMLElement) => element.style.fontSize || null,
            renderHTML: (attributes: Record<string, any>) => {
              if (!attributes.fontSize) return {};
              return { style: `font-size: ${attributes.fontSize}` };
            },
          },
        },
      },
    ];
  },
});

interface TiptapEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  borderColor?: string;
}

/**
 * Determine which modal to open based on a LaTeX string.
 */
function detectMathType(latex: string): 'fraction' | 'root' | 'generic' {
  if (latex.startsWith('\\frac{')) return 'fraction';
  if (latex.startsWith('\\sqrt')) return 'root';
  return 'generic';
}

const TiptapEditor: React.FC<TiptapEditorProps> = ({
  value,
  onChange,
  placeholder = 'Ingresa el texto de la alternativa',
  borderColor = 'border-primary',
}) => {
  // Modal states
  const [fractionModalOpen, setFractionModalOpen] = useState(false);
  const [rootModalOpen, setRootModalOpen] = useState(false);

  // Editing context: existing node being edited
  const [editingContext, setEditingContext] = useState<{
    latex: string;
    pos: number;
  } | null>(null);

  // Save cursor position before opening modals
  const savedSelectionRef = useRef<number | null>(null);

  // Ref for the wrapper div to listen to custom events
  const wrapperRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        // StarterKit includes history, bold, italic, strike, etc.
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      UnderlineExtension,
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      FontFamily,
      FontSize,
      SuperscriptExtension,
      SubscriptExtension,
      MathInline,
    ],
    content: value || '',
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose-reset',
        'data-placeholder': placeholder,
      },
    },
  });

  // Sync external value changes into the editor (e.g. form reset)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      // Only update if the content actually differs (avoids cursor jump)
      const editorHtml = editor.getHTML();
      if (value !== editorHtml) {
        editor.commands.setContent(value || '', { emitUpdate: false });
      }
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for custom double-click events from MathNode
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const handleMathEdit = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail) return;

      const { latex, pos } = detail;
      const type = detectMathType(latex);

      setEditingContext({ latex, pos });

      if (type === 'fraction') {
        setFractionModalOpen(true);
      } else if (type === 'root') {
        setRootModalOpen(true);
      } else {
        // Generic: open fraction modal with raw latex
        setFractionModalOpen(true);
      }
    };

    wrapper.addEventListener('math-node-edit', handleMathEdit);
    return () => wrapper.removeEventListener('math-node-edit', handleMathEdit);
  }, []);

  // --- Modal Handlers ---

  const handleOpenFractionModal = useCallback(() => {
    if (editor) {
      savedSelectionRef.current = editor.state.selection.anchor;
    }
    setEditingContext(null); // New formula, not editing
    setFractionModalOpen(true);
  }, [editor]);

  const handleOpenRootModal = useCallback(() => {
    if (editor) {
      savedSelectionRef.current = editor.state.selection.anchor;
    }
    setEditingContext(null);
    setRootModalOpen(true);
  }, [editor]);

  /**
   * Insert or update a math node.
   * Restores focus and cursor position after modal closes.
   */
  const handleInsertMath = useCallback(
    (latex: string) => {
      if (!editor) return;

      if (editingContext) {
        // Editing existing node — update in place
        editor.chain().focus().updateMath(editingContext.pos, latex).run();
      } else {
        // Inserting new node — restore cursor position first
        const pos = savedSelectionRef.current;
        if (pos !== null) {
          editor.chain().focus().insertContentAt(pos, {
            type: 'mathInline',
            attrs: { latex },
          }).run();
        } else {
          editor.chain().focus().insertMath(latex).run();
        }
      }

      setEditingContext(null);
      savedSelectionRef.current = null;
    },
    [editor, editingContext]
  );

  /**
   * Insert a math symbol (from symbols popover) directly.
   */
  const handleInsertMathSymbol = useCallback(
    (latex: string) => {
      if (!editor) return;
      editor.chain().focus().insertMath(latex).run();
    },
    [editor]
  );

  const handleCloseModals = useCallback(() => {
    setFractionModalOpen(false);
    setRootModalOpen(false);
    setEditingContext(null);
    // Restore focus to editor
    if (editor) {
      requestAnimationFrame(() => editor.chain().focus().run());
    }
  }, [editor]);

  return (
    <div ref={wrapperRef} className={`tiptap-editor-wrapper border rounded-lg overflow-hidden bg-white transition-all ${borderColor}`}>
      {/* Toolbar */}
      <EditorToolbar
        editor={editor}
        onOpenFractionModal={handleOpenFractionModal}
        onOpenRootModal={handleOpenRootModal}
        onInsertMathSymbol={handleInsertMathSymbol}
      />

      {/* Editor Content */}
      <EditorContent editor={editor} />

      {/* Modals */}
      <FractionModal
        isOpen={fractionModalOpen}
        onClose={handleCloseModals}
        onInsert={handleInsertMath}
        initialLatex={editingContext?.latex}
        isEditing={!!editingContext}
      />

      <RootModal
        isOpen={rootModalOpen}
        onClose={handleCloseModals}
        onInsert={handleInsertMath}
        initialLatex={editingContext?.latex}
        isEditing={!!editingContext}
      />
    </div>
  );
};

export default TiptapEditor;
