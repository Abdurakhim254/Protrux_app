import { useEffect, useState } from 'react';

/**
 * Walks the current ProseMirror document and returns every heading as
 * `{ pos, level, text }`, recomputed on every editor transaction. Powers
 * the outline sidebar — clicking an entry jumps the cursor (and viewport)
 * to that heading.
 */
export function useOutline(editor) {
  const [headings, setHeadings] = useState([]);

  useEffect(() => {
    if (!editor) return;

    function compute() {
      const items = [];
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'heading') {
          items.push({
            pos,
            level: node.attrs.level,
            text: node.textContent.trim() || 'Без названия',
          });
        }
      });
      setHeadings(items);
    }

    compute();
    editor.on('update', compute);
    return () => editor.off('update', compute);
  }, [editor]);

  return headings;
}
