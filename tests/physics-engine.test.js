/**
 * tests/physics-engine.test.js
 *
 * Property-based tests for PhysicsEngine using fast-check.
 */

import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { PhysicsEngine, CONFIG } from './modules.js';

const VIEWPORT_HEIGHT = 600; // representative fixed viewport height for tests

// ─────────────────────────────────────────────────────────────────────────────
// Propiedad 2: El aleteo es acumulativo y respeta el tope máximo
// Valida: Requisitos 2.5, 3.2 — Geometry Dash style accumulative flap
// ─────────────────────────────────────────────────────────────────────────────
describe('PhysicsEngine — Propiedad 2: El aleteo es acumulativo y respeta el tope máximo', () => {
  it('applyFlap() reduce velocity por flapImpulse (acumulativo) y nunca supera -flapMaxUp', () => {
    const flapImpulse = CONFIG.physics.flapImpulseRatio * VIEWPORT_HEIGHT;
    const flapMaxUp   = CONFIG.physics.flapMaxUpRatio   * VIEWPORT_HEIGHT;

    fc.assert(
      fc.property(
        fc.float({ noNaN: true, noDefaultInfinity: true, min: -flapMaxUp, max: flapMaxUp }),
        (initialVelocity) => {
          const engine = new PhysicsEngine(VIEWPORT_HEIGHT);
          engine.reset(VIEWPORT_HEIGHT / 2);
          engine.velocity = initialVelocity;

          engine.applyFlap();

          const v = engine.getVelocity();
          // Must not exceed upward cap
          const capOk = v >= -flapMaxUp;
          // Must be <= initial velocity (flap always adds upward impulse or stays at cap)
          const impulseOk = v <= initialVelocity + 1e-9;
          // If not already at cap, must equal initialVelocity - flapImpulse
          const expectedUncapped = initialVelocity - flapImpulse;
          const valueOk = expectedUncapped >= -flapMaxUp
            ? Math.abs(v - expectedUncapped) < 1e-9
            : Math.abs(v - (-flapMaxUp)) < 1e-9;

          return capOk && impulseOk && valueOk;
        }
      ),
      { numRuns: 25 }
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Propiedad 3: Integración física correcta
// Valida: Requisitos 3.1, 3.3
// ─────────────────────────────────────────────────────────────────────────────
describe('PhysicsEngine — Propiedad 3: Integración física correcta', () => {
  it('update(dt) aplica nueva velocidad = min(v + gravity*dt, terminalVel) y nueva posición = y + v*dt', () => {
    const engine = new PhysicsEngine(VIEWPORT_HEIGHT);
    const gravity = VIEWPORT_HEIGHT * CONFIG.physics.gravityRatio;
    const terminalVel = VIEWPORT_HEIGHT * CONFIG.physics.terminalVelRatio;

    fc.assert(
      fc.property(
        fc.float({ noNaN: true, noDefaultInfinity: true, min: -1e6, max: 1e6 }),  // y
        fc.float({ noNaN: true, noDefaultInfinity: true, min: Math.fround(-terminalVel), max: Math.fround(terminalVel - 0.001) }), // v < terminalVel
        fc.float({ noNaN: true, noDefaultInfinity: true, min: 1, max: 50 }),  // dt > 0
        (y, v, dt) => {
          engine.reset(y);
          engine.velocity = v;

          const expectedNewVelocity = Math.min(v + gravity * dt, terminalVel);
          const expectedNewY = y + v * dt;

          engine.update(dt);

          const velOk = Math.abs(engine.getVelocity() - expectedNewVelocity) < 1e-9;
          const posOk = Math.abs(engine.getY() - expectedNewY) < 1e-9;

          return velOk && posOk;
        }
      ),
      { numRuns: 25 }
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Propiedad 4: Velocidad terminal máxima descendente
// Valida: Requisito 3.4
// ─────────────────────────────────────────────────────────────────────────────
describe('PhysicsEngine — Propiedad 4: Velocidad terminal máxima descendente', () => {
  it('para cualquier secuencia de update(dt) sin applyFlap(), getVelocity() nunca supera terminalVel', () => {
    const terminalVel = VIEWPORT_HEIGHT * CONFIG.physics.terminalVelRatio;

    fc.assert(
      fc.property(
        fc.array(fc.float({ min: 1, max: 50 }), { minLength: 1, maxLength: 100 }),
        (dtArray) => {
          const engine = new PhysicsEngine(VIEWPORT_HEIGHT);
          engine.reset(VIEWPORT_HEIGHT / 2);

          for (const dt of dtArray) {
            engine.update(dt);
            if (engine.getVelocity() > terminalVel) {
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
