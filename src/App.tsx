import { useEffect, useRef, useState } from 'react';
import { createPhaserGame } from './phaser/main';
import { eventBus, Events } from './core/EventBus';
import type { GameStartData } from './core/types';

// Test song data — minimal fixture for development testing
const TEST_SONG: GameStartData = {
  songId: 'test-song',
  songData: [
    { id: 'n1', pitch: 'C4', midiNote: 60, time: 3.0, duration: 0.5, velocity: 0.8, hand: 'right' },
    { id: 'n2', pitch: 'E4', midiNote: 64, time: 3.5, duration: 0.5, velocity: 0.8, hand: 'right' },
    { id: 'n3', pitch: 'G4', midiNote: 67, time: 4.0, duration: 0.5, velocity: 0.8, hand: 'right' },
    { id: 'n4', pitch: 'C4', midiNote: 60, time: 4.5, duration: 1.0, velocity: 0.8, hand: 'left' },
    { id: 'n5', pitch: 'E4', midiNote: 64, time: 5.5, duration: 0.5, velocity: 0.8, hand: 'right' },
    { id: 'n6', pitch: 'G4', midiNote: 67, time: 6.0, duration: 0.5, velocity: 0.8, hand: 'left' },
    { id: 'n7', pitch: 'C5', midiNote: 72, time: 6.5, duration: 1.0, velocity: 0.8, hand: 'right' },
    { id: 'n8', pitch: 'D4', midiNote: 62, time: 7.5, duration: 0.5, velocity: 0.8, hand: 'right' },
  ],
  mode: 'performance',
  speed: 1.0,
  handMode: 'both',
  timingPreset: 'standard',
};

function App() {
  const gameRef = useRef<ReturnType<typeof createPhaserGame> | null>(null);
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  const startGame = () => {
    if (gameRef.current) return; // Already running
    gameRef.current = createPhaserGame();
    setGameStarted(true);

    // Start game after Phaser initializes
    setTimeout(() => {
      eventBus.emit(Events.GAME_START, TEST_SONG);
    }, 500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#0D1117', minHeight: '100vh', color: 'white' }}>
      <h1 style={{ fontSize: '48px', margin: '20px 0' }}>🎹 PianoVibe</h1>
      {!gameStarted && (
        <button
          onClick={startGame}
          style={{
            padding: '16px 48px',
            fontSize: '24px',
            background: '#E74C3C',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            marginBottom: '20px',
          }}
        >
          Start Game
        </button>
      )}
      <div
        id="phaser-container"
        style={{ width: '1280px', maxWidth: '100%', aspectRatio: '16/9' }}
      />
    </div>
  );
}

export default App;
