export default function ConnectionStatus({ online, connected, synced }) {
  let label = 'Офлайн — правки сохраняются локально';
  let tone = 'offline';

  if (online && connected && synced) {
    label = 'В сети — изменения сохранены';
    tone = 'synced';
  } else if (online && connected && !synced) {
    label = 'Синхронизация…';
    tone = 'syncing';
  } else if (online && !connected) {
    label = 'Подключение к серверу…';
    tone = 'syncing';
  }

  return (
    <div className={`status-chip status-chip--${tone}`}>
      <span className="status-dot" />
      {label}
    </div>
  );
}
