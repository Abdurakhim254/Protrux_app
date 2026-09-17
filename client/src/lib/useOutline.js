import { useEffect, useState } from 'react';


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
