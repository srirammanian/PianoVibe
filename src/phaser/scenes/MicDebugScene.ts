// ─── MicDebugScene ─────────────────────────────────────────────────────────
// Real-time microphone note detection visualiser.
// Activates the mic, listens for InputBridge events, and renders each detected
// note as a gem-style visual matching the game aesthetic.
//
// Route: BootScene → (click "Mic Debug Mode") → MicDebugScene
//                  → (ESC / Back button)       → BootScene

import Phaser from 'phaser';
import { initMic, destroyMic } from '../../input/MicInput';
import { inputBridge, setActiveSource } from '../../input/InputBridge';
import { GAME, NOTE } from '../../core/Constants';
import type { InputEvent } from '../../core/types';

// ─── Layout constants ─────────────────────────────────────────────────────────
const GEM_W = 110;
const GEM_H = 44;
const COLUMNS = 6;
const ROWS    = 3;
const PAD_X   = 130;
const PAD_Y   = 65;
const GRID_START_X = (GAME.WIDTH  - PAD_X * (COLUMNS - 1)) / 2;
const GRID_START_Y = 180;

// ─── Colour helpers ───────────────────────────────────────────────────────────
function clarityColor(clarity: number): number {
  if (clarity >= 0.9) return NOTE.RIGHT_HAND_COLOR;   // confident  → red gem
  if (clarity >= 0.8) return 0xF39C12;                // moderate   → amber
  return 0xE74C3C;                                     // uncertain  → deep red
}

export class MicDebugScene extends Phaser.Scene {
  // Map: midiNote → gem container
  private activeGems: Map<number, Phaser.GameObjects.Container> = new Map();

  private debugText!:     Phaser.GameObjects.Text;
  private micStatusText!: Phaser.GameObjects.Text;
  private gemsContainer!: Phaser.GameObjects.Container;

  // Bound handlers stored so we can unsubscribe them exactly
  private _onNoteOn!:  (e: InputEvent) => void;
  private _onNoteOff!: (e: InputEvent) => void;

  constructor() {
    super({ key: 'MicDebug' });
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────────

  async create(): Promise<void> {
    this._buildBackground();
    this._buildHeader();
    this._buildDebugPanel();
    this._buildBackButton();

    // Container that will hold all note gems
    this.gemsContainer = this.add.container(0, 0);

    // Bind handlers now so we can reference the same function for .off()
    this._onNoteOn  = this._handleNoteOn.bind(this);
    this._onNoteOff = this._handleNoteOff.bind(this);

    // Switch input source to mic BEFORE initMic so events are forwarded
    setActiveSource('mic');

    try {
      await initMic();
      this.micStatusText.setText('🎤 Mic: Active ✅').setColor('#2ECC71');
    } catch {
      this.micStatusText.setText('🎤 Mic: Denied ❌').setColor('#E74C3C');
      this._showMicDenied();
      return; // Don't register listeners — nothing to hear
    }

    inputBridge.on('noteOn',  this._onNoteOn);
    inputBridge.on('noteOff', this._onNoteOff);

    // ESC exits
    this.input.keyboard?.on('keydown-ESC', () => this._exit());
  }

  shutdown(): void {
    inputBridge.off('noteOn',  this._onNoteOn);
    inputBridge.off('noteOff', this._onNoteOff);
    destroyMic();
    setActiveSource('touch');
  }

  // ─── UI builders ────────────────────────────────────────────────────────────

  private _buildBackground(): void {
    this.add.rectangle(
      GAME.WIDTH  / 2,
      GAME.HEIGHT / 2,
      GAME.WIDTH,
      GAME.HEIGHT,
      GAME.BACKGROUND_COLOR,
    );

    // Subtle grid lines for visual depth
    const grid = this.add.graphics();
    grid.lineStyle(1, 0xffffff, 0.04);
    for (let x = 0; x < GAME.WIDTH; x += 80) {
      grid.lineBetween(x, 0, x, GAME.HEIGHT);
    }
    for (let y = 0; y < GAME.HEIGHT; y += 80) {
      grid.lineBetween(0, y, GAME.WIDTH, y);
    }
  }

  private _buildHeader(): void {
    this.add.text(GAME.WIDTH / 2, 34, '🎤  Mic Debug Mode', {
      fontSize: '32px',
      color: '#FFFFFF',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(GAME.WIDTH / 2, 78, 'Play a note on your piano — it will appear below', {
      fontSize: '17px',
      color: '#8B949E',
    }).setOrigin(0.5);

    // Colour legend
    const legendY = GAME.HEIGHT - 28;
    const items: [string, string][] = [
      ['■', `#${NOTE.RIGHT_HAND_COLOR.toString(16).padStart(6, '0')}`],
      ['■', '#F39C12'],
      ['■', '#E74C3C'],
    ];
    const labels = ['≥ 90 % clarity', '80–90 %', '< 80 %'];
    let lx = 60;
    items.forEach(([sym, color], i) => {
      this.add.text(lx, legendY, sym, { fontSize: '16px', color }).setOrigin(0, 0.5);
      lx += 22;
      this.add.text(lx, legendY, labels[i], { fontSize: '14px', color: '#8B949E' }).setOrigin(0, 0.5);
      lx += 130;
    });

    this.micStatusText = this.add.text(GAME.WIDTH - 20, 20, '🎤 Mic: Connecting…', {
      fontSize: '15px',
      color: '#F39C12',
    }).setOrigin(1, 0);
  }

  private _buildDebugPanel(): void {
    // Semi-transparent panel
    const panelW = 220;
    const panelH = 130;
    const panelX = 20;
    const panelY = GRID_START_Y + ROWS * (GEM_H + PAD_Y) + 20;

    const bg = this.add.graphics();
    bg.fillStyle(0x161B22, 0.85);
    bg.fillRoundedRect(panelX, panelY, panelW, panelH, 8);
    bg.lineStyle(1, 0x30363D);
    bg.strokeRoundedRect(panelX, panelY, panelW, panelH, 8);

    this.debugText = this.add.text(panelX + 12, panelY + 12, '— waiting for note —', {
      fontSize: '13px',
      color: '#2ECC71',
      fontFamily: 'monospace',
      lineSpacing: 4,
    });
  }

  private _buildBackButton(): void {
    const btn = this.add.text(GAME.WIDTH - 20, GAME.HEIGHT - 20, '← Back to Menu', {
      fontSize: '18px',
      color: '#3498DB',
      backgroundColor: '#1a1a2e',
      padding: { x: 14, y: 8 },
    }).setOrigin(1, 1).setInteractive({ useHandCursor: true });

    btn.on('pointerover',  () => btn.setColor('#5DADE2'));
    btn.on('pointerout',   () => btn.setColor('#3498DB'));
    btn.on('pointerdown',  () => this._exit());
  }

  private _showMicDenied(): void {
    this.add.text(
      GAME.WIDTH  / 2,
      GAME.HEIGHT / 2,
      '🚫  Mic access denied.\n\nAllow microphone access in your browser\nand reload the page.',
      {
        fontSize: '22px',
        color: '#E74C3C',
        align: 'center',
        lineSpacing: 6,
      },
    ).setOrigin(0.5);
  }

  // ─── Event handlers ──────────────────────────────────────────────────────────

  private _handleNoteOn(event: InputEvent): void {
    const { midiNote, pitch, confidence = 0, velocity, source } = event;

    // Update live debug panel
    this.debugText.setText(
      `Note    : ${pitch}\n` +
      `MIDI    : ${midiNote}\n` +
      `Clarity : ${(confidence * 100).toFixed(1)}%\n` +
      `Velocity: ${velocity}\n` +
      `Source  : ${source}`,
    );

    // Replace any existing gem for this MIDI note
    this._removeGem(midiNote, false /* no tween — instant replace */);

    const gem = this._createNoteGem(midiNote, pitch, confidence);
    this.gemsContainer.add(gem);
    this.activeGems.set(midiNote, gem);

    // Pop-in animation
    gem.setScale(0).setAlpha(0);
    this.tweens.add({
      targets: gem,
      scaleX: 1,
      scaleY: 1,
      alpha: 1,
      duration: 120,
      ease: 'Back.easeOut',
    });
  }

  private _handleNoteOff(event: InputEvent): void {
    this._removeGem(event.midiNote, true /* animate out */);
  }

  // ─── Gem lifecycle ────────────────────────────────────────────────────────────

  private _removeGem(midiNote: number, animate: boolean): void {
    const gem = this.activeGems.get(midiNote);
    if (!gem) return;

    this.tweens.killTweensOf(gem);
    this.activeGems.delete(midiNote);

    if (animate) {
      this.tweens.add({
        targets: gem,
        scaleX: 0,
        scaleY: 0,
        alpha: 0,
        y: gem.y + 24,
        duration: 180,
        ease: 'Cubic.easeIn',
        onComplete: () => gem.destroy(),
      });
    } else {
      gem.destroy();
    }
  }

  /**
   * Build a gem visual for the given note.
   * Layout: MIDI notes are placed in a COLUMNS × ROWS grid so multiple
   * simultaneous notes spread out cleanly.
   */
  private _createNoteGem(
    midiNote: number,
    pitch: string,
    clarity: number,
  ): Phaser.GameObjects.Container {
    const container = this.add.container(0, 0);
    const color = clarityColor(clarity);

    // Grid position — note A0 = MIDI 21; wrap across the grid
    const noteIndex = (midiNote - 21) % (COLUMNS * ROWS);
    const col = noteIndex % COLUMNS;
    const row = Math.floor(noteIndex / COLUMNS);
    const x   = GRID_START_X + col * PAD_X;
    const y   = GRID_START_Y + row * PAD_Y;
    container.setPosition(x, y);

    const gfx = this.add.graphics();

    // Outer glow
    gfx.fillStyle(color, 0.22);
    gfx.fillRoundedRect(-GEM_W / 2 - 6, -GEM_H / 2 - 6, GEM_W + 12, GEM_H + 12, NOTE.CORNER_RADIUS + 4);

    // Main body
    gfx.fillStyle(color, 1);
    gfx.fillRoundedRect(-GEM_W / 2, -GEM_H / 2, GEM_W, GEM_H, NOTE.CORNER_RADIUS);

    // Specular shine strip (top-left highlight)
    gfx.fillStyle(0xFFFFFF, 0.18);
    gfx.fillRoundedRect(-GEM_W / 2 + 10, -GEM_H / 2 + 5, GEM_W * 0.38, 7, 3);

    container.add(gfx);

    // Note label (e.g. "C#4")
    const label = this.add.text(0, 0, pitch, {
      fontSize: '19px',
      color: '#FFFFFF',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    container.add(label);

    // Clarity badge (small indicator below the note name)
    const badge = this.add.text(0, GEM_H / 2 + 10, `${(clarity * 100).toFixed(0)}%`, {
      fontSize: '11px',
      color: `#${color.toString(16).padStart(6, '0')}`,
      fontFamily: 'monospace',
    }).setOrigin(0.5, 0);
    container.add(badge);

    return container;
  }

  // ─── Navigation ─────────────────────────────────────────────────────────────

  private _exit(): void {
    // shutdown() will clean up mic + listeners automatically via Phaser lifecycle
    this.scene.start('Boot');
  }
}
