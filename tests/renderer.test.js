/**
 * tests/renderer.test.js
 *
 * Example-based tests for the Renderer class.
 * Validates: Requirements 7.9, 7.10, 9.5, 9.6
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Renderer } from './modules.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a mock canvas (800×600) and a fully-mocked 2D context.
 * jsdom does not implement canvas rendering, so all ctx methods are vi.fn().
 */
function createMockCanvas() {
  const canvas = { width: 800, height: 600 };

  const ctx = {
    fillStyle:    '',
    globalAlpha:  1,
    font:         '',
    textAlign:    '',
    textBaseline: '',
    fillRect:     vi.fn(),
    fillText:     vi.fn(),
    beginPath:    vi.fn(),
    roundRect:    vi.fn(),
    fill:         vi.fn(),
    drawImage:    vi.fn(),
    save:         vi.fn(),
    restore:      vi.fn(),
  };

  return { canvas, ctx };
}

// ─────────────────────────────────────────────────────────────────────────────
// drawIdleOverlay — Req 7.10, 9.5, 9.6
// ─────────────────────────────────────────────────────────────────────────────
describe('Renderer.drawIdleOverlay', () => {
  let renderer, ctx;

  beforeEach(() => {
    const { canvas, ctx: mockCtx } = createMockCanvas();
    ctx = mockCtx;
    renderer = new Renderer(canvas, ctx);
  });

  it('shows mobile touch text when isMobile is true (Req 9.5)', () => {
    renderer.drawIdleOverlay(true);

    const calls = ctx.fillText.mock.calls;
    const texts = calls.map(c => c[0]);
    expect(texts).toContain('Toca o Presiona Espacio para Empezar');
  });

  it('does NOT show desktop text when isMobile is true', () => {
    renderer.drawIdleOverlay(true);

    const texts = ctx.fillText.mock.calls.map(c => c[0]);
    expect(texts).not.toContain('Presiona Espacio o Haz Clic para Empezar');
  });

  it('shows desktop keyboard/mouse text when isMobile is false (Req 9.6)', () => {
    renderer.drawIdleOverlay(false);

    const texts = ctx.fillText.mock.calls.map(c => c[0]);
    expect(texts).toContain('Presiona Espacio o Haz Clic para Empezar');
  });

  it('does NOT show mobile text when isMobile is false', () => {
    renderer.drawIdleOverlay(false);

    const texts = ctx.fillText.mock.calls.map(c => c[0]);
    expect(texts).not.toContain('Toca o Presiona Espacio para Empezar');
  });

  it('draws a semi-transparent overlay rectangle before the text', () => {
    renderer.drawIdleOverlay(false);

    // fillRect should be called at least once for the overlay background
    expect(ctx.fillRect).toHaveBeenCalled();
    // fillText should be called after the overlay
    expect(ctx.fillText).toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// drawGameOverOverlay — Req 7.9
// ─────────────────────────────────────────────────────────────────────────────
describe('Renderer.drawGameOverOverlay', () => {
  it('renders "Game Over" text centered on the canvas', () => {
    const { canvas, ctx } = createMockCanvas();
    const renderer = new Renderer(canvas, ctx);

    renderer.drawGameOverOverlay();

    const texts = ctx.fillText.mock.calls.map(c => c[0]);
    expect(texts).toContain('Game Over');
  });

  it('draws the overlay background before the text', () => {
    const { canvas, ctx } = createMockCanvas();
    const renderer = new Renderer(canvas, ctx);

    renderer.drawGameOverOverlay();

    expect(ctx.fillRect).toHaveBeenCalled();
    expect(ctx.fillText).toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// drawGhosty — fallback behavior (Req 7.7, 9.5, 9.6)
// ─────────────────────────────────────────────────────────────────────────────
describe('Renderer.drawGhosty fallback', () => {
  it('does not throw when img is null', () => {
    const { canvas, ctx } = createMockCanvas();
    const renderer = new Renderer(canvas, ctx);

    expect(() => renderer.drawGhosty(100, 100, null, 40)).not.toThrow();
  });

  it('draws a fallback rectangle when img is null', () => {
    const { canvas, ctx } = createMockCanvas();
    const renderer = new Renderer(canvas, ctx);

    renderer.drawGhosty(100, 100, null, 40);

    // Should use fillRect as fallback instead of drawImage
    expect(ctx.fillRect).toHaveBeenCalled();
    expect(ctx.drawImage).not.toHaveBeenCalled();
  });

  it('does not throw when img.complete is false (image still loading)', () => {
    const { canvas, ctx } = createMockCanvas();
    const renderer = new Renderer(canvas, ctx);

    const incompleteImg = { complete: false, naturalWidth: 0 };

    expect(() => renderer.drawGhosty(100, 100, incompleteImg, 40)).not.toThrow();
  });

  it('draws a fallback rectangle when img.complete is false', () => {
    const { canvas, ctx } = createMockCanvas();
    const renderer = new Renderer(canvas, ctx);

    const incompleteImg = { complete: false, naturalWidth: 0 };
    renderer.drawGhosty(100, 100, incompleteImg, 40);

    expect(ctx.fillRect).toHaveBeenCalled();
    expect(ctx.drawImage).not.toHaveBeenCalled();
  });

  it('does not throw when img.naturalWidth is 0 (broken image)', () => {
    const { canvas, ctx } = createMockCanvas();
    const renderer = new Renderer(canvas, ctx);

    const brokenImg = { complete: true, naturalWidth: 0 };

    expect(() => renderer.drawGhosty(100, 100, brokenImg, 40)).not.toThrow();
  });

  it('calls drawImage when img is valid and complete', () => {
    const { canvas, ctx } = createMockCanvas();
    const renderer = new Renderer(canvas, ctx);

    const validImg = { complete: true, naturalWidth: 32 };
    renderer.drawGhosty(100, 100, validImg, 40);

    expect(ctx.drawImage).toHaveBeenCalledWith(validImg, 80, 80, 40, 40);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// drawScoreBar — Req 6.6, 7.8
// ─────────────────────────────────────────────────────────────────────────────
describe('Renderer.drawScoreBar', () => {
  it('renders text in "Score: N | High: H" format', () => {
    const { canvas, ctx } = createMockCanvas();
    const renderer = new Renderer(canvas, ctx);

    renderer.drawScoreBar(5, 12);

    const texts = ctx.fillText.mock.calls.map(c => c[0]);
    expect(texts).toContain('Score: 5 | High: 12');
  });

  it('renders text with score 0 and high 0', () => {
    const { canvas, ctx } = createMockCanvas();
    const renderer = new Renderer(canvas, ctx);

    renderer.drawScoreBar(0, 0);

    const texts = ctx.fillText.mock.calls.map(c => c[0]);
    expect(texts).toContain('Score: 0 | High: 0');
  });
});
