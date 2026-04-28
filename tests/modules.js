/**
 * tests/modules.js
 *
 * Re-exports the game classes for use in the Node.js/jsdom test environment.
 * These implementations are identical to those in index.html but exported as
 * ES modules so Vitest can import them.
 */

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG — identical to the one in index.html
// ─────────────────────────────────────────────────────────────────────────────
export const CONFIG = {
  physics: {
    gravity:          900,
    jumpForce:        380,
    maxFallSpeed:     420,
    fallMultiplier:   1.6,
    lowJumpMultiplier: 1.2,
  },
  pipes: {
    count:             4,
    spacingRatio:      0.45,
    widthRatio:        0.10,
    baseSpeedRatio:    0.0003,
    speedIncrement:    0.02,
    gapBaseRatio:      0.38,
    gapMinRatio:       0.22,
    gapReductionRatio: 0.015,
    gapReductionProb:  0.30,
  },
  clouds: {
    count:             6,
    minOpacity:        0.3,
    maxOpacity:        0.8,
    minSpeedRatio:     0.00005,
    maxSpeedRatio:     0.00015,
    minWidthRatio:     0.08,
    maxWidthRatio:     0.18,
    heightRatio:       0.06,
    borderRadius:      12,
  },
  ghosty: {
    xRatio:            0.30,
    sizeRatio:         0.07,
    collisionInset:    0.20,
    bobAmplitude:      0.015,
    bobFrequency:      0.002,
  },
  colors: {
    sky:               '#87CEEB',
    pipeBody:          '#4CAF50',
    pipeBorder:        '#2E7D32',
    scoreBar:          '#1a1a2e',
    scoreText:         '#FFFFFF',
    overlayBg:         'rgba(0, 0, 0, 0.45)',
    overlayText:       '#FFFFFF',
    cloud:             'rgba(255, 255, 255, 1)',
  },
  ui: {
    scoreBarHeight:    48,
    fontFamily:        'monospace',
    scoreFontSize:     22,
    overlayFontSize:   0.06,
  },
  storage: {
    highScoreKey:      'flappyKiroHigh',
  },
  loop: {
    maxDeltaTime:      50,
    resizeDebounce:    100,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// ScoreManager
// ─────────────────────────────────────────────────────────────────────────────
export class ScoreManager {
  constructor() {
    this.score = 0;
    this.highScore = 0;
  }

  reset() {
    this.score = 0;
  }

  increment() {
    this.score += 1;
    if (this.score > this.highScore) {
      this.highScore = this.score;
    }
  }

  getScore() {
    return this.score;
  }

  getHighScore() {
    return this.highScore;
  }

  saveHighScore() {
    try {
      localStorage.setItem(CONFIG.storage.highScoreKey, String(this.highScore));
    } catch (e) {
      // localStorage unavailable — high score kept in memory only.
    }
  }

  loadHighScore() {
    try {
      const stored = localStorage.getItem(CONFIG.storage.highScoreKey);
      if (stored !== null) {
        const parsed = parseInt(stored, 10);
        if (Number.isInteger(parsed)) {
          this.highScore = parsed;
        }
      }
    } catch (e) {
      // localStorage unavailable — high score stays at 0.
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PhysicsEngine
// ─────────────────────────────────────────────────────────────────────────────
export class PhysicsEngine {
  constructor(viewportHeight) {
    this.viewportHeight = viewportHeight;
    const scale = viewportHeight / 600;
    this.gravity           = CONFIG.physics.gravity          * scale;
    this.jumpForce         = CONFIG.physics.jumpForce        * scale;
    this.maxFallSpeed      = CONFIG.physics.maxFallSpeed     * scale;
    this.fallMultiplier    = CONFIG.physics.fallMultiplier;
    this.lowJumpMultiplier = CONFIG.physics.lowJumpMultiplier;
    this.y        = 0;
    this.velocity = 0;
  }

  reset(startY) {
    this.y        = startY;
    this.velocity = 0;
  }

  applyFlap() {
    this.velocity = -this.jumpForce;
  }

  update(dt) {
    const dtSec = dt / 1000;
    let grav = this.gravity;
    if (this.velocity > 0) grav *= this.fallMultiplier;
    const prevVelocity = this.velocity;
    this.velocity += grav * dtSec;
    if (this.velocity > this.maxFallSpeed) this.velocity = this.maxFallSpeed;
    this.y += ((prevVelocity + this.velocity) / 2) * dtSec;
  }

  getY()        { return this.y; }
  getVelocity() { return this.velocity; }
}

// ─────────────────────────────────────────────────────────────────────────────
// PipeManager
// ─────────────────────────────────────────────────────────────────────────────
export class PipeManager {
  constructor(viewportWidth, viewportHeight) {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
    this.pipeWidth = viewportWidth * CONFIG.pipes.widthRatio;
    this.pipeSpeed = viewportWidth * CONFIG.pipes.baseSpeedRatio;
    this.gapBase = viewportHeight * CONFIG.pipes.gapBaseRatio;
    this.gapMin = viewportHeight * CONFIG.pipes.gapMinRatio;
    this.spacing = viewportWidth * CONFIG.pipes.spacingRatio;
    this.scoreBarHeight = CONFIG.ui.scoreBarHeight;
    this.pipes = [];
    this.reset();
  }

  reset() {
    this.pipes = [];
    const gapSize = this.gapBase;
    for (let i = 0; i < CONFIG.pipes.count; i++) {
      this.pipes.push({
        x: this.viewportWidth + i * this.spacing,
        gapCenterY: this._randomGapCenter(gapSize),
        gapSize: gapSize,
        scored: false,
      });
    }
  }

  _randomGapCenter(gapSize) {
    const minCenter = gapSize / 2;
    const maxCenter = this.viewportHeight - this.scoreBarHeight - gapSize / 2;
    return minCenter + Math.random() * (maxCenter - minCenter);
  }

  update(deltaTime, score) {
    const speed = this.pipeSpeed * (1 + score * CONFIG.pipes.speedIncrement);
    for (const pipe of this.pipes) {
      pipe.x -= speed * deltaTime;
      if (pipe.x + this.pipeWidth < 0) {
        // Recycle: move to the right of the rightmost pipe
        const maxX = Math.max(...this.pipes.map(p => p.x));
        pipe.x = maxX + this.spacing;
        pipe.scored = false;
        // Possibly reduce gap
        if (Math.random() < CONFIG.pipes.gapReductionProb) {
          pipe.gapSize = Math.max(
            pipe.gapSize - CONFIG.pipes.gapReductionRatio * this.viewportHeight,
            this.gapMin
          );
        }
        pipe.gapCenterY = this._randomGapCenter(pipe.gapSize);
      }
    }
  }

  getPipes() {
    return this.pipes;
  }

  checkScoring(ghostX) {
    let scored = false;
    for (const pipe of this.pipes) {
      if (!pipe.scored && ghostX > pipe.x + this.pipeWidth) {
        pipe.scored = true;
        scored = true;
      }
    }
    return scored;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CloudLayer
// ─────────────────────────────────────────────────────────────────────────────
export class CloudLayer {
  constructor(viewportWidth, viewportHeight) {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
    this.clouds = [];
    this.reset();
  }

  reset() {
    this.clouds = [];
    const cfg = CONFIG.clouds;
    const minSpeed = this.viewportWidth * cfg.minSpeedRatio;
    const maxSpeed = this.viewportWidth * cfg.maxSpeedRatio;
    const minWidth = this.viewportWidth * cfg.minWidthRatio;
    const maxWidth = this.viewportWidth * cfg.maxWidthRatio;
    const height   = this.viewportHeight * cfg.heightRatio;
    const opacityRange = cfg.maxOpacity - cfg.minOpacity;

    for (let i = 0; i < cfg.count; i++) {
      const opacity = cfg.minOpacity + Math.random() * opacityRange;
      const opacityFraction = (opacity - cfg.minOpacity) / opacityRange;
      const speed = minSpeed + opacityFraction * (maxSpeed - minSpeed);
      const width = minWidth + Math.random() * (maxWidth - minWidth);

      this.clouds.push({
        x:       Math.random() * this.viewportWidth,
        y:       Math.random() * (this.viewportHeight - height),
        width,
        height,
        opacity,
        speed,
      });
    }
  }

  update(deltaTime, isPlaying) {
    if (!isPlaying) return;

    const cfg = CONFIG.clouds;
    const height = this.viewportHeight * cfg.heightRatio;

    for (const cloud of this.clouds) {
      cloud.x -= cloud.speed * deltaTime;
      if (cloud.x + cloud.width < 0) {
        cloud.x = this.viewportWidth;
        cloud.y = Math.random() * (this.viewportHeight - height);
      }
    }
  }

  getClouds() {
    return this.clouds;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// InputHandler
// ─────────────────────────────────────────────────────────────────────────────
export class InputHandler {
  constructor(canvas, onFlap) {
    this.canvas = canvas;
    this.onFlap = onFlap;

    // Bound handler references so detach() can remove the exact same functions
    this._onKeyDown    = this._handleKeyDown.bind(this);
    this._onMouseDown  = this._handleMouseDown.bind(this);
    this._onTouchStart = this._handleTouchStart.bind(this);
  }

  attach() {
    // Space key on document (Req 2.1)
    document.addEventListener('keydown', this._onKeyDown);
    // Mouse click on canvas (Req 2.2)
    this.canvas.addEventListener('mousedown', this._onMouseDown);
    // Touch on canvas (Req 2.3, 9.5, 9.7)
    this.canvas.addEventListener('touchstart', this._onTouchStart);
  }

  detach() {
    document.removeEventListener('keydown', this._onKeyDown);
    this.canvas.removeEventListener('mousedown', this._onMouseDown);
    this.canvas.removeEventListener('touchstart', this._onTouchStart);
  }

  _handleKeyDown(e) {
    if (e.code === 'Space' || e.key === ' ') {
      this.onFlap();
    }
  }

  _handleMouseDown() {
    this.onFlap();
  }

  _handleTouchStart(e) {
    e.preventDefault(); // Prevent scroll on mobile (Req 9.7)
    this.onFlap();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// AudioManager
// ─────────────────────────────────────────────────────────────────────────────
export class AudioManager {
  constructor() {
    this.jumpSound = null;
    this.gameOverSound = null;
  }

  // Creates Audio objects for jump.wav and game_over.wav (Req 8.1)
  preload() {
    this.jumpSound = new Audio('assets/jump.wav');
    this.gameOverSound = new Audio('assets/game_over.wav');
  }

  // Plays jump sound from the beginning; silently ignores errors (Req 8.2)
  playJump() {
    if (!this.jumpSound) return;
    try {
      this.jumpSound.currentTime = 0;
      this.jumpSound.play().catch(() => {});
    } catch (e) {
      // Silently ignore audio errors
    }
  }

  // Plays game over sound from the beginning; silently ignores errors (Req 8.3)
  playGameOver() {
    if (!this.gameOverSound) return;
    try {
      this.gameOverSound.currentTime = 0;
      this.gameOverSound.play().catch(() => {});
    } catch (e) {
      // Silently ignore audio errors
    }
  }

  // Called on first user interaction to unlock browser autoplay policy (Req 8.4)
  unlock() {
    if (this.jumpSound) {
      this.jumpSound.play().then(() => {
        this.jumpSound.pause();
        this.jumpSound.currentTime = 0;
      }).catch(() => {});
    }
    if (this.gameOverSound) {
      this.gameOverSound.play().then(() => {
        this.gameOverSound.pause();
        this.gameOverSound.currentTime = 0;
      }).catch(() => {});
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// calcDims — Standalone pure function that mirrors GameController._calcDims().
//
// Given a viewport width and height, returns all derived game parameters
// exactly as GameController._calcDims() computes them.
//
// Parameters:
//   width  — viewport width in pixels
//   height — viewport height in pixels
//
// Returns an object with all viewport-derived dimensions.
// ─────────────────────────────────────────────────────────────────────────────
export function calcDims(width, height) {
  return {
    width,
    height,
    ghostyX:     width  * CONFIG.ghosty.xRatio,
    ghostySize:  height * CONFIG.ghosty.sizeRatio,
    gravity:     height * CONFIG.physics.gravityRatio,
    flapImpulse: height * CONFIG.physics.flapImpulseRatio,
    terminalVel: height * CONFIG.physics.terminalVelRatio,
    pipeWidth:   width  * CONFIG.pipes.widthRatio,
    pipeSpacing: width  * CONFIG.pipes.spacingRatio,
    pipeSpeed:   width  * CONFIG.pipes.baseSpeedRatio,
    gapBase:     height * CONFIG.pipes.gapBaseRatio,
    gapMin:      height * CONFIG.pipes.gapMinRatio,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// checkAABBCollision — Standalone pure function extracted from
// GameController._checkCollision() for property-based testing.
//
// Parameters:
//   ghostyX        — Ghosty's fixed horizontal centre (px)
//   ghostyY        — Ghosty's current vertical centre (px)
//   ghostySize     — Ghosty's width/height (px)
//   inset          — Collision inset fraction (e.g. 0.20 → 20% per side)
//   pipeX          — Left edge of the pipe pair (px)
//   pipeWidth      — Width of the pipe (px)
//   gapCenterY     — Vertical centre of the gap (px)
//   gapSize        — Height of the gap (px)
//   viewportHeight — Total canvas height (px)
//   scoreBarHeight — Height of the score bar at the bottom (px)
//
// Returns true if and only if the reduced Ghosty bounding box overlaps a pipe
// rectangle or a viewport border.
// ─────────────────────────────────────────────────────────────────────────────
export function checkAABBCollision(
  ghostyX, ghostyY, ghostySize, inset,
  pipeX, pipeWidth, gapCenterY, gapSize,
  viewportHeight, scoreBarHeight
) {
  const halfSize = ghostySize / 2;
  const margin   = ghostySize * inset;

  // Reduced Ghosty bounding box
  const gLeft   = ghostyX - halfSize + margin;
  const gRight  = ghostyX + halfSize - margin;
  const gTop    = ghostyY - halfSize + margin;
  const gBottom = ghostyY + halfSize - margin;

  // Border collisions
  if (gTop <= 0) return true;
  if (gBottom >= viewportHeight - scoreBarHeight) return true;

  // Pipe collision
  const pLeft  = pipeX;
  const pRight = pipeX + pipeWidth;

  // No horizontal overlap → no collision
  if (gRight <= pLeft || gLeft >= pRight) return false;

  const topPipeBottom = gapCenterY - gapSize / 2;
  const bottomPipeTop = gapCenterY + gapSize / 2;

  if (gTop < topPipeBottom) return true;
  if (gBottom > bottomPipeTop) return true;

  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// Renderer
// ─────────────────────────────────────────────────────────────────────────────
export class Renderer {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
  }

  // Fills the canvas with the sky color (Req 7.1)
  drawBackground() {
    this.ctx.fillStyle = CONFIG.colors.sky;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  // Draws each cloud as a semi-transparent rounded rectangle (Req 7.2, 7.3)
  drawClouds(clouds) {
    const ctx = this.ctx;
    const r = CONFIG.clouds.borderRadius;
    for (const cloud of clouds) {
      ctx.save();
      ctx.globalAlpha = cloud.opacity;
      ctx.fillStyle = CONFIG.colors.cloud;
      ctx.beginPath();
      ctx.roundRect(cloud.x, cloud.y, cloud.width, cloud.height, r);
      ctx.fill();
      ctx.restore();
    }
  }

  // Draws top and bottom pipe rectangles for each pipe pair (Req 4.5, 7.2)
  drawPipes(pipes, pipeWidth) {
    const ctx = this.ctx;
    ctx.fillStyle = CONFIG.colors.pipeBody;
    for (const pipe of pipes) {
      const topHeight = pipe.gapCenterY - pipe.gapSize / 2;
      const bottomY   = pipe.gapCenterY + pipe.gapSize / 2;
      const bottomHeight = this.canvas.height - bottomY;
      // Top pipe
      ctx.fillRect(pipe.x, 0, pipeWidth, topHeight);
      // Bottom pipe
      ctx.fillRect(pipe.x, bottomY, pipeWidth, bottomHeight);
    }
  }

  // Draws Ghosty sprite; falls back to a colored rectangle if img is unavailable (Req 7.7)
  drawGhosty(x, y, img, size) {
    const ctx = this.ctx;
    try {
      if (img && img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
      } else {
        // Fallback: draw a colored rectangle
        ctx.fillStyle = CONFIG.colors.overlayText;
        ctx.fillRect(x - size / 2, y - size / 2, size, size);
      }
    } catch (e) {
      // Fallback on any draw error
      ctx.fillStyle = CONFIG.colors.overlayText;
      ctx.fillRect(x - size / 2, y - size / 2, size, size);
    }
  }

  // Draws the score bar at the bottom of the canvas (Req 7.8, 6.6)
  drawScoreBar(score, high) {
    const ctx = this.ctx;
    const barHeight = CONFIG.ui.scoreBarHeight;
    const y = this.canvas.height - barHeight;

    // Dark background bar
    ctx.fillStyle = CONFIG.colors.scoreBar;
    ctx.fillRect(0, y, this.canvas.width, barHeight);

    // Score text
    ctx.fillStyle = CONFIG.colors.scoreText;
    ctx.font = `${CONFIG.ui.scoreFontSize}px ${CONFIG.ui.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Score: ${score} | High: ${high}`, this.canvas.width / 2, y + barHeight / 2);
  }

  // Draws the idle overlay with platform-appropriate start message (Req 7.10, 9.5, 9.6)
  drawIdleOverlay(isMobile) {
    const ctx = this.ctx;
    const fontSize = Math.round(this.canvas.height * CONFIG.ui.overlayFontSize);
    const message = isMobile
      ? 'Toca o Presiona Espacio para Empezar'
      : 'Presiona Espacio o Haz Clic para Empezar';

    // Semi-transparent overlay
    ctx.fillStyle = CONFIG.colors.overlayBg;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Centered text
    ctx.fillStyle = CONFIG.colors.overlayText;
    ctx.font = `${fontSize}px ${CONFIG.ui.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(message, this.canvas.width / 2, this.canvas.height / 2);
  }

  // Draws the game over overlay with centered "Game Over" message (Req 7.9)
  drawGameOverOverlay() {
    const ctx = this.ctx;
    const fontSize = Math.round(this.canvas.height * CONFIG.ui.overlayFontSize);

    // Semi-transparent overlay
    ctx.fillStyle = CONFIG.colors.overlayBg;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Centered "Game Over" text
    ctx.fillStyle = CONFIG.colors.overlayText;
    ctx.font = `${fontSize}px ${CONFIG.ui.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Game Over', this.canvas.width / 2, this.canvas.height / 2);
  }
}
