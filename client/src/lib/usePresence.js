import { useEffect, useState } from 'react';

export function usePresence(provider) {
  const [peers, setPeers] = useState([]);

  useEffect(() => {
    if (!provider) return;
    const { awareness } = provider;

    const update = () => {
      const states = Array.from(awareness.getStates().entries())
        .filter(([clientID, state]) => state && state.user && clientID !== awareness.clientID)
        .map(([clientID, state]) => ({ clientID, ...state.user }));
      setPeers(states);
    };

    awareness.on('change', update);
    update();
    return () => awareness.off('change', update);
  }, [provider]);

  return peers;
}
