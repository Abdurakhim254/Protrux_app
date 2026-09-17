import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import DropdownMenu from './DropdownMenu.jsx';
import ConfirmDialog from './ConfirmDialog_temp.jsx';

function formatDate(ts) {
  const d = new Date(ts);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  if (sameDay) {
    return `сегодня, ${d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
  }
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function DocumentCard({ doc, onOpen, onRename, onDelete }) {
  const [preview, setPreview] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [draftTitle, setDraftTitle] = useState(doc.title || '');
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .getPreview(doc.id)
      .then((res) => {
        if (!cancelled) setPreview(res?.preview || '');
      })
      .catch(() => { });
    return () => {
      cancelled = true;
    };
  }, [doc.id]);

  function commitRename() {
    setRenaming(false);
    const title = draftTitle.trim() || 'Без названия';
    if (title !== doc.title) onRename(doc.id, title);
  }

  return (
    <div className="doc-card" onClick={() => !renaming && onOpen(doc.id)}>
      <div className="doc-card-preview">
        <span className="doc-card-preview-title">{doc.title || 'Без названия'}</span>
        <span className="doc-card-preview-text">{preview}</span>
      </div>
      <div className="doc-card-footer">
        {renaming ? (
          <input
            autoFocus
            className="doc-card-rename-input"
            value={draftTitle}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => setDraftTitle(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitRename();
              if (e.key === 'Escape') {
                setDraftTitle(doc.title || '');
                setRenaming(false);
              }
            }}
          />
        ) : (
          <span className="doc-card-title">{doc.title || 'Без названия'}</span>
        )}
        <span className="doc-card-date">{formatDate(doc.updated_at)}</span>
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu
            label={`Действия с документом «${doc.title || 'Без названия'}»`}
            items={[
              {
                label: 'Переименовать',
                onSelect: () => {
                  setDraftTitle(doc.title || '');
                  setRenaming(true);
                },
              },
              {
                label: 'Открыть в новой вкладке',
                onSelect: () => window.open(`/d/${doc.id}`, '_blank', 'noopener'),
              },
              {
                label: 'Удалить',
                danger: true,
                onSelect: () => setConfirmingDelete(true),
              },
            ]}
          />
        </div>
      </div>

      <ConfirmDialog
        open={confirmingDelete}
        title={`Удалить «${doc.title || 'Без названия'}»?`}
        message="Это действие необратимо — документ будет удалён без возможности восстановления."
        confirmLabel="Удалить"
        cancelLabel="Отмена"
        danger
        onConfirm={() => {
          setConfirmingDelete(false);
          onDelete(doc.id);
        }}
        onCancel={() => setConfirmingDelete(false)}
      />
    </div>
  );
}