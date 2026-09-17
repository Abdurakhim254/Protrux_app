function jumpTo(editor, pos) {
  editor
    .chain()
    .focus()
    .setTextSelection(Math.min(pos + 1, editor.state.doc.content.size))
    .scrollIntoView()
    .run();
}

export default function OutlineSidebar({ editor, headings }) {
  return (
    <aside className="outline-sidebar">
      <div className="outline-sidebar-title">Оглавление</div>
      {headings.length === 0 ? (
        <p className="outline-empty">
          Здесь появятся заголовки документа — добавьте H1, H2 или H3, чтобы
          было удобно перемещаться по тексту.
        </p>
      ) : (
        <nav className="outline-list" aria-label="Оглавление документа">
          {headings.map((h) => (
            <button
              key={h.pos}
              className={`outline-item outline-item--level-${h.level}`}
              onClick={() => jumpTo(editor, h.pos)}
              title={h.text}
            >
              {h.text}
            </button>
          ))}
        </nav>
      )}
    </aside>
  );
}
