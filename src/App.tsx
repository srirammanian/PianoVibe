import { useEffect, useRef } from 'react';
import { createPhaserGame } from './phaser/main';

// Boot Phaser — BootScene handles all menu/navigation.
// React only provides the container. No auto-start of GAME_START.

function App() {
  const gameRef = useRef<ReturnType<typeof createPhaserGame> | null>(null);

  useEffect(() => {
    // Create Phaser once on mount — BootScene runs the menu
    if (!gameRef.current) {
      gameRef.current = createPhaserGame();
    }

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return (
    <div
      id="phaser-container"
      style={{ width: '100%', height: '100vh', background: '#0D1117' }}
    />
  );
}

export default App;
