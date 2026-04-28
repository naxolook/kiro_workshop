/**
 * tests/audio-manager.test.js
 *
 * Example tests for AudioManager.
 * Validates: Requirements 8.1, 8.4
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AudioManager } from './modules.js';

// ─────────────────────────────────────────────────────────────────────────────
// Mock Audio constructor
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a mock Audio instance that tracks calls and allows configuring
 * play() to resolve or reject.
 */
function createMockAudio(playShouldReject = false) {
  return {
    src: '',
    currentTime: 0,
    play: vi.fn(() =>
      playShouldReject
        ? Promise.reject(new Error('NotAllowedError'))
        : Promise.resolve()
    ),
    pause: vi.fn(),
  };
}

describe('AudioManager', () => {
  let originalAudio;

  beforeEach(() => {
    originalAudio = globalThis.Audio;
  });

  afterEach(() => {
    globalThis.Audio = originalAudio;
    vi.restoreAllMocks();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // preload() — Req 8.1
  // ───────────────────────────────────────────────────────────────────────────

  describe('preload()', () => {
    it('creates Audio objects with the correct src paths', () => {
      const createdInstances = [];
      globalThis.Audio = vi.fn((src) => {
        const instance = createMockAudio();
        instance.src = src;
        createdInstances.push(instance);
        return instance;
      });

      const manager = new AudioManager();
      manager.preload();

      // Audio constructor should have been called twice
      expect(globalThis.Audio).toHaveBeenCalledTimes(2);

      // First call: jump sound
      expect(globalThis.Audio).toHaveBeenNthCalledWith(1, 'assets/jump.wav');
      // Second call: game over sound
      expect(globalThis.Audio).toHaveBeenNthCalledWith(2, 'assets/game_over.wav');

      // jumpSound and gameOverSound should be set
      expect(manager.jumpSound).not.toBeNull();
      expect(manager.gameOverSound).not.toBeNull();
    });

    it('sets jumpSound to the Audio object for jump.wav', () => {
      const jumpInstance = createMockAudio();
      const gameOverInstance = createMockAudio();
      let callCount = 0;
      globalThis.Audio = vi.fn(() => {
        callCount++;
        return callCount === 1 ? jumpInstance : gameOverInstance;
      });

      const manager = new AudioManager();
      manager.preload();

      expect(manager.jumpSound).toBe(jumpInstance);
    });

    it('sets gameOverSound to the Audio object for game_over.wav', () => {
      const jumpInstance = createMockAudio();
      const gameOverInstance = createMockAudio();
      let callCount = 0;
      globalThis.Audio = vi.fn(() => {
        callCount++;
        return callCount === 1 ? jumpInstance : gameOverInstance;
      });

      const manager = new AudioManager();
      manager.preload();

      expect(manager.gameOverSound).toBe(gameOverInstance);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // playJump() — Req 8.2, 8.4 (silent fallback)
  // ───────────────────────────────────────────────────────────────────────────

  describe('playJump()', () => {
    it('does not throw when audio is unavailable (play rejects)', async () => {
      const mockAudio = createMockAudio(true); // play() rejects
      globalThis.Audio = vi.fn(() => mockAudio);

      const manager = new AudioManager();
      manager.preload();

      // Should not throw even though play() rejects
      expect(() => manager.playJump()).not.toThrow();

      // Allow the rejected promise to settle without unhandled rejection
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    it('does not throw when preload() has not been called', () => {
      const manager = new AudioManager();
      // jumpSound is null — should be a no-op
      expect(() => manager.playJump()).not.toThrow();
    });

    it('resets currentTime to 0 before playing', () => {
      const mockAudio = createMockAudio();
      mockAudio.currentTime = 999;
      globalThis.Audio = vi.fn(() => mockAudio);

      const manager = new AudioManager();
      manager.preload();
      manager.playJump();

      expect(mockAudio.currentTime).toBe(0);
    });

    it('calls play() on the jump sound', () => {
      const mockAudio = createMockAudio();
      globalThis.Audio = vi.fn(() => mockAudio);

      const manager = new AudioManager();
      manager.preload();
      manager.playJump();

      expect(mockAudio.play).toHaveBeenCalledTimes(1);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // playGameOver() — Req 8.3, 8.4 (silent fallback)
  // ───────────────────────────────────────────────────────────────────────────

  describe('playGameOver()', () => {
    it('does not throw when audio is unavailable (play rejects)', async () => {
      const mockAudio = createMockAudio(true); // play() rejects
      globalThis.Audio = vi.fn(() => mockAudio);

      const manager = new AudioManager();
      manager.preload();

      expect(() => manager.playGameOver()).not.toThrow();

      await new Promise(resolve => setTimeout(resolve, 0));
    });

    it('does not throw when preload() has not been called', () => {
      const manager = new AudioManager();
      // gameOverSound is null — should be a no-op
      expect(() => manager.playGameOver()).not.toThrow();
    });

    it('resets currentTime to 0 before playing', () => {
      const mockAudio = createMockAudio();
      mockAudio.currentTime = 999;
      globalThis.Audio = vi.fn(() => mockAudio);

      const manager = new AudioManager();
      manager.preload();
      manager.playGameOver();

      expect(mockAudio.currentTime).toBe(0);
    });

    it('calls play() on the game over sound', () => {
      const mockAudio = createMockAudio();
      globalThis.Audio = vi.fn(() => mockAudio);

      const manager = new AudioManager();
      manager.preload();
      manager.playGameOver();

      expect(mockAudio.play).toHaveBeenCalledTimes(1);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // unlock() — Req 8.4
  // ───────────────────────────────────────────────────────────────────────────

  describe('unlock()', () => {
    it('does not throw when called before preload()', () => {
      const manager = new AudioManager();
      expect(() => manager.unlock()).not.toThrow();
    });

    it('does not throw when play() rejects during unlock', async () => {
      const mockAudio = createMockAudio(true); // play() rejects
      globalThis.Audio = vi.fn(() => mockAudio);

      const manager = new AudioManager();
      manager.preload();

      expect(() => manager.unlock()).not.toThrow();

      await new Promise(resolve => setTimeout(resolve, 0));
    });

    it('calls play() on both sounds to unlock autoplay', () => {
      const jumpMock = createMockAudio();
      const gameOverMock = createMockAudio();
      let callCount = 0;
      globalThis.Audio = vi.fn(() => {
        callCount++;
        return callCount === 1 ? jumpMock : gameOverMock;
      });

      const manager = new AudioManager();
      manager.preload();
      manager.unlock();

      expect(jumpMock.play).toHaveBeenCalledTimes(1);
      expect(gameOverMock.play).toHaveBeenCalledTimes(1);
    });
  });
});
