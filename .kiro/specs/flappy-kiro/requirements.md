# Documento de Requisitos

## Introducción

Flappy Kiro es un juego retro de desplazamiento infinito que corre en el navegador. El jugador controla a un fantasma llamado Ghosty que debe navegar a través de una serie infinita de obstáculos de tubos con huecos verticales. La gravedad jala a Ghosty hacia abajo de forma continua; el jugador lo impulsa hacia arriba haciendo clic, tocando la pantalla o presionando la barra espaciadora. El juego termina cuando Ghosty colisiona con un tubo o con el borde de la pantalla. El puntaje aumenta con cada par de tubos superado, y el récord histórico se guarda entre sesiones. El juego corre completamente en el navegador usando HTML, CSS y JavaScript, sin necesidad de backend.

---

## Glosario

- **Juego**: La aplicación Flappy Kiro basada en navegador que corre en una sola página HTML.
- **Ghosty**: El personaje fantasma controlado por el jugador, renderizado con `assets/ghosty.png`.
- **Tubo**: Un obstáculo rectangular verde que se extiende desde la parte superior o inferior del viewport, dejando un hueco de tamaño fijo por el que Ghosty debe pasar.
- **Par de Tubos**: Un tubo superior y un tubo inferior que comparten la misma posición horizontal y definen juntos un único hueco.
- **Hueco**: La apertura vertical entre el tubo superior y el tubo inferior de un Par de Tubos.
- **Aleteo**: El impulso hacia arriba aplicado a Ghosty cuando el jugador activa un evento de entrada.
- **Puntaje**: El conteo entero de Pares de Tubos que Ghosty ha superado exitosamente en la sesión actual.
- **Récord**: El Puntaje más alto alcanzado en todas las sesiones, guardado en el almacenamiento local del navegador.
- **Barra de Puntaje**: La franja fija de UI en la parte inferior del viewport que muestra el Puntaje actual y el Récord.
- **Nube**: Una forma decorativa de rectángulo redondeado renderizada en el fondo para crear una estética de cielo retro.
- **Bucle de Juego**: El ciclo continuo de actualización y renderizado impulsado por `requestAnimationFrame`.
- **Colisión**: Contacto entre el bounding box de Ghosty y un rectángulo de tubo o el borde superior/inferior del viewport.
- **Estado Game Over**: El estado al que se entra inmediatamente después de una Colisión, deteniendo el Bucle de Juego y reproduciendo el sonido de fin de juego.
- **Estado Inactivo**: El estado inicial antes de la primera entrada, donde Ghosty se balancea suavemente y los tubos no se mueven.
- **Estado en Juego**: El estado activo donde los tubos se desplazan, la gravedad se aplica y el Puntaje se acumula.
- **Renderizador**: El componente responsable de dibujar todos los elementos visuales en el Canvas HTML5 en cada fotograma.
- **Motor de Física**: El componente responsable de aplicar la gravedad y el impulso de Aleteo a la velocidad vertical de Ghosty en cada fotograma.
- **Gestor de Tubos**: El componente responsable de generar, mover y reciclar Pares de Tubos.
- **Manejador de Entrada**: El componente responsable de traducir eventos de teclado, ratón y táctiles en acciones de Aleteo.
- **Gestor de Puntaje**: El componente responsable de rastrear el Puntaje, detectar eventos de paso de tubos y persistir el Récord.
- **Gestor de Audio**: El componente responsable de cargar y reproducir efectos de sonido.

---

## Requisitos

### Requisito 1: Inicialización del Juego

**Historia de Usuario:** Como jugador, quiero que el juego cargue instantáneamente en mi navegador sin ninguna instalación, para poder empezar a jugar de inmediato.

#### Criterios de Aceptación

1. EL Juego DEBERÁ ejecutarse completamente dentro de un único archivo HTML que referencie solo activos locales (`assets/ghosty.png`, `assets/jump.wav`, `assets/game_over.wav`).
2. EL Juego DEBERÁ renderizar todos los elementos visuales en un elemento Canvas HTML5 que ocupe todo el viewport del navegador.
3. CUANDO la página cargue, EL Juego DEBERÁ entrar al Estado Inactivo y mostrar a Ghosty centrado horizontalmente al 30% del ancho del viewport y centrado verticalmente.
4. CUANDO la página cargue, EL Renderizador DEBERÁ dibujar el fondo del cielo, las Nubes y a Ghosty antes de recibir cualquier entrada del jugador.
5. CUANDO la página cargue, EL Gestor de Puntaje DEBERÁ leer el Récord del almacenamiento local del navegador y mostrarlo en la Barra de Puntaje.

---

### Requisito 2: Entrada del Jugador

**Historia de Usuario:** Como jugador, quiero controlar a Ghosty haciendo clic, tocando la pantalla o presionando la barra espaciadora, para poder jugar cómodamente tanto en escritorio como en dispositivos móviles.

#### Criterios de Aceptación

1. CUANDO el jugador presione la barra espaciadora, EL Manejador de Entrada DEBERÁ activar una acción de Aleteo.
2. CUANDO el jugador haga clic con el botón izquierdo del ratón en cualquier parte del Canvas, EL Manejador de Entrada DEBERÁ activar una acción de Aleteo.
3. CUANDO el jugador toque en cualquier parte del Canvas en un dispositivo táctil, EL Manejador de Entrada DEBERÁ activar una acción de Aleteo.
4. CUANDO se active una acción de Aleteo durante el Estado Inactivo, EL Juego DEBERÁ transicionar al Estado en Juego.
5. CUANDO se active una acción de Aleteo durante el Estado en Juego, EL Motor de Física DEBERÁ aplicar un impulso de velocidad hacia arriba a Ghosty.
6. CUANDO se active una acción de Aleteo durante el Estado Game Over, EL Juego DEBERÁ reiniciarse y transicionar al Estado Inactivo.
7. CUANDO se active una acción de Aleteo, EL Gestor de Audio DEBERÁ reproducir el efecto de sonido `assets/jump.wav`, excepto durante el Estado Game Over.

---

### Requisito 3: Física y Movimiento

**Historia de Usuario:** Como jugador, quiero que Ghosty se sienta responsivo y sujeto a la gravedad, para que el juego tenga una física arcade satisfactoria.

#### Criterios de Aceptación

1. MIENTRAS esté en el Estado en Juego, EL Motor de Física DEBERÁ aplicar una aceleración gravitacional descendente constante a la velocidad vertical de Ghosty en cada fotograma.
2. CUANDO se active una acción de Aleteo, EL Motor de Física DEBERÁ establecer la velocidad vertical de Ghosty a un valor fijo hacia arriba, anulando cualquier velocidad vertical actual.
3. MIENTRAS esté en el Estado en Juego, EL Motor de Física DEBERÁ actualizar la posición vertical de Ghosty sumando la velocidad vertical actual en cada fotograma.
4. EL Motor de Física DEBERÁ limitar la velocidad vertical de Ghosty a una velocidad terminal máxima descendente.
5. MIENTRAS esté en el Estado Inactivo, EL Renderizador DEBERÁ animar a Ghosty con un suave balanceo vertical usando un desplazamiento de onda sinusoidal, sin aplicar gravedad.

---

### Requisito 4: Obstáculos de Tubos

**Historia de Usuario:** Como jugador, quiero una serie infinita de obstáculos de tubos para navegar, para que el juego ofrezca un desafío continuo y creciente.

#### Criterios de Aceptación

1. MIENTRAS esté en el Estado en Juego, EL Gestor de Tubos DEBERÁ desplazar todos los Pares de Tubos hacia la izquierda a una velocidad horizontal que aumente levemente de forma proporcional al Puntaje actual.
2. CUANDO un Par de Tubos salga por el borde izquierdo del viewport, EL Gestor de Tubos DEBERÁ reciclarlo reposicionándolo más allá del borde derecho del viewport con una nueva posición vertical aleatoria del Hueco.
3. EL Gestor de Tubos DEBERÁ mantener un espaciado horizontal mínimo entre Pares de Tubos consecutivos para que Ghosty siempre tenga tiempo de reaccionar.
4. EL Gestor de Tubos DEBERÁ aleatorizar el centro vertical de cada Hueco dentro de un rango que mantenga el Hueco completamente dentro del viewport.
5. EL Gestor de Tubos DEBERÁ renderizar cada Par de Tubos como dos rectángulos verdes sólidos (tubo superior y tubo inferior).
6. CUANDO se recicle un Par de Tubos, EL Gestor de Tubos DEBERÁ determinar aleatoriamente si el Hueco de ese par se reduce ligeramente respecto al anterior o mantiene el mismo tamaño, garantizando que el Hueco nunca sea menor a un tamaño mínimo jugable.
7. CUANDO el Juego transicione al Estado Inactivo, EL Gestor de Tubos DEBERÁ reiniciar todos los Pares de Tubos a sus posiciones iniciales fuera de pantalla y restaurar el tamaño de Hueco y la velocidad a sus valores iniciales.

---

### Requisito 5: Detección de Colisiones

**Historia de Usuario:** Como jugador, quiero que el juego detecte con precisión cuando Ghosty golpea un tubo o el borde, para que el juego termine de forma justa.

#### Criterios de Aceptación

1. MIENTRAS esté en el Estado en Juego, EL Juego DEBERÁ evaluar la Colisión entre el bounding box de Ghosty y los rectángulos superior e inferior de cada Par de Tubos en cada fotograma.
2. MIENTRAS esté en el Estado en Juego, EL Juego DEBERÁ evaluar la Colisión entre el bounding box de Ghosty y el borde superior (y = 0) y el borde inferior (y = altura del viewport menos la altura de la Barra de Puntaje) en cada fotograma.
3. CUANDO se detecte una Colisión, EL Juego DEBERÁ transicionar inmediatamente al Estado Game Over.
4. CUANDO se detecte una Colisión, EL Gestor de Audio DEBERÁ reproducir el efecto de sonido `assets/game_over.wav`.
5. EL Juego DEBERÁ usar detección de colisiones por caja delimitadora alineada con los ejes (AABB) con un pequeño margen interior en el bounding box de Ghosty para permitir pases visualmente cercanos.

---

### Requisito 6: Puntaje

**Historia de Usuario:** Como jugador, quiero que mi puntaje aumente al pasar tubos y que mi mejor puntaje se guarde, para tener una meta que superar.

#### Criterios de Aceptación

1. CUANDO la posición horizontal de Ghosty pase el borde derecho del hueco de un Par de Tubos por primera vez, EL Gestor de Puntaje DEBERÁ incrementar el Puntaje en 1.
2. CUANDO el Puntaje se incremente, EL Gestor de Puntaje DEBERÁ actualizar la visualización del Puntaje en la Barra de Puntaje de inmediato.
3. CUANDO el Juego transicione al Estado Game Over, EL Gestor de Puntaje DEBERÁ comparar el Puntaje actual con el Récord.
4. CUANDO el Puntaje actual supere el Récord, EL Gestor de Puntaje DEBERÁ actualizar el Récord y guardarlo en el almacenamiento local del navegador.
5. CUANDO el Juego se reinicie al Estado Inactivo, EL Gestor de Puntaje DEBERÁ reiniciar el Puntaje actual a 0 mientras preserva el Récord.
6. LA Barra de Puntaje DEBERÁ mostrar el texto "Score: [N] | High: [N]" donde [N] es el valor entero correspondiente.

---

### Requisito 7: Presentación Visual

**Historia de Usuario:** Como jugador, quiero un estilo visual retro y bocetado con un cielo azul claro y nubes flotantes semitransparentes, para que el juego tenga una estética encantadora con sensación de profundidad.

#### Criterios de Aceptación

1. EL Renderizador DEBERÁ rellenar el fondo del Canvas con un color azul claro sólido en cada fotograma antes de dibujar otros elementos.
2. EL Renderizador DEBERÁ dibujar un número fijo de formas de Nube como rectángulos redondeados en la capa de fondo, detrás de los tubos y de Ghosty.
3. CADA Nube DEBERÁ tener asignada una opacidad semitransparente individual (entre 0.3 y 0.8) que permanezca constante durante su ciclo de vida, de modo que las nubes más transparentes aparenten estar más lejos.
4. CADA Nube DEBERÁ tener asignada una velocidad de desplazamiento horizontal individual, donde las nubes más lentas y más transparentes simulan mayor distancia y las más rápidas y opacas simulan menor distancia, creando un efecto de paralaje multicapa.
5. MIENTRAS esté en el Estado en Juego, EL Renderizador DEBERÁ desplazar cada Nube hacia la izquierda a su velocidad individual asignada, todas menores que la velocidad de desplazamiento de los tubos.
6. CUANDO una Nube salga por el borde izquierdo del viewport, EL Renderizador DEBERÁ reposicionarla más allá del borde derecho del viewport con una nueva posición vertical aleatoria para mantener una capa de nubes continua.
7. EL Renderizador DEBERÁ dibujar a Ghosty usando la imagen `assets/ghosty.png` a un tamaño de visualización fijo.
8. EL Renderizador DEBERÁ dibujar la Barra de Puntaje como una franja de color oscuro fija en la parte inferior del viewport, superpuesta al Canvas.
9. CUANDO el Juego esté en el Estado Game Over, EL Renderizador DEBERÁ mostrar un mensaje de superposición "Game Over" centrado en el Canvas sobre los tubos.
10. CUANDO el Juego esté en el Estado Inactivo, EL Renderizador DEBERÁ mostrar un mensaje "Toca o Presiona Espacio para Empezar" centrado en el Canvas.

---

### Requisito 8: Audio

**Historia de Usuario:** Como jugador, quiero retroalimentación sonora para mis acciones y eventos del juego, para que el juego se sienta responsivo y vivo.

#### Criterios de Aceptación

1. EL Gestor de Audio DEBERÁ precargar `assets/jump.wav` y `assets/game_over.wav` cuando la página cargue.
2. CUANDO se active la acción de Aleteo durante el Estado en Juego, EL Gestor de Audio DEBERÁ reproducir `assets/jump.wav` desde el principio.
3. CUANDO se detecte una Colisión, EL Gestor de Audio DEBERÁ reproducir `assets/game_over.wav` desde el principio.
4. SI el navegador bloquea la reproducción automática antes de la primera interacción del usuario, ENTONCES EL Gestor de Audio DEBERÁ diferir la reproducción de audio hasta después de que ocurra la primera interacción del usuario.

---

### Requisito 9: Responsividad

**Historia de Usuario:** Como jugador, quiero que el juego se adapte a diferentes tamaños de pantalla, para que sea jugable tanto en navegadores de escritorio como móviles, con la experiencia optimizada para ambos.

#### Criterios de Aceptación

1. EL Juego DEBERÁ escalar el Canvas para ocupar todo el ancho y alto del viewport del navegador al cargar inicialmente.
2. CUANDO se redimensione la ventana del navegador, EL Juego DEBERÁ redimensionar el Canvas para que coincida con las nuevas dimensiones del viewport y reposicionar todos los elementos del juego proporcionalmente.
3. EL Gestor de Tubos DEBERÁ derivar la velocidad de desplazamiento de los tubos y la altura del Hueco como proporciones de las dimensiones actuales del viewport para que la dificultad sea consistente en diferentes tamaños de pantalla.
4. EL Motor de Física DEBERÁ derivar los valores de gravedad e impulso de Aleteo como proporciones de la altura actual del viewport para que la sensación sea consistente en diferentes tamaños de pantalla.
5. EN dispositivos móviles, EL Juego DEBERÁ responder a eventos táctiles (`touchstart`) para activar el Aleteo, y EL Renderizador DEBERÁ mostrar un indicador visual de "toca para aletear" en el Estado Inactivo.
6. EN dispositivos de escritorio, EL Juego DEBERÁ responder a clics de ratón y a la barra espaciadora para activar el Aleteo, y EL Renderizador DEBERÁ mostrar el indicador "presiona espacio o haz clic para aletear" en el Estado Inactivo.
7. EL Juego DEBERÁ prevenir el comportamiento de desplazamiento predeterminado del navegador en dispositivos móviles (scroll al tocar) para evitar interrupciones durante el juego.
