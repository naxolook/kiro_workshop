# Ghosty Sprite Specifications

## Sprite Sheet

- **Dimensions:** 32×32 px per frame
- **Format:** PNG with transparency
- **Source file:** `assets/ghosty.png`

## Hitbox

- **Shape:** Circle
- **Radius:** 12 px
- **Center:** Sprite center (16, 16)

## Animation States

### Idle

| Property     | Value         |
|--------------|---------------|
| Frames       | 1–2           |
| Frame size   | 32×32 px      |
| Loop         | Yes           |
| Frame rate   | 4 fps         |
| Description  | Gentle hover; subtle up/down float driven by sine wave |

### Flap

| Property     | Value         |
|--------------|---------------|
| Frames       | 3–5           |
| Frame size   | 32×32 px      |
| Loop         | No (plays once per input) |
| Frame rate   | 12 fps        |
| Description  | Wings sweep upward on jump input, then return to idle |

### Death

| Property     | Value         |
|--------------|---------------|
| Frames       | 6–9           |
| Frame size   | 32×32 px      |
| Loop         | No (holds last frame) |
| Frame rate   | 8 fps         |
| Description  | Ghosty spins and fades on collision; freezes on final frame |

## Frame Layout (sprite sheet row)

```
[ 1 ][ 2 ][ 3 ][ 4 ][ 5 ][ 6 ][ 7 ][ 8 ][ 9 ]
 idle  idle flap flap flap death death death death
```

Each cell is 32×32 px. The sprite sheet is a single horizontal strip: **288×32 px** total.

## Notes

- All frames share the same 32×32 px canvas so the hitbox center stays consistent across states.
- The hitbox radius (12 px) is intentionally smaller than the visual sprite to allow visually close passes, matching `CONFIG.ghosty.collisionInset`.
- If `ghosty.png` fails to load, the renderer falls back to a filled rectangle of the same bounding size.
