import { Node, mergeAttributes } from '@tiptap/core';
import katex from 'katex';

export interface MathNodeOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    mathInline: {
      insertMath: (latex: string) => ReturnType;
      updateMath: (pos: number, latex: string) => ReturnType;
    };
  }
}

/**
 * Safely render LaTeX to HTML string using KaTeX.
 * Returns error HTML on invalid syntax instead of throwing.
 */
function safeKatexRender(latex: string): string {
  try {
    return katex.renderToString(latex, {
      throwOnError: false,
      displayMode: false,
      output: 'html',
    });
  } catch {
    return `<span class="math-error" title="Error de sintaxis LaTeX">⚠ ${latex}</span>`;
  }
}

const MathInline = Node.create<MathNodeOptions>({
  name: 'mathInline',

  group: 'inline',
  inline: true,
  atom: true, // Cannot be edited internally — treated as a single unit
  selectable: true,
  draggable: false,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      latex: {
        default: '',
        parseHTML: (element: HTMLElement) => element.getAttribute('data-latex') || '',
        renderHTML: (attributes: Record<string, any>) => ({
          'data-latex': attributes.latex,
        }),
      },
    };
  },

  /**
   * parseHTML — Matches <span data-type="math-inline"> tags from saved HTML.
   * Symmetric with renderHTML to ensure persistence and hydration.
   */
  parseHTML() {
    return [
      {
        tag: 'span[data-type="math-inline"]',
      },
    ];
  },

  /**
   * renderHTML — Outputs <span data-type="math-inline" data-latex="...">KaTeX HTML</span>
   * The inner KaTeX HTML is for display; the data-latex attribute is the source of truth.
   */
  renderHTML({ HTMLAttributes }) {
    // Create the element array Tiptap expects: [tagName, attributes]
    const attrs = mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
      'data-type': 'math-inline',
      class: 'math-node-inline',
    });

    // Atom nodes cannot have a content hole (0). The NodeView provides the visual rendering.
    return ['span', attrs];
  },

  /**
   * NodeView — Renders the node in the editor with KaTeX.
   * On double-click, dispatches a custom event to open edit modals.
   */
  addNodeView() {
    return ({ node, getPos, editor }) => {
      const dom = document.createElement('span');
      dom.className = 'math-node-inline';
      dom.setAttribute('data-type', 'math-inline');
      dom.setAttribute('data-latex', node.attrs.latex);
      dom.contentEditable = 'false';

      // Render KaTeX
      dom.innerHTML = safeKatexRender(node.attrs.latex);

      // Double-click to edit
      dom.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const pos = typeof getPos === 'function' ? getPos() : 0;
        // Dispatch custom event for the editor wrapper to catch
        const event = new CustomEvent('math-node-edit', {
          bubbles: true,
          detail: {
            latex: node.attrs.latex,
            pos,
            editor,
          },
        });
        dom.dispatchEvent(event);
      });

      return {
        dom,
        update(updatedNode) {
          if (updatedNode.type.name !== 'mathInline') return false;
          dom.setAttribute('data-latex', updatedNode.attrs.latex);
          dom.innerHTML = safeKatexRender(updatedNode.attrs.latex);
          return true;
        },
        destroy() {
          // Cleanup if needed
        },
      };
    };
  },

  addCommands() {
    return {
      insertMath:
        (latex: string) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { latex },
          });
        },
      updateMath:
        (pos: number, latex: string) =>
        ({ tr, dispatch }) => {
          if (dispatch) {
            tr.setNodeMarkup(pos, undefined, { latex });
            dispatch(tr);
          }
          return true;
        },
    };
  },
});

export { MathInline, safeKatexRender };
export default MathInline;
