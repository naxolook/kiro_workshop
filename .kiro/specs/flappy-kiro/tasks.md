# Plan de Implementación: Flappy Kiro

## Visión General

Implementar Flappy Kiro como un único archivo `index.html` con HTML5 Canvas y JavaScript puro. La implementación sigue la arquitectura de módulos coordinados por `GameController`, con un objeto `CONFIG` centralizado que elimina todos los números mágicos. Las tareas están ordenadas de forma incremental: primero la estructura base, luego cada módulo de forma independiente, y finalmente la integración completa.

## Tareas

- [-] 1. Crear la estructura base del archivo `index.html`
  - Crear `index.html` con el elemento `<canvas>` que ocupe todo el viewport (`width: 100vw; height: 100vh; display: block`)
  - Añadir el bloque `<script>` con el objeto `CONFIG` completo tal como está definido en el diseño (physics, pipes, clouds, ghosty, colors, ui, storage, loop)
  - Definir el enum `GameState` con los valores `IDLE`, `PLAYING`, `GAMEOVER`
  - Verificar que el archivo abre en el navegador sin errores de consola
  - _Requisitos: 1.1, 1.2_

- [ ] 2. Implementar `ScoreManager` y su persistencia en `localStorage`
  - [~] 2.1 Implementar la clase `ScoreManager`
    - Escribir los métodos `reset()`, `increment()`, `getScore()`, `getHighScore()`, `saveHighScore()` y `loadHighScore()`
    - `reset()` pone el puntaje a 0 pero preserva el récord
    - `saveHighScore()` y `loadHighScore()` usan `CONFIG.storage.highScoreKey` y envuelven las operaciones en `try/catch`
    - _Requisitos: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 2.2 Escribir prueba de propiedad: round-trip de récord en localStorage
    - **Propiedad 1: Round-trip de récord en localStorage**
    - Usar `fc.integer({ min: 0 })` para generar N; guardar con `saveHighScore()` y verificar que `loadHighScore()` + `getHighScore()` devuelve N
    - **Valida: Requisitos 1.5, 6.3, 6.4**

  - [ ]* 2.3 Escribir prueba de propiedad: reset preserva el récord
    - **Propiedad 10: Reset de puntaje preserva el récord**
    - Usar `fc.integer({ min: 0 })` para establecer un récord, llamar `reset()` y verificar que `getScore() === 0` y `getHighScore()` no cambia
    - **Valida: Requisito 6.5**

  - [ ]* 2.4 Escribir prueba de propiedad: formato del texto de puntaje
    - **Propiedad 11: Formato correcto del texto de puntaje**
    - Usar `fc.integer({ min: 0 })` para N y H; verificar que la función de formato devuelve exactamente `"Score: N | High: H"`
    - **Valida: Requisito 6.6**

  - [ ]* 2.5 Escribir prueba de propiedad: incremento de puntaje al pasar un tubo
    - **Propiedad 9: Incremento de puntaje al pasar un tubo**
    - Simular el paso de un par con `scored = false`; verificar que el puntaje sube exactamente 1 y `scored` pasa a `true`; verificar que el mismo par no se contabiliza dos veces
    - **Valida: Requisito 6.1**

- [ ] 3. Implementar `PhysicsEngine`
  - [~] 3.1 Implementar la clase `PhysicsEngine`
    - Escribir `constructor(viewportHeight)`, `reset(startY)`, `applyFlap()`, `update(deltaTime)`, `getY()` y `getVelocity()`
    - `applyFlap()` establece la velocidad a `-(CONFIG.physics.flapImpulseRatio * viewportHeight)` sin importar el valor previo
    - `update(dt)` aplica `velocity += gravity * dt` y luego limita a `terminalVel`; actualiza posición con la velocidad antes del clamp
    - _Requisitos: 3.1, 3.2, 3.3, 3.4_

  - [ ]* 3.2 Escribir prueba de propiedad: el aleteo establece velocidad fija hacia arriba
    - **Propiedad 2: El aleteo establece velocidad fija hacia arriba**
    - Usar `fc.float()` para generar velocidades iniciales arbitrarias; verificar que tras `applyFlap()` la velocidad es exactamente `-(CONFIG.physics.flapImpulseRatio * viewportHeight)`
    - **Valida: Requisitos 2.5, 3.2**

  - [ ]* 3.3 Escribir prueba de propiedad: integración física correcta
    - **Propiedad 3: Integración física correcta**
    - Usar `fc.float()` para y, v < terminalVel, y `fc.float({ min: 1 })` para dt; verificar nueva velocidad y nueva posición según las fórmulas del diseño
    - **Valida: Requisitos 3.1, 3.3**

  - [ ]* 3.4 Escribir prueba de propiedad: velocidad terminal máxima descendente
    - **Propiedad 4: Velocidad terminal máxima descendente**
    - Generar secuencias de llamadas a `update(dt)` sin `applyFlap()`; verificar que `getVelocity()` nunca supera `CONFIG.physics.terminalVelRatio * viewportHeight`
    - **Valida: Requisito 3.4**

- [ ] 4. Implementar `PipeManager`
  - [~] 4.1 Implementar la clase `PipeManager`
    - Escribir `constructor(viewportWidth, viewportHeight)`, `reset()`, `update(deltaTime, score)`, `getPipes()` y `checkScoring(ghostX)`
    - `reset()` posiciona todos los pares fuera de pantalla a la derecha con el hueco base
    - `update()` desplaza tubos a `pipeSpeed * (1 + score * CONFIG.pipes.speedIncrement)` y recicla los que salen por la izquierda
    - Al reciclar, con probabilidad `CONFIG.pipes.gapReductionProb` reduce el hueco en `gapReductionRatio * viewportHeight`, nunca por debajo de `gapMinRatio * viewportHeight`
    - El centro del hueco se aleatoriza para que el hueco quede completamente dentro del área jugable
    - _Requisitos: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [ ]* 4.2 Escribir prueba de propiedad: velocidad de tubos proporcional al puntaje
    - **Propiedad 5: Velocidad de tubos proporcional al puntaje**
    - Usar `fc.integer({ min: 0 })` para N; verificar que la velocidad calculada es exactamente `pipeSpeed * (1 + N * CONFIG.pipes.speedIncrement)`
    - **Valida: Requisito 4.1**

  - [ ]* 4.3 Escribir prueba de propiedad: reciclaje de tubos fuera de pantalla
    - **Propiedad 6: Reciclaje de tubos fuera de pantalla**
    - Posicionar un par con `x < -pipeWidth`; llamar a `update()`; verificar que `x > viewportWidth`
    - **Valida: Requisito 4.2**

  - [ ]* 4.4 Escribir prueba de propiedad: invariantes del hueco de tubos
    - **Propiedad 7: Invariantes del hueco de tubos**
    - Tras múltiples ciclos de reciclaje, verificar que `gapSize >= gapMinRatio * viewportHeight`, que el hueco está dentro del área jugable, y que el espaciado entre pares consecutivos es ≥ `spacingRatio * viewportWidth`
    - **Valida: Requisitos 4.3, 4.4, 4.6**

- [~] 5. Punto de control — Verificar módulos de lógica central
  - Asegurarse de que todas las pruebas de `ScoreManager`, `PhysicsEngine` y `PipeManager` pasan. Consultar al usuario si surgen dudas.

- [~] 6. Implementar `CloudLayer`
  - Escribir `constructor(viewportWidth, viewportHeight)`, `reset()`, `update(deltaTime, isPlaying)` y `getClouds()`
  - Inicializar `CONFIG.clouds.count` nubes con posiciones, tamaños, opacidades y velocidades aleatorias dentro de los rangos de `CONFIG.clouds`
  - La velocidad de cada nube es proporcional a su opacidad (más opaca = más rápida)
  - `update()` solo mueve las nubes cuando `isPlaying === true`; recicla las que salen por la izquierda con nueva posición Y aleatoria
  - _Requisitos: 7.2, 7.3, 7.4, 7.5, 7.6_

- [~] 7. Implementar `AudioManager`
  - Escribir `constructor()`, `preload()`, `playJump()`, `playGameOver()` y `unlock()`
  - `preload()` crea objetos `Audio` para `assets/jump.wav` y `assets/game_over.wav`
  - `playJump()` y `playGameOver()` reinician `currentTime = 0` antes de llamar a `play()`; envuelven `play()` en `try/catch`
  - `unlock()` se llama en la primera interacción del usuario para desbloquear la política de autoplay
  - _Requisitos: 8.1, 8.2, 8.3, 8.4_

  - [ ]* 7.1 Escribir pruebas de ejemplo para `AudioManager`
    - Verificar que `preload()` crea los objetos `Audio` correctos
    - Verificar que `playJump()` y `playGameOver()` no lanzan excepciones cuando el audio no está disponible (fallback silencioso)
    - _Requisitos: 8.1, 8.4_

- [~] 8. Implementar `InputHandler`
  - Escribir `constructor(canvas, onFlap)`, `attach()` y `detach()`
  - `attach()` registra `keydown` (Space), `mousedown` y `touchstart` en el canvas
  - `touchstart` llama a `preventDefault()` para evitar scroll en móvil
  - Cada evento llama al callback `onFlap`
  - _Requisitos: 2.1, 2.2, 2.3, 9.5, 9.7_

  - [ ]* 8.1 Escribir pruebas de ejemplo para `InputHandler`
    - Verificar que Space, mousedown y touchstart disparan el callback `onFlap`
    - Verificar que `detach()` elimina los listeners correctamente
    - _Requisitos: 2.1, 2.2, 2.3_

- [~] 9. Implementar `Renderer`
  - Escribir `constructor(canvas, ctx)` y los métodos: `drawBackground()`, `drawClouds(clouds)`, `drawPipes(pipes, pipeWidth)`, `drawGhosty(x, y, img, size)`, `drawScoreBar(score, high)`, `drawIdleOverlay(isMobile)` y `drawGameOverOverlay()`
  - Todos los colores se leen de `CONFIG.colors`; todos los tamaños de fuente de `CONFIG.ui`
  - `drawGhosty()` usa `assets/ghosty.png`; si la imagen no carga, dibuja un rectángulo de color como fallback
  - `drawIdleOverlay()` muestra "Toca o Presiona Espacio para Empezar" (móvil) o "Presiona Espacio o Haz Clic para Empezar" (escritorio)
  - `drawGameOverOverlay()` muestra el mensaje "Game Over" centrado
  - `drawScoreBar()` renderiza el texto en formato `"Score: N | High: H"`
  - _Requisitos: 7.1, 7.2, 7.7, 7.8, 7.9, 7.10, 9.5, 9.6_

  - [ ]* 9.1 Escribir pruebas de ejemplo para `Renderer`
    - Verificar que `drawIdleOverlay(true)` incluye el texto táctil y `drawIdleOverlay(false)` incluye el texto de teclado/ratón
    - Verificar que `drawGhosty()` no lanza excepción cuando la imagen no está disponible (fallback)
    - _Requisitos: 7.9, 7.10, 9.5, 9.6_

- [ ] 10. Implementar `GameController` e integrar todos los módulos
  - [~] 10.1 Implementar la clase `GameController`
    - Escribir `constructor(canvas)`, `init()`, `start()`, `update(deltaTime)`, `render()`, `handleFlap()`, `handleResize()`, `transitionTo(state)` y `reset()`
    - `init()` instancia todos los módulos, registra `InputHandler`, llama a `AudioManager.preload()` y `ScoreManager.loadHighScore()`, y arranca el bucle con `requestAnimationFrame`
    - El bucle calcula `deltaTime` limitado a `CONFIG.loop.maxDeltaTime` ms
    - `handleResize()` usa debounce de `CONFIG.loop.resizeDebounce` ms; recalcula todas las dimensiones derivadas y llama a `reset()` en cada módulo
    - `transitionTo('playing')` arranca la física; `transitionTo('gameover')` llama a `AudioManager.playGameOver()` y `ScoreManager.saveHighScore()`; `transitionTo('idle')` llama a `reset()` en todos los módulos
    - `handleFlap()` según el estado: idle → playing + playJump; playing → applyFlap + playJump; gameover → idle
    - _Requisitos: 1.3, 1.4, 2.4, 2.5, 2.6, 2.7, 5.3, 5.4, 9.1, 9.2_

  - [~] 10.2 Implementar la detección de colisiones AABB en `GameController`
    - Calcular el bounding box reducido de Ghosty aplicando `CONFIG.ghosty.collisionInset` por cada lado
    - Evaluar colisión contra cada tubo superior e inferior de `PipeManager.getPipes()`
    - Evaluar colisión contra el borde superior (y = 0) y el borde inferior (y = viewportHeight - scoreBarHeight)
    - Si hay colisión, llamar a `transitionTo('gameover')`
    - _Requisitos: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 10.3 Escribir prueba de propiedad: detección de colisión AABB
    - **Propiedad 8: Detección de colisión AABB**
    - Usar `fc.record()` para generar posiciones de Ghosty y tubos; verificar que la función devuelve `true` si y solo si los bounding boxes reducidos se solapan
    - **Valida: Requisitos 5.1, 5.2, 5.5**

  - [ ]* 10.4 Escribir prueba de propiedad: parámetros proporcionales al viewport tras resize
    - **Propiedad 12: Parámetros proporcionales al viewport**
    - Usar `fc.integer({ min: 100 })` para W y H; llamar a `handleResize(W, H)`; verificar que `canvas.width === W`, `canvas.height === H` y que todos los parámetros derivados coinciden con `CONFIG.*Ratio * W` o `CONFIG.*Ratio * H`
    - **Valida: Requisitos 9.2, 9.3, 9.4**

  - [~] 10.5 Implementar el balanceo idle de Ghosty en el bucle de renderizado
    - En el estado `IDLE`, calcular el desplazamiento Y con `Math.sin(timestamp * CONFIG.ghosty.bobFrequency) * CONFIG.ghosty.bobAmplitude * viewportHeight`
    - Pasar la posición resultante a `Renderer.drawGhosty()`
    - _Requisitos: 1.3, 3.5_

- [~] 11. Punto de control final — Verificar integración completa
  - Asegurarse de que todas las pruebas pasan (propiedades y ejemplos). Abrir `index.html` en el navegador y verificar manualmente: carga inicial, aleteo, colisiones, puntaje, récord persistido, redimensionamiento de ventana y audio. Consultar al usuario si surgen dudas.

## Notas

- Las tareas marcadas con `*` son opcionales y pueden omitirse para una versión MVP más rápida.
- Cada tarea referencia requisitos específicos para trazabilidad completa.
- Los puntos de control garantizan validación incremental antes de continuar.
- Las pruebas de propiedad usan **fast-check** con al menos 100 iteraciones por propiedad.
- Las pruebas de ejemplo cubren transiciones de estado, mapeo de entradas, renderizado de overlays y fallbacks de activos.
- Ningún componente debe usar números mágicos; todos los valores se leen de `CONFIG`.
