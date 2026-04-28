// @vitest-environment jsdom
/**
 * tests/input-handler.test.js
 *
 * Unit tests for InputHandler.
 * Verifies that Space keydown, mousedown, and touchstart fire onFlap,
 * and that detach() removes all listeners correctly.
 *
 * Requirements: 2.1, 2.2, 2.3
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { InputHandler } from './modules.js';

describe('InputHandler', () => {
  let canvas;
  let onFlap;
  let handler;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    onFlap = vi.fn();
    handler = new InputHandler(canvas, onFlap);
    handler.attach();
  });

  afterEach(() => {
    handler.detach();
  });

  // ── Req 2.1: Space key triggers onFlap ──────────────────────────────────
  it('fires onFlap when Space key is pressed (e.code = Space)', () => {
    const event = new KeyboardEvent('keydown', { code: 'Space', key: ' ', bubbles: true });
    document.dispatchEvent(event);
    expect(onFlap).toHaveBeenCalledTimes(1);
  });

  it('fires onFlap when Space key is pressed (e.key = " ")', () => {
    const event = new KeyboardEvent('keydown', { code: 'Space', key: ' ', bubbles: true });
    document.dispatchEvent(event);
    expect(onFlap).toHaveBeenCalledTimes(1);
  });

  it('does NOT fire onFlap for non-Space keys', () => {
    const event = new KeyboardEvent('keydown', { code: 'ArrowUp', key: 'ArrowUp', bubbles: true });
    document.dispatchEvent(event);
    expect(onFlap).not.toHaveBeenCalled();
  });

  // ── Req 2.2: mousedown on canvas triggers onFlap ─────────────────────────
  it('fires onFlap on mousedown on the canvas', () => {
    const event = new MouseEvent('mousedown', { bubbles: true });
    canvas.dispatchEvent(event);
    expect(onFlap).toHaveBeenCalledTimes(1);
  });

  // ── Req 2.3: touchstart on canvas triggers onFlap ────────────────────────
  it('fires onFlap on touchstart on the canvas', () => {
    const event = new TouchEvent('touchstart', { bubbles: true, cancelable: true });
    canvas.dispatchEvent(event);
    expect(onFlap).toHaveBeenCalledTimes(1);
  });

  it('calls preventDefault on touchstart to prevent scroll (Req 9.7)', () => {
    const event = new TouchEvent('touchstart', { bubbles: true, cancelable: true });
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
    canvas.dispatchEvent(event);
    expect(preventDefaultSpy).toHaveBeenCalledTimes(1);
  });

  // ── detach() removes all listeners ───────────────────────────────────────
  it('does NOT fire onFlap after detach() — Space key', () => {
    handler.detach();
    const event = new KeyboardEvent('keydown', { code: 'Space', key: ' ', bubbles: true });
    document.dispatchEvent(event);
    expect(onFlap).not.toHaveBeenCalled();
  });

  it('does NOT fire onFlap after detach() — mousedown', () => {
    handler.detach();
    const event = new MouseEvent('mousedown', { bubbles: true });
    canvas.dispatchEvent(event);
    expect(onFlap).not.toHaveBeenCalled();
  });

  it('does NOT fire onFlap after detach() — touchstart', () => {
    handler.detach();
    const event = new TouchEvent('touchstart', { bubbles: true, cancelable: true });
    canvas.dispatchEvent(event);
    expect(onFlap).not.toHaveBeenCalled();
  });

  // ── Multiple events accumulate correctly ─────────────────────────────────
  it('fires onFlap multiple times for repeated Space presses', () => {
    for (let i = 0; i < 3; i++) {
      document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', key: ' ', bubbles: true }));
    }
    expect(onFlap).toHaveBeenCalledTimes(3);
  });
});
