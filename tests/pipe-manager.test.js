/**
 * tests/pipe-manager.test.js
 *
 * Property-based tests for PipeManager using fast-check.
 */

import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { PipeManager, CONFIG } from './modules.js';

const VIEWPORT_WIDTH = 800;
const VIEWPORT_HEIGHT = 600;

// ─────────────────────────────────────────────────────────────────────────────
// Propiedad 5: Velocidad de tubos proporcional al puntaje
// Valida: Requisito 4.1
// ─────────────────────────────────────────────────────────────────────────────
describe('PipeManager — Propiedad 5: Velocidad de tubos proporcional al puntaje', () => {
  it('para cualquier N ≥ 0, la velocidad es exactamente pipeSpeed * (1 + N * speedIncrement)', () => {
    const manager = new PipeManager(VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
    const pipeSpeed = VIEWPORT_WIDTH * CONFIG.pipes.baseSpeedRatio;

    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000 }),
        (n) => {
          const expectedSpeed = pipeSpeed * (1 + n * CONFIG.pipes.speedIncrement);

          // Capture the speed used during update by observing pipe movement
          // Place a pipe at a known position and measure displacement
          manager.reset();
          const pipe = manager.getPipes()[0];
          // Position the pipe well within the viewport so it won't be recycled
          pipe.x = VIEWPORT_WIDTH / 2;
          const xBefore = pipe.x;

          const dt = 1; // 1 ms
          manager.update(dt, n);

          const actualDisplacement = xBefore - pipe.x;
          const expectedDisplacement = expectedSpeed * dt;

          return Math.abs(actualDisplacement - expectedDisplacement) < 1e-9;
        }
      ),
      { numRuns: 25 }
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Propiedad 6: Reciclaje de tubos fuera de pantalla
// Valida: Requisito 4.2
// ─────────────────────────────────────────────────────────────────────────────
describe('PipeManager — Propiedad 6: Reciclaje de tubos fuera de pantalla', () => {
  it('para cualquier par con x < -pipeWidth, después de update() ese par tiene x > viewportWidth', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),  // score
        fc.float({ min: 1, max: 50 }),     // deltaTime
        (score, dt) => {
          const manager = new PipeManager(VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
          const pipeWidth = VIEWPORT_WIDTH * CONFIG.pipes.widthRatio;

          // Force all pipes to be off-screen to the left
          manager.reset();
          const pipes = manager.getPipes();
          // Place the first pipe just off-screen to the left
          pipes[0].x = -pipeWidth - 1;
          // Place remaining pipes far to the right so they don't interfere
          for (let i = 1; i < pipes.length; i++) {
            pipes[i].x = VIEWPORT_WIDTH + i * VIEWPORT_WIDTH;
          }

          manager.update(dt, score);

          // The recycled pipe must now be to the right of the viewport
          return pipes[0].x > VIEWPORT_WIDTH;
        }
      ),
      { numRuns: 25 }
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Propiedad 7: Invariantes del hueco de tubos
// Valida: Requisitos 4.3, 4.4, 4.6
// ─────────────────────────────────────────────────────────────────────────────
describe('PipeManager — Propiedad 7: Invariantes del hueco de tubos', () => {
  it('tras múltiples ciclos de reciclaje, gapSize >= gapMin, hueco dentro del área jugable, espaciado >= spacing', () => {
    const gapMin = VIEWPORT_HEIGHT * CONFIG.pipes.gapMinRatio;
    const spacing = VIEWPORT_WIDTH * CONFIG.pipes.spacingRatio;
    const scoreBarHeight = CONFIG.ui.scoreBarHeight;
    const playableHeight = VIEWPORT_HEIGHT - scoreBarHeight;

    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }),   // number of update cycles
        fc.integer({ min: 0, max: 100 }),  // score
        (cycles, score) => {
          const manager = new PipeManager(VIEWPORT_WIDTH, VIEWPORT_HEIGHT);

          // Run many update cycles to trigger recycling
          for (let i = 0; i < cycles; i++) {
            // Use a large dt to force pipes off-screen quickly
            manager.update(200, score);
          }

          const pipes = manager.getPipes();

          for (const pipe of pipes) {
            // Invariant: gapSize >= gapMin
            if (pipe.gapSize < gapMin - 1e-9) {
              return false;
            }

            // Invariant: gap is completely within the playable area
            const gapTop = pipe.gapCenterY - pipe.gapSize / 2;
            const gapBottom = pipe.gapCenterY + pipe.gapSize / 2;
            if (gapTop < 0 || gapBottom > playableHeight) {
              return false;
            }
          }

          // Invariant: spacing between consecutive pipes >= spacingRatio * viewportWidth
          // Sort pipes by x position
          const sorted = [...pipes].sort((a, b) => a.x - b.x);
          for (let i = 1; i < sorted.length; i++) {
            const gap = sorted[i].x - sorted[i - 1].x;
            if (gap < spacing - 1e-9) {
              return false;
            }
          }

          return true;
        }
      ),
      { numRuns: 25 }
    );
  });
});
