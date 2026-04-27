# Audio Assets Specifications

## Overview

All audio assets are short, lightweight WAV files stored in the `assets/` directory. They are preloaded on page load via `AudioManager.preload()` and played from `currentTime = 0` on each trigger to support rapid re-triggering without overlap issues.

---

## Sound Effects

### Flap (`assets/jump.wav`)

| Property       | Value              |
|----------------|--------------------|
| Duration       | 0.1 s              |
| Character      | Short whoosh       |
| Frequency      | 800 Hz → 400 Hz sweep (descending) |
| Envelope       | Fast attack (5 ms), immediate decay |
| Volume         | 70% of master      |
| Trigger        | Every flap input during Idle and Playing states |
| Re-triggerable | Yes — resets `currentTime = 0` on each flap |

**Design notes:** Crisp and punchy so it doesn't feel laggy. The brief downward frequency sweep gives a sense of air displacement without being distracting.

---

### Score (`assets/score.wav`)

| Property       | Value              |
|----------------|--------------------|
| Duration       | 0.2 s              |
| Character      | Pleasant chime     |
| Frequency      | 880 Hz + 1320 Hz (two-tone, minor third) |
| Envelope       | Soft attack (10 ms), gentle decay with slight reverb tail |
| Volume         | 60% of master      |
| Trigger        | Each time Ghosty clears a pipe pair (`ScoreManager.increment()`) |
| Re-triggerable | Yes — resets `currentTime = 0` |

**Design notes:** Warm and rewarding without being shrill. The two-tone chime distinguishes it clearly from the flap sound.

---

### Collision (`assets/game_over.wav`)

| Property       | Value              |
|----------------|--------------------|
| Duration       | 0.3 s              |
| Character      | Soft thud          |
| Frequency      | Low-pass filtered noise burst, centered ~150 Hz |
| Envelope       | Instant attack, slow decay (300 ms) |
| Volume         | 80% of master      |
| Trigger        | On collision detection → `transitionTo('gameover')` |
| Re-triggerable | No — game enters Game Over state immediately after |

**Design notes:** Low and muffled to feel like impact without being harsh. The longer decay gives a sense of finality before the Game Over overlay appears.

---

## Playback Behavior

| Event                        | Sound played        | State guard                        |
|------------------------------|---------------------|------------------------------------|
| Flap during Idle             | `jump.wav`          | Plays                              |
| Flap during Playing          | `jump.wav`          | Plays                              |
| Flap during Game Over        | *(none)*            | Suppressed — transition to Idle    |
| Pipe cleared                 | `score.wav`         | Playing state only                 |
| Collision detected           | `game_over.wav`     | Plays once, then state locks       |

---

## Autoplay Policy Handling

Browsers block audio playback before the first user interaction. `AudioManager.unlock()` is called on the first input event (keydown, mousedown, or touchstart) to silently play and immediately pause each audio object, priming them for subsequent playback. All `play()` calls are wrapped in `try/catch` for silent fallback if audio is unavailable.

---

## File Requirements

| File                   | Format | Max size | Sample rate |
|------------------------|--------|----------|-------------|
| `assets/jump.wav`      | WAV    | 20 KB    | 44100 Hz    |
| `assets/score.wav`     | WAV    | 30 KB    | 44100 Hz    |
| `assets/game_over.wav` | WAV    | 50 KB    | 44100 Hz    |

> **Note:** `score.wav` is specified here for completeness. The current implementation references only `jump.wav` and `game_over.wav` per `AudioManager.preload()`. Add `score.wav` support when implementing pipe-clear audio feedback.
