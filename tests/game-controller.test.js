/**
 * tests/game-controller.test.js
 *
 * Property-based tests for GameController collision detection (AABB).
 *
 * The collision logic is extracted into the standalone pure function
 * `checkAABBCollision` (exported from tests/modules.js) so it can be tested
 * without instantiating the full GameController.
 *
 * Validates: Requirements 5.1, 5.2, 5.5
 */

import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { checkAABBCollision, calcDims, CONFIG } from './modules.js';

// ─── Fixed viewport / game constants used across all tests ───────────────────
const VIEWPORT_WIDTH  = 800;
const VIEWPORT_HEIGHT = 600;
const SCORE_BAR_H     = CONFIG.ui.scoreBarHeight;                      // 48 px
const PLAYABLE_H      = VIEWPORT_HEIGHT - SCORE_BAR_H;                // 552 px
const GHOSTY_SIZE     = VIEWPORT_HEIGHT * CONFIG.ghosty.sizeRatio;    // 42 px
const INSET           = CONFIG.ghosty.collisionInset;                  // 0.20
const PIPE_WIDTH      = VIEWPORT_WIDTH * CONFIG.pipes.widthRatio;     // 80 px
const GHOSTY_X        = VIEWPORT_WIDTH * CONFIG.ghosty.xRatio;        // 240 px
const GAP_MIN         = VIEWPORT_HEIGHT * CONFIG.pipes.gapMinRatio;   // 132 px
const GAP_BASE        = VIEWPORT_HEIGHT * CONFIG.pipes.gapBaseRatio;  // 228 px

// fast-check fc.float() requires 32-bit float bounds
const f32 = Math.fround;

// ─────────────────────────────────────────────────────────────────────────────
// Propiedad 8: Detección de colisión AABB
// Valida: Requisitos 5.1, 5.2, 5.5
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Reference implementation: mirrors GameController._checkCollision() exactly.
 * Used to cross-check the exported checkAABBCollision function.
 */
function referenceCollision(ghostyX, ghostyY, ghostySize, inset,
                             pipeX, pipeWidth, gapCenterY, gapSize,
                             viewportHeight, scoreBarHeight) {
  const half   = ghostySize / 2;
  const margin = ghostySize * inset;

  const gLeft   = ghostyX - half + margin;
  const gRight  = ghostyX + half - margin;
  const gTop    = ghostyY - half + margin;
  const gBottom = ghostyY + half - margin;

  if (gTop <= 0) return true;
  if (gBottom >= viewportHeight - scoreBarHeight) return true;

  const pLeft  = pipeX;
  const pRight = pipeX + pipeWidth;
  if (gRight <= pLeft || gLeft >= pRight) return false;

  const topPipeBottom = gapCenterY - gapSize / 2;
  const bottomPipeTop = gapCenterY + gapSize / 2;

  if (gTop < topPipeBottom) return true;
  if (gBottom > bottomPipeTop) return true;

  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// Test suite
// ─────────────────────────────────────────────────────────────────────────────

describe('GameController — Propiedad 8: Detección de colisión AABB', () => {

  // ── 1. checkAABBCollision matches the reference implementation for all inputs ──
  it('devuelve true si y solo si los bounding boxes reducidos se solapan (vs. referencia)', () => {
    /**
     * Validates: Requirements 5.1, 5.2, 5.5
     *
     * For any combination of Ghosty position, pipe position and gap, the
     * exported checkAABBCollision must agree with the reference implementation
     * that mirrors GameController._checkCollision() exactly.
     */
    fc.assert(
      fc.property(
        fc.record({
          ghostyY:    fc.float({ min: f32(-50),          max: f32(VIEWPORT_HEIGHT + 50), noNaN: true }),
          pipeX:      fc.float({ min: f32(-PIPE_WIDTH),  max: f32(VIEWPORT_WIDTH),       noNaN: true }),
          gapCenterY: fc.float({ min: f32(50),           max: f32(PLAYABLE_H - 50),      noNaN: true }),
          gapSize:    fc.float({ min: f32(GAP_MIN),      max: f32(GAP_BASE),             noNaN: true }),
        }),
        ({ ghostyY, pipeX, gapCenterY, gapSize }) => {
          const result    = checkAABBCollision(
            GHOSTY_X, ghostyY, GHOSTY_SIZE, INSET,
            pipeX, PIPE_WIDTH, gapCenterY, gapSize,
            VIEWPORT_HEIGHT, SCORE_BAR_H
          );
          const reference = referenceCollision(
            GHOSTY_X, ghostyY, GHOSTY_SIZE, INSET,
            pipeX, PIPE_WIDTH, gapCenterY, gapSize,
            VIEWPORT_HEIGHT, SCORE_BAR_H
          );
          return result === reference;
        }
      ),
      { numRuns: 200 }
    );
  });

  // ── 2. Pipe collision: Ghosty overlaps with top pipe ─────────────────────────
  it('devuelve true cuando Ghosty solapa con el tubo superior', () => {
    /**
     * Validates: Requirement 5.1
     *
     * Ghosty is positioned horizontally overlapping the pipe and vertically
     * above the gap (inside the top pipe rectangle).
     */
    const half   = GHOSTY_SIZE / 2;
    const margin = GHOSTY_SIZE * INSET;

    fc.assert(
      fc.property(
        // gapSize in [GAP_MIN, GAP_BASE], gapCenterY so gap fits in playable area
        fc.float({ min: f32(GAP_MIN), max: f32(GAP_BASE), noNaN: true }).chain(gapSize => {
          const minCenter = f32(gapSize / 2 + 1);
          const maxCenter = f32(PLAYABLE_H - gapSize / 2 - 1);
          return fc.record({
            gapSize:    fc.constant(gapSize),
            gapCenterY: fc.float({ min: minCenter, max: maxCenter, noNaN: true }),
          });
        }),
        ({ gapCenterY, gapSize }) => {
          const topPipeBottom = gapCenterY - gapSize / 2;
          // Place Ghosty so its reduced top edge is above topPipeBottom:
          //   gTop = ghostyY - half + margin < topPipeBottom
          //   → ghostyY < topPipeBottom + half - margin
          const ghostyY = topPipeBottom + half - margin - 1;

          // Skip if this would also trigger a top-border collision
          const gTop = ghostyY - half + margin;
          if (gTop <= 0) return true;

          // Pipe overlaps Ghosty horizontally
          const pipeX = GHOSTY_X - PIPE_WIDTH / 2;

          return checkAABBCollision(
            GHOSTY_X, ghostyY, GHOSTY_SIZE, INSET,
            pipeX, PIPE_WIDTH, gapCenterY, gapSize,
            VIEWPORT_HEIGHT, SCORE_BAR_H
          ) === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // ── 3. Pipe collision: Ghosty overlaps with bottom pipe ──────────────────────
  it('devuelve true cuando Ghosty solapa con el tubo inferior', () => {
    /**
     * Validates: Requirement 5.1
     *
     * Ghosty is positioned horizontally overlapping the pipe and vertically
     * below the gap (inside the bottom pipe rectangle).
     */
    const half   = GHOSTY_SIZE / 2;
    const margin = GHOSTY_SIZE * INSET;

    fc.assert(
      fc.property(
        fc.float({ min: f32(GAP_MIN), max: f32(GAP_BASE), noNaN: true }).chain(gapSize => {
          const minCenter = f32(gapSize / 2 + 1);
          const maxCenter = f32(PLAYABLE_H - gapSize / 2 - 1);
          return fc.record({
            gapSize:    fc.constant(gapSize),
            gapCenterY: fc.float({ min: minCenter, max: maxCenter, noNaN: true }),
          });
        }),
        ({ gapCenterY, gapSize }) => {
          const bottomPipeTop = gapCenterY + gapSize / 2;
          // Place Ghosty so its reduced bottom edge is below bottomPipeTop:
          //   gBottom = ghostyY + half - margin > bottomPipeTop
          //   → ghostyY > bottomPipeTop - half + margin
          const ghostyY = bottomPipeTop - half + margin + 1;

          // Skip if this would also trigger a bottom-border collision
          const gBottom = ghostyY + half - margin;
          if (gBottom >= PLAYABLE_H) return true;

          const pipeX = GHOSTY_X - PIPE_WIDTH / 2;

          return checkAABBCollision(
            GHOSTY_X, ghostyY, GHOSTY_SIZE, INSET,
            pipeX, PIPE_WIDTH, gapCenterY, gapSize,
            VIEWPORT_HEIGHT, SCORE_BAR_H
          ) === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // ── 4. No collision: Ghosty is safely inside the gap ─────────────────────────
  it('devuelve false cuando Ghosty está dentro del hueco y el tubo no solapa horizontalmente', () => {
    /**
     * Validates: Requirements 5.1, 5.5
     *
     * When Ghosty's reduced bounding box is entirely within the gap and the
     * pipe does not overlap horizontally, there must be no collision.
     */
    const half   = GHOSTY_SIZE / 2;
    const margin = GHOSTY_SIZE * INSET;

    fc.assert(
      fc.property(
        // Use a large gap so Ghosty always fits
        fc.float({ min: f32(GAP_MIN + 20), max: f32(GAP_BASE), noNaN: true }).chain(gapSize => {
          // gapCenterY must allow Ghosty to sit at the centre without touching borders
          const minCenter = f32(Math.max(gapSize / 2 + 1, half - margin + 1));
          const maxCenter = f32(Math.min(PLAYABLE_H - gapSize / 2 - 1, PLAYABLE_H - half + margin - 1));
          return fc.record({
            gapSize:    fc.constant(gapSize),
            gapCenterY: fc.float({ min: minCenter, max: maxCenter, noNaN: true }),
          });
        }),
        ({ gapCenterY, gapSize }) => {
          // Place Ghosty at the gap centre
          const ghostyY = gapCenterY;
          const gTop    = ghostyY - half + margin;
          const gBottom = ghostyY + half - margin;
          const topPipeBottom = gapCenterY - gapSize / 2;
          const bottomPipeTop = gapCenterY + gapSize / 2;

          // Skip if Ghosty doesn't actually fit in the gap or touches a border
          if (gTop <= 0 || gBottom >= PLAYABLE_H) return true;
          if (gTop < topPipeBottom || gBottom > bottomPipeTop) return true;

          // Place pipe to the right so there is no horizontal overlap
          const pipeX = GHOSTY_X + GHOSTY_SIZE + 10;

          return checkAABBCollision(
            GHOSTY_X, ghostyY, GHOSTY_SIZE, INSET,
            pipeX, PIPE_WIDTH, gapCenterY, gapSize,
            VIEWPORT_HEIGHT, SCORE_BAR_H
          ) === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  // ── 5. Border collision: Ghosty hits the top border ──────────────────────────
  it('devuelve true cuando Ghosty toca el borde superior (y = 0)', () => {
    /**
     * Validates: Requirement 5.2
     *
     * When Ghosty's reduced top edge is at or above y = 0, a collision must
     * be reported regardless of pipe position.
     */
    const half   = GHOSTY_SIZE / 2;
    const margin = GHOSTY_SIZE * INSET;
    // gTop = ghostyY - half + margin ≤ 0  →  ghostyY ≤ half - margin
    const maxGhostyY = half - margin;  // exactly at border

    fc.assert(
      fc.property(
        fc.record({
          // ghostyY in range where gTop ≤ 0
          ghostyY:    fc.float({ min: f32(-(half - margin) - 10), max: f32(maxGhostyY), noNaN: true }),
          // Pipe far to the right — no horizontal overlap
          pipeX:      fc.float({ min: f32(VIEWPORT_WIDTH + 10), max: f32(VIEWPORT_WIDTH * 2), noNaN: true }),
          gapCenterY: fc.float({ min: f32(100), max: f32(PLAYABLE_H - 100), noNaN: true }),
        }),
        ({ ghostyY, pipeX, gapCenterY }) => {
          const gTop = ghostyY - half + margin;
          if (gTop > 0) return true; // not actually touching border — skip

          const gapSize = GAP_BASE;
          return checkAABBCollision(
            GHOSTY_X, ghostyY, GHOSTY_SIZE, INSET,
            pipeX, PIPE_WIDTH, gapCenterY, gapSize,
            VIEWPORT_HEIGHT, SCORE_BAR_H
          ) === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // ── 6. Border collision: Ghosty hits the bottom border ───────────────────────
  it('devuelve true cuando Ghosty toca el borde inferior (y = viewportHeight - scoreBarHeight)', () => {
    /**
     * Validates: Requirement 5.2
     *
     * When Ghosty's reduced bottom edge is at or below the playable area
     * boundary, a collision must be reported regardless of pipe position.
     */
    const half   = GHOSTY_SIZE / 2;
    const margin = GHOSTY_SIZE * INSET;
    // gBottom = ghostyY + half - margin ≥ PLAYABLE_H  →  ghostyY ≥ PLAYABLE_H - half + margin
    const minGhostyY = PLAYABLE_H - half + margin;

    fc.assert(
      fc.property(
        fc.record({
          ghostyY:    fc.float({ min: f32(minGhostyY), max: f32(PLAYABLE_H + half + 10), noNaN: true }),
          // Pipe far to the right — no horizontal overlap
          pipeX:      fc.float({ min: f32(VIEWPORT_WIDTH + 10), max: f32(VIEWPORT_WIDTH * 2), noNaN: true }),
          gapCenterY: fc.float({ min: f32(100), max: f32(PLAYABLE_H - 100), noNaN: true }),
        }),
        ({ ghostyY, pipeX, gapCenterY }) => {
          const gBottom = ghostyY + half - margin;
          if (gBottom < PLAYABLE_H) return true; // not actually touching border — skip

          const gapSize = GAP_BASE;
          return checkAABBCollision(
            GHOSTY_X, ghostyY, GHOSTY_SIZE, INSET,
            pipeX, PIPE_WIDTH, gapCenterY, gapSize,
            VIEWPORT_HEIGHT, SCORE_BAR_H
          ) === true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Propiedad 12: Parámetros proporcionales al viewport
// Valida: Requisitos 9.2, 9.3, 9.4
// ─────────────────────────────────────────────────────────────────────────────

describe('GameController — Propiedad 12: Parámetros proporcionales al viewport', () => {
  it('para cualquier (W, H) > 0, calcDims(W, H) devuelve parámetros proporcionales a CONFIG.*Ratio', () => {
    /**
     * Validates: Requirements 9.2, 9.3, 9.4
     *
     * For any viewport dimensions (W, H), calcDims must return:
     * - canvas dimensions equal to W and H
     * - all derived parameters equal to CONFIG.*Ratio * W or CONFIG.*Ratio * H
     */
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 3840 }),  // W
        fc.integer({ min: 100, max: 2160 }),  // H
        (W, H) => {
          const dims = calcDims(W, H);
          // Verify canvas dimensions
          if (dims.width !== W || dims.height !== H) return false;
          // Verify all derived parameters
          const eps = 1e-9;
          return (
            Math.abs(dims.ghostyX     - W * CONFIG.ghosty.xRatio)            < eps &&
            Math.abs(dims.ghostySize  - H * CONFIG.ghosty.sizeRatio)         < eps &&
            Math.abs(dims.gravity     - H * CONFIG.physics.gravityRatio)     < eps &&
            Math.abs(dims.flapImpulse - H * CONFIG.physics.flapImpulseRatio) < eps &&
            Math.abs(dims.terminalVel - H * CONFIG.physics.terminalVelRatio) < eps &&
            Math.abs(dims.pipeWidth   - W * CONFIG.pipes.widthRatio)         < eps &&
            Math.abs(dims.pipeSpacing - W * CONFIG.pipes.spacingRatio)       < eps &&
            Math.abs(dims.pipeSpeed   - W * CONFIG.pipes.baseSpeedRatio)     < eps &&
            Math.abs(dims.gapBase     - H * CONFIG.pipes.gapBaseRatio)       < eps &&
            Math.abs(dims.gapMin      - H * CONFIG.pipes.gapMinRatio)        < eps
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
