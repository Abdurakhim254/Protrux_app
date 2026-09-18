import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const TEXT_COLORS = [
  { name: 'Чернила', value: '#1b2a2f' },
  { name: 'Морская волна', value: '#2f5d62' },
  { name: 'Латунь', value: '#b3812f' },
  { name: 'Сургуч', value: '#a8402f' },
  { name: 'Олива', value: '#5c6b2e' },
  { name: 'Слива', value: '#7a4a68' },
];

const HIGHLIGHT_COLORS = [
  { name: 'Латунь', value: '#ecdfc0' },
  { name: 'Волна', value: '#dbe6e4' },
  { name: 'Сургуч', value: '#f1ddd6' },
  { name: 'Олива', value: '#e3e6d3' },
];

function ToolbarButton({ active, onClick, title, children, disabled }) {
  return (
    <button
      type="button"
      className={`tb-btn${active ? ' is-active' : ''}`}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={title}
      aria-label={title}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

function SwatchPicker({ title, swatches, onPick, onClear, current }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setMenuPos({
      top: rect.bottom + 6,
      left: rect.left,
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        menuRef.current && !menuRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div className="tb-swatch-picker">
      <button
        type="button"
        className="tb-btn"
        title={title}
        aria-label={title}
        ref={triggerRef}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="tb-swatch-preview" style={{ background: current || 'transparent' }} />
      </button>
      {open &&
        createPortal(
          <div
            className="tb-swatch-menu"
            role="menu"
            ref={menuRef}
            style={{ top: menuPos.top, left: menuPos.left }}
          >
            {swatches.map((s) => (
              <button
                key={s.value}
                type="button"
                className="tb-swatch"
                style={{ background: s.value }}
                title={s.name}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onPick(s.value);
                  setOpen(false);
                }}
              />
            ))}
            <button
              type="button"
              className="tb-swatch tb-swatch--clear"
              title="Убрать"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onClear();
                setOpen(false);
              }}
            >
              ×
            </button>
          </div>,
          document.body
        )}
    </div>
  );
}

function FontSizePicker({ editor }) {
  const currentFontSizeStr = editor?.getAttributes('textStyle')?.fontSize;
  const parsedSize = currentFontSizeStr ? parseInt(currentFontSizeStr, 10) : 16;
  const [sizeInput, setSizeInput] = useState(String(parsedSize));

  useEffect(() => {
    setSizeInput(String(parsedSize));
  }, [parsedSize]);

  function applySize(newSize) {
    const val = Math.min(Math.max(Number(newSize) || 16, 8), 96);
    setSizeInput(String(val));
    editor.chain().focus().setFontSize(`${val}px`).run();
  }

  function handleDecrement() {
    applySize(parsedSize - 1);
  }

  function handleIncrement() {
    applySize(parsedSize + 1);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      applySize(sizeInput);
    }
  }

  function handleBlur() {
    applySize(sizeInput);
  }

  return (
    <div className="tb-fontsize-group" title="Размер шрифта">
      <button
        type="button"
        className="tb-btn tb-btn--step"
        onMouseDown={(e) => e.preventDefault()}
        onClick={handleDecrement}
        title="Уменьшить размер шрифта"
        aria-label="Уменьшить размер шрифта"
      >
        −
      </button>
      <input
        type="text"
        className="tb-fontsize-input"
        value={sizeInput}
        onChange={(e) => setSizeInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        aria-label="Размер шрифта"
      />
      <button
        type="button"
        className="tb-btn tb-btn--step"
        onMouseDown={(e) => e.preventDefault()}
        onClick={handleIncrement}
        title="Увеличить размер шрифта"
        aria-label="Увеличить размер шрифта"
      >
        +
      </button>
    </div>
  );
}

export default function Toolbar({ editor }) {
  if (!editor) return null;

  const styleValue = editor.isActive('heading', { level: 1 })
    ? 'h1'
    : editor.isActive('heading', { level: 2 })
      ? 'h2'
      : editor.isActive('heading', { level: 3 })
        ? 'h3'
        : 'p';

  function handleStyleChange(e) {
    const v = e.target.value;
    if (v === 'p') editor.chain().focus().setParagraph().run();
    else editor.chain().focus().toggleHeading({ level: Number(v[1]) }).run();
  }

  return (
    <div className="toolbar" role="toolbar" aria-label="Форматирование">
      <div className="tb-group">
        <ToolbarButton
          title="Отменить"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          ↶
        </ToolbarButton>
        <ToolbarButton
          title="Повторить"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          ↷
        </ToolbarButton>
      </div>

      <div className="tb-divider" />

      <select
        className="tb-select"
        value={styleValue}
        onChange={handleStyleChange}
        title="Стиль текста"
        aria-label="Стиль текста"
      >
        <option value="p">Обычный текст</option>
        <option value="h1">Заголовок 1</option>
        <option value="h2">Заголовок 2</option>
        <option value="h3">Заголовок 3</option>
      </select>

      <div className="tb-divider" />

      <FontSizePicker editor={editor} />

      <div className="tb-divider" />

      <div className="tb-group">
        <ToolbarButton
          title="Жирный"
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <strong>Ж</strong>
        </ToolbarButton>
        <ToolbarButton
          title="Курсив"
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <em>К</em>
        </ToolbarButton>
        <ToolbarButton
          title="Подчёркнутый"
          active={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <span style={{ textDecoration: 'underline' }}>Ч</span>
        </ToolbarButton>
        <ToolbarButton
          title="Зачёркнутый"
          active={editor.isActive('strike')}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <span style={{ textDecoration: 'line-through' }}>З</span>
        </ToolbarButton>
        <SwatchPicker
          title="Цвет текста"
          swatches={TEXT_COLORS}
          current={editor.getAttributes('textStyle').color}
          onPick={(color) => editor.chain().focus().setColor(color).run()}
          onClear={() => editor.chain().focus().unsetColor().run()}
        />
        <SwatchPicker
          title="Маркер"
          swatches={HIGHLIGHT_COLORS}
          current={editor.getAttributes('highlight').color}
          onPick={(color) => editor.chain().focus().toggleHighlight({ color }).run()}
          onClear={() => editor.chain().focus().unsetHighlight().run()}
        />
        <ToolbarButton
          title="Ссылка"
          active={editor.isActive('link')}
          onClick={() => {
            const url = window.prompt('Адрес ссылки', editor.getAttributes('link').href || 'https://');
            if (url === null) return;
            if (url === '') editor.chain().focus().unsetLink().run();
            else editor.chain().focus().setLink({ href: url }).run();
          }}
        >
          ⛓
        </ToolbarButton>
        <ToolbarButton
          title="Изображение по ссылке"
          onClick={() => {
            const url = window.prompt('Адрес изображения (URL)');
            if (url) editor.chain().focus().setImage({ src: url }).run();
          }}
        >
          🖼
        </ToolbarButton>
      </div>

      <div className="tb-divider" />

      <div className="tb-group">
        <ToolbarButton
          title="По левому краю"
          active={
            editor.isActive({ textAlign: 'left' }) ||
            (!editor.isActive({ textAlign: 'center' }) &&
              !editor.isActive({ textAlign: 'right' }) &&
              !editor.isActive({ textAlign: 'justify' }))
          }
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
        >
          ≡←
        </ToolbarButton>
        <ToolbarButton
          title="По центру"
          active={editor.isActive({ textAlign: 'center' })}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
        >
          ≡
        </ToolbarButton>
        <ToolbarButton
          title="По правому краю"
          active={editor.isActive({ textAlign: 'right' })}
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
        >
          →≡
        </ToolbarButton>
        <ToolbarButton
          title="По ширине"
          active={editor.isActive({ textAlign: 'justify' })}
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        >
          ≡≡
        </ToolbarButton>
      </div>

      <div className="tb-divider" />

      <div className="tb-group">
        <ToolbarButton
          title="Маркированный список"
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <circle cx="2.5" cy="4" r="1.3" fill="currentColor" />
            <circle cx="2.5" cy="8" r="1.3" fill="currentColor" />
            <circle cx="2.5" cy="12" r="1.3" fill="currentColor" />
            <rect x="6" y="3.2" width="9" height="1.6" fill="currentColor" />
            <rect x="6" y="7.2" width="9" height="1.6" fill="currentColor" />
            <rect x="6" y="11.2" width="9" height="1.6" fill="currentColor" />
          </svg>
        </ToolbarButton>
        <ToolbarButton
          title="Нумерованный список"
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <text x="0.5" y="5.3" fontSize="4.2" fill="currentColor">1</text>
            <text x="0.5" y="9.3" fontSize="4.2" fill="currentColor">2</text>
            <text x="0.5" y="13.3" fontSize="4.2" fill="currentColor">3</text>
            <rect x="6" y="3.2" width="9" height="1.6" fill="currentColor" />
            <rect x="6" y="7.2" width="9" height="1.6" fill="currentColor" />
            <rect x="6" y="11.2" width="9" height="1.6" fill="currentColor" />
          </svg>
        </ToolbarButton>
        <ToolbarButton
          title="Список задач"
          active={editor.isActive('taskList')}
          onClick={() => editor.chain().focus().toggleTaskList().run()}
        >
          ☑
        </ToolbarButton>
        <ToolbarButton
          title="Цитата"
          active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <path
              d="M3 5.5c0-1.4 1-2.3 2.4-2.3v1.2c-.7 0-1.2.4-1.2 1.1v.2h1.2v3H3V5.5zm5.3 0c0-1.4 1-2.3 2.4-2.3v1.2c-.7 0-1.2.4-1.2 1.1v.2h1.2v3H8.3V5.5z"
              fill="currentColor"
            />
          </svg>
        </ToolbarButton>
        <ToolbarButton
          title="Уменьшить отступ"
          onClick={() => editor.chain().focus().liftListItem('listItem').run()}
          disabled={!editor.can().liftListItem('listItem')}
        >
          ⇤
        </ToolbarButton>
        <ToolbarButton
          title="Увеличить отступ"
          onClick={() => editor.chain().focus().sinkListItem('listItem').run()}
          disabled={!editor.can().sinkListItem('listItem')}
        >
          ⇥
        </ToolbarButton>
      </div>

      <div className="tb-divider" />

      <div className="tb-group">
        <ToolbarButton
          title="Очистить форматирование"
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
        >
          Tx
        </ToolbarButton>
      </div>
    </div>
  );
}
