import Phaser from 'phaser';
import { initMic, destroyMic } from '../../input/MicInput';
import { inputBridge, setActiveSource } from '../../input/InputBridge';
import { GAME } from '../../core/Constants';

// ─── Tuning ───────────────────────────────────────────────────────────────
const SONG_DURATION_SEC = 16;   // Test song length — will be configurable later
const NOTE_START_DELAY_MS = 1500; // Countdown before detection starts

// ─── Types ─────────────────────────────────────────────────────────────
interface DetectedNote {
  pitch: string;
  midiNote: number;
  velocity: number;
  clarity: number;
  gameTimeSec: number; // seconds since detection started
}

// ─── MicDebugSongScene ────────────────────────────────────────────────
export class MicDebugSongScene extends Phaser.Scene {
  // State
  private detectedNotes: DetectedNote[] = [];
  private songStartWallTime = 0;
  private songEnded = false;
  private listeningForNotes = false;
  private gameClockSec = 0;

  // UI
  private statusText: Phaser.GameObjects.Text | null = null;
  private progressBarFill: Phaser.GameObjects.Rectangle | null = null;
  private progressTimeText: Phaser.GameObjects.Text | null = null;
  private noteCountText: Phaser.GameObjects.Text | null = null;
  private micStatusText: Phaser.GameObjects.Text | null = null;

  // Scrolling gems
  private gemQueue: Phaser.GameObjects.Container[] = [];
  private gemsContainer: Phaser.GameObjects.Container | null = null;
  private nextGemX = 60;
  private readonly GEM_WIDTH = 90;
  private readonly GEM_SPACING = 18;
  private readonly GEM_START_Y = 200;
  private readonly GEM_ROW_HEIGHT = 55;
  private readonly GEMS_PER_ROW = 8;

  // Note event handlers (for cleanup)
  private handleNoteOn: ((e: unknown) => void) | null = null;
  private handleNoteOff: ((e: unknown) => void) | null = null;

  constructor() {
    super({ key: 'MicDebugSong' });
  }

  // ─── Lifecycle ────────────────────────────────────────────────────────
  async create(): Promise<void> {
    this.detectedNotes = [];
    this.songEnded = false;
    this.listeningForNotes = false;
    this.gameClockSec = 0;
    this.nextGemX = 60;
    this.gemQueue = [];

    this.drawBackground();
    this.drawHeader();
    this.drawProgressBar();
    this.drawGemArea();
    this.drawFooter();

    // Mic status
    this.micStatusText = this.add.text(20, 60, 'Mic: Connecting...', {
      fontSize: '14px',
      color: '#F39C12',
      fontFamily: 'monospace',
    });

    // Back button (top right, above status)
    const backBtn = this.add.text(GAME.WIDTH - 20, 20, '← Back', {
      fontSize: '18px',
      color: '#3498DB',
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => this.returnToBoot());

    // Activate mic
    setActiveSource('mic');
    try {
      await initMic();
      this.micStatusText.setText('Mic: Active ✅').setColor('#2ECC71');
    } catch {
      this.micStatusText.setText('Mic: Denied — try again').setColor('#E74C3C');
      this.statusText?.setText('Mic access denied. Go back and try again.').setColor('#E74C3C');
      return;
    }

    // Wire note listeners
    this.handleNoteOn = (e: unknown) => this.onNoteOn(e as Parameters<typeof this.onNoteOn>[0]);
    this.handleNoteOff = () => {}; // no-op for now
    inputBridge.on('noteOn', this.handleNoteOn);
    inputBridge.on('noteOff', this.handleNoteOff);

    // Start countdown then begin detection
    this.songStartWallTime = performance.now() + NOTE_START_DELAY_MS;
    this.statusText?.setText('Get ready...');

    this.time.delayedCall(NOTE_START_DELAY_MS, () => {
      this.listeningForNotes = true;
      this.statusText?.setText('🎹 Play now — detected notes scroll below').setColor('#ffffff');
    });

    // Game loop tick
    this.time.addEvent({
      delay: 50,
      callback: this.tick,
      callbackScope: this,
      loop: true,
    });

    // ESC to exit early
    this.input.keyboard?.on('keydown-ESC', () => this.returnToBoot());
  }

  // ─── UI Drawing ────────────────────────────────────────────────────
  private drawBackground(): void {
    this.add.rectangle(GAME.WIDTH / 2, GAME.HEIGHT / 2, GAME.WIDTH, GAME.HEIGHT, GAME.BACKGROUND_COLOR);
  }

  private drawHeader(): void {
    this.add.text(GAME.WIDTH / 2, 20, '🎤 Mic Debug — Song Mode', {
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0);

    this.add.text(GAME.WIDTH / 2, 55, 'Play the song on your piano — detected notes scroll below', {
      fontSize: '16px',
      color: '#8B949E',
    }).setOrigin(0.5, 0);

    this.statusText = this.add.text(GAME.WIDTH / 2, 90, 'Starting mic...', {
      fontSize: '20px',
      color: '#F39C12',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0);
  }

  private drawProgressBar(): void {
    const barY = 130;
    const barX = 40;
    const barW = GAME.WIDTH - 80;
    const barH = 8;

    this.add.rectangle(barX + barW / 2, barY, barW, barH, 0x21262D).setOrigin(0, 0.5);
    this.progressBarFill = this.add.rectangle(barX, barY, 0, barH, 0x3498DB).setOrigin(0, 0.5);

    this.progressTimeText = this.add.text(barX, barY + 14, `0:00 / ${this.formatTime(SONG_DURATION_SEC)}`, {
      fontSize: '12px',
      color: '#8B949E',
    });
  }

  private drawGemArea(): void {
    this.add.text(40, 155, 'DETECTED NOTES:', {
      fontSize: '12px',
      color: '#8B949E',
    });

    this.gemsContainer = this.add.container(0, 0);

    // Border around gem area
    const border = this.add.rectangle(
      GAME.WIDTH / 2, this.GEM_START_Y + 20,
      GAME.WIDTH - 60, 130,
      0x161B22, 0.3
    ).setOrigin(0.5, 0.5);
    border.setStrokeStyle(1, 0x21262D);

    this.add.text(40, this.GEM_START_Y + 52, 'No notes yet — start playing!', {
      fontSize: '14px',
      color: '#4a5568',
      fontStyle: 'italic',
    }).setName('placeholder');
  }

  private drawFooter(): void {
    this.noteCountText = this.add.text(40, 290, 'Notes detected: 0', {
      fontSize: '14px',
      color: '#8B949E',
    });
  }

  // ─── Tick ─────────────────────────────────────────────────────────
  private tick(): void {
    if (!this.listeningForNotes) return;

    const elapsed = (performance.now() - this.songStartWallTime) / 1000;
    this.gameClockSec = Math.max(0, elapsed);

    // Update progress bar
    const progress = Math.min(1, this.gameClockSec / SONG_DURATION_SEC);
    const barW = GAME.WIDTH - 80;
    this.progressBarFill?.setDisplaySize(barW * progress, 8);

    const currentSec = Math.floor(this.gameClockSec);
    const totalSec = Math.floor(SONG_DURATION_SEC);
    const ms = Math.floor((this.gameClockSec % 1) * 100);
    this.progressTimeText?.setText(
      `${currentSec}:${String(ms).padStart(2, '0')} / ${totalSec}:00`
    );

    this.noteCountText?.setText(`Notes detected: ${this.detectedNotes.length}`);

    // End song
    if (this.gameClockSec >= SONG_DURATION_SEC && !this.songEnded) {
      this.songEnded = true;
      this.statusText?.setText('Song complete! Showing results...').setColor('#F39C12');
      this.time.delayedCall(1000, () => this.showResults());
    }
  }

  // ─── Note Detection ────────────────────────────────────────────────
  private onNoteOn(event: {
    pitch: string;
    midiNote: number;
    velocity: number;
    source: string;
    confidence?: number;
  }): void {
    if (!this.listeningForNotes || this.songEnded) return;
    if (event.source !== 'mic') return;

    const detected: DetectedNote = {
      pitch: event.pitch,
      midiNote: event.midiNote,
      velocity: event.velocity,
      clarity: event.confidence ?? 0,
      gameTimeSec: this.gameClockSec,
    };

    this.detectedNotes.push(detected);
    this.spawnGem(detected);
  }

  // ─── Scrolling Gems ────────────────────────────────────────────────
  private spawnGem(note: DetectedNote): void {
    if (!this.gemsContainer) return;

    // Remove placeholder text on first note
    const placeholder = this.gemsContainer.getByName('placeholder') as Phaser.GameObjects.Text;
    if (placeholder) placeholder.setVisible(false);

    const { x, y } = this.getGemPosition(this.gemQueue.length);
    const container = this.createGem(note.pitch, note.clarity);
    container.setPosition(x, y);
    container.setAlpha(0);
    this.gemsContainer.add(container);

    // Animate in
    this.tweens.add({
      targets: container,
      alpha: 1,
      duration: 120,
      ease: 'Quad.easeOut',
    });

    this.scrollRow();
    this.gemQueue.push(container);
    this.nextGemX += this.GEM_WIDTH + this.GEM_SPACING;
  }

  private getGemPosition(index: number): { x: number; y: number } {
    const col = index % this.GEMS_PER_ROW;
    const row = Math.floor(index / this.GEMS_PER_ROW);
    const x = 60 + col * (this.GEM_WIDTH + this.GEM_SPACING);
    const y = this.GEM_START_Y + row * this.GEM_ROW_HEIGHT;
    return { x, y };
  }

  private scrollRow(): void {
    if (!this.gemsContainer) return;
    const lastGem = this.gemQueue[this.gemQueue.length - 1];
    if (!lastGem || lastGem.x < GAME.WIDTH - 100) return;

    // Shift all gems left by one slot
    for (const gem of this.gemQueue) {
      gem.x -= this.GEM_WIDTH + this.GEM_SPACING;
    }
    this.nextGemX -= this.GEM_WIDTH + this.GEM_SPACING;
  }

  private createGem(pitch: string, clarity: number): Phaser.GameObjects.Container {
    const g = this.add.container(0, 0);
    const w = this.GEM_WIDTH;
    const h = 40;

    const color = clarity >= 0.9 ? 0x2ECC71 : clarity >= 0.8 ? 0xF39C12 : 0xE74C3C;

    // Glow
    const glow = this.add.graphics();
    glow.fillStyle(color, 0.2);
    glow.fillRoundedRect(-w / 2 - 4, -h / 2 - 4, w + 8, h + 8, 8);
    g.add(glow);

    // Body
    const body = this.add.graphics();
    body.fillStyle(color, 1);
    body.fillRoundedRect(-w / 2, -h / 2, w, h, 6);
    g.add(body);

    // Shine
    const shine = this.add.graphics();
    shine.fillStyle(0xffffff, 0.15);
    shine.fillRoundedRect(-w / 2 + 8, -h / 2 + 4, w * 0.35, 6, 3);
    g.add(shine);

    // Text
    const text = this.add.text(0, 0, pitch, {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    g.add(text);

    return g;
  }

  // ─── Results Screen ────────────────────────────────────────────────
  private showResults(): void {
    if (!this.gemsContainer) return;
    this.gemsContainer.setVisible(false);

    // Clear non-essential UI
    this.noteCountText?.setVisible(false);

    const totalNotes = this.detectedNotes.length;

    // Header
    this.add.text(GAME.WIDTH / 2, 170, `🎹 ${totalNotes} notes detected`, {
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0);

    this.add.text(GAME.WIDTH / 2, 208, 'Here\'s the full detected sequence — verify it against the sheet music:', {
      fontSize: '16px',
      color: '#8B949E',
    }).setOrigin(0.5, 0);

    // Column headers
    const headerY = 238;
    this.add.text(60, headerY, '#', { fontSize: '12px', color: '#6e7681' });
    this.add.text(100, headerY, 'Time', { fontSize: '12px', color: '#6e7681' });
    this.add.text(240, headerY, 'Note', { fontSize: '12px', color: '#6e7681' });
    this.add.text(400, headerY, 'Clarity', { fontSize: '12px', color: '#6e7681' });
    this.add.text(540, headerY, 'Velocity', { fontSize: '12px', color: '#6e7681' });

    // Separator
    this.add.rectangle(GAME.WIDTH / 2, headerY + 14, GAME.WIDTH - 80, 1, 0x30363D).setOrigin(0.5, 0);

    // Note rows — max 18 visible
    const maxRows = 18;
    const rows = this.detectedNotes.slice(0, maxRows);
    const rowH = 26;
    let y = headerY + 24;

    for (let i = 0; i < rows.length; i++) {
      const note = rows[i];
      const isAlt = i % 2 === 0;
      const rowColor = isAlt ? 0x0d1117 : 0x161b22;

      this.add.rectangle(GAME.WIDTH / 2, y + rowH / 2, GAME.WIDTH - 80, rowH, rowColor, 0.4).setOrigin(0.5, 0);

      this.add.text(60, y + 5, String(i + 1), { fontSize: '13px', color: '#6e7681' });
      this.add.text(100, y + 5, this.formatTime(note.gameTimeSec), { fontSize: '13px', color: '#c9d1d9' });
      this.add.text(240, y + 5, note.pitch, { fontSize: '14px', color: '#ffffff', fontStyle: 'bold' });

      const clarityColor = note.clarity >= 0.9 ? '#2ECC71' : note.clarity >= 0.8 ? '#F39C12' : '#E74C3C';
      this.add.text(400, y + 5, `${(note.clarity * 100).toFixed(0)}%`, { fontSize: '13px', color: clarityColor });

      this.add.text(540, y + 5, String(note.velocity), { fontSize: '13px', color: '#8B949E' });

      y += rowH;
    }

    if (this.detectedNotes.length > maxRows) {
      this.add.text(GAME.WIDTH / 2, y + 8, `...and ${this.detectedNotes.length - maxRows} more notes`, {
        fontSize: '13px',
        color: '#6e7681',
        fontStyle: 'italic',
      }).setOrigin(0.5, 0);
      y += 28;
    }

    // Separator
    this.add.rectangle(GAME.WIDTH / 2, y + 8, GAME.WIDTH - 80, 1, 0x30363D).setOrigin(0.5, 0);

    // Buttons
    const btnY = y + 40;

    const playAgainBtn = this.add.text(GAME.WIDTH / 2, btnY, '[ Play Again ]', {
      fontSize: '22px',
      color: '#3498DB',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    playAgainBtn.on('pointerdown', () => this.scene.restart());

    const menuBtn = this.add.text(GAME.WIDTH / 2, btnY + 40, '[ Back to Menu ]', {
      fontSize: '22px',
      color: '#8B949E',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    menuBtn.on('pointerdown', () => this.returnToBoot());
  }

  private formatTime(sec: number): string {
    const s = Math.floor(sec);
    const ms = Math.floor((sec % 1) * 100);
    return `${String(s).padStart(2, '0')}.${String(ms).padStart(2, '0')}s`;
  }

  // ─── Cleanup ─────────────────────────────────────────────────────
  private returnToBoot(): void {
    this.cleanup();
    this.scene.start('Boot');
  }

  private cleanup(): void {
    this.listeningForNotes = false;
    if (this.handleNoteOn) inputBridge.off('noteOn', this.handleNoteOn);
    if (this.handleNoteOff) inputBridge.off('noteOff', this.handleNoteOff);
    this.handleNoteOn = null;
    this.handleNoteOff = null;
    destroyMic();
    setActiveSource('touch');
  }

  shutdown(): void {
    this.cleanup();
  }
}
