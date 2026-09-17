function initials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export default function PresenceBar({ peers, me }) {
  const visible = peers.slice(0, 5);
  const overflow = peers.length - visible.length;

  return (
    <div className="presence-bar" aria-label="Кто сейчас в документе">
      <div className="presence-stack">
        {visible.map((p) => (
          <span
            key={p.clientID}
            className="presence-avatar"
            style={{ background: p.color }}
            title={p.name}
          >
            {initials(p.name)}
          </span>
        ))}
        {overflow > 0 && <span className="presence-avatar presence-avatar--overflow">+{overflow}</span>}
        <span className="presence-avatar presence-avatar--me" style={{ background: me.color }} title={`${me.name} (вы)`}>
          {initials(me.name)}
        </span>
      </div>
      <span className="presence-count">
        {peers.length === 0
          ? 'вы одни в документе'
          : `в документе: ${peers.length + 1}`}
      </span>
    </div>
  );
}
