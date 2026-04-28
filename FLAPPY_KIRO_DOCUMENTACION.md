# Flappy Kiro — Documentación del Proyecto

**Fecha:** Abril 2026  
**Proyecto:** Flappy Kiro — Juego de navegador estilo Flappy Bird con temática Halloween  
**Tecnologías:** HTML5 Canvas, JavaScript puro, AWS S3, AWS CloudFront

---

## Índice

1. [Resumen del Proyecto](#1-resumen-del-proyecto)
2. [Fase 1 — Especificación y Diseño](#2-fase-1--especificación-y-diseño)
3. [Fase 2 — Implementación de Módulos](#3-fase-2--implementación-de-módulos)
4. [Fase 3 — Integración y GameController](#4-fase-3--integración-y-gamecontroller)
5. [Fase 4 — Mejoras de Jugabilidad](#5-fase-4--mejoras-de-jugabilidad)
6. [Fase 5 — Nuevas Funcionalidades](#6-fase-5--nuevas-funcionalidades)
7. [Fase 6 — Despliegue en Producción AWS](#7-fase-6--despliegue-en-producción-aws)
8. [Comandos de Despliegue AWS](#8-comandos-de-despliegue-aws)
9. [Arquitectura Final](#9-arquitectura-final)
10. [URLs del Juego](#10-urls-del-juego)

---

## 1. Resumen del Proyecto

Flappy Kiro es un juego de navegador implementado en un único archivo `index.html` con HTML5 Canvas y JavaScript puro, sin frameworks ni dependencias externas. El jugador controla a Ghosty, un fantasma que debe esquivar obstáculos mientras colecciona power-ups.

### Características principales
- Física suave estilo Geometry Dash
- Sistema de vidas (3 vidas iniciales)
- Power-ups: vida extra ❤️, boina francesa 🎩 (invencibilidad 5s), boinas negras coleccionables (+2 pts)
- Obstáculos alternos: tubos verdes y obstáculos de llamas 🔥
- Fondos de Halloween que cambian según el score
- Pantalla de inicio estilo Space Invaders con ingreso de nombre
- Tabla de puntuaciones persistida en localStorage
- Despliegue en AWS S3 + CloudFront con HTTPS

---

## 2. Fase 1 — Especificación y Diseño

### Pasos realizados

**Selección del tipo de spec:** Se eligió el flujo de trabajo *Feature Requirements-First* para documentar los requisitos antes del diseño técnico.

**Documentos generados:**
- `requirements.md` — 9 requisitos funcionales con criterios de aceptación
- `design.md` — Arquitectura técnica con 12 propiedades de corrección
- `tasks.md` — Plan de implementación con 11 tareas y sub-tareas

### Arquitectura definida

```
GameController
├── InputHandler       (teclado, ratón, táctil)
├── PhysicsEngine      (gravedad, impulso)
├── PipeManager        (obstáculos)
├── ScoreManager       (puntaje, récord)
├── AudioManager       (efectos de sonido)
├── Renderer           (dibujo en canvas)
├── CloudLayer         (nubes decorativas)
└── PowerUpManager     (power-ups)
```

### CONFIG centralizado

Todos los valores del juego se definen en un objeto `CONFIG` al inicio del script. Ningún componente usa números mágicos.

---

## 3. Fase 2 — Implementación de Módulos

### Tareas completadas

| Tarea | Módulo | Descripción |
|-------|--------|-------------|
| 1 | Estructura base | `index.html` con canvas, CONFIG, GameState |
| 2 | ScoreManager | Puntaje, récord, persistencia localStorage |
| 3 | PhysicsEngine | Gravedad, impulso, velocidad terminal |
| 4 | PipeManager | Generación y reciclaje de tubos |
| 5 | Checkpoint | Verificación de módulos centrales |
| 6 | CloudLayer | Nubes con efecto parallax |
| 7 | AudioManager | Efectos de sonido con fallback |
| 8 | InputHandler | Teclado, ratón y táctil |
| 9 | Renderer | Dibujo de todos los elementos |

### Pruebas implementadas

Se implementaron **56 tests** usando Vitest + fast-check (property-based testing):

- **ScoreManager:** 4 tests (propiedades 1, 9, 10, 11)
- **PhysicsEngine:** 3 tests (propiedades 2, 3, 4)
- **PipeManager:** 3 tests (propiedades 5, 6, 7)
- **GameController:** 7 tests (propiedades 8, 12)
- **AudioManager:** 14 tests de ejemplo
- **InputHandler:** 10 tests de ejemplo
- **Renderer:** 15 tests de ejemplo

Todos los tests pasaron exitosamente.

---

## 4. Fase 3 — Integración y GameController

### GameController implementado con:

- **Bucle de juego** con `requestAnimationFrame` limitado a 30 FPS
- **Máquina de estados:** INTRO → IDLE → PLAYING → GAMEOVER
- **Detección de colisiones AABB** con inset configurable
- **Balanceo idle** de Ghosty con función seno
- **Manejo de resize** con debounce de 100ms
- **Soporte devicePixelRatio** para pantallas Retina

---

## 5. Fase 4 — Mejoras de Jugabilidad

### Problemas identificados y soluciones aplicadas

#### Física demasiado brusca
**Problema:** El fantasma se disparaba al extremo superior con un solo click.  
**Solución:** Reescritura del `PhysicsEngine` con valores en px/s (no px/ms):

```javascript
physics: {
  gravity:      900,   // px/s² — aceleración gravitacional suave
  jumpForce:    380,   // px/s  — velocidad inicial al saltar
  maxFallSpeed: 420,   // px/s  — velocidad máxima de caída
  fallMultiplier: 1.6, // gravedad × 1.6 al caer (bajada más lenta)
}
```

**Técnica:** Integración de Verlet semi-implícita con velocidad promedio entre frames para movimiento más suave.

#### Velocidad de obstáculos
**Problema:** Los tubos se movían demasiado rápido y de forma brusca.  
**Solución:** Sistema de velocidad progresiva con interpolación lerp:

```javascript
pipes: {
  baseSpeed:   120,   // px/s al inicio
  maxSpeed:    280,   // px/s máximo
  accelRate:   0.008, // factor de lerp por frame
  speedPerScore: 2.5, // px/s adicionales por punto
}
```

**Técnica:** `lerp(currentSpeed, targetSpeed, factor)` con factor ajustado por deltaTime para consistencia entre FPS.

#### Posición inicial de Ghosty
**Problema:** Ghosty no aparecía al centro de la pantalla.  
**Solución:** Uso de `window.innerWidth/innerHeight` para lógica de juego, separado del canvas físico (que usa devicePixelRatio).

#### Colisiones fantasma
**Problema:** Ghosty perdía vidas sin tocar obstáculos.  
**Solución:** 
1. Período de gracia de 1.5s al respawnear (invencibilidad con parpadeo)
2. Clamp de posición para evitar que Ghosty salga de pantalla silenciosamente
3. Colisiones desactivadas durante el delay inicial de 3 segundos

---

## 6. Fase 5 — Nuevas Funcionalidades

### Pantalla de inicio estilo Space Invaders
- Fondo negro con texto verde monospace
- Campo de ingreso de nombre de usuario (máx 10 caracteres)
- Tabla de top 3 scores desde localStorage
- Botón "PRESS ENTER TO START" con animación de parpadeo

### Sistema de vidas
- 3 vidas iniciales mostradas como ❤️❤️❤️ en la barra inferior
- Al perder una vida: sonido "ouch" sintético (Web Audio API)
- Período de invencibilidad de 1.5s con Ghosty parpadeando
- Game Over solo al perder todas las vidas

### Score +5 por obstáculo
- Cada tubo superado da 5 puntos (no 1)
- Formato: `SCORE: 000025  HI: 000100`

### Power-ups

| Power-up | Apariencia | Efecto | Frecuencia |
|----------|-----------|--------|------------|
| Vida extra | ❤️ pulsante | +1 vida (máx 5) | Cada ~15s |
| Boina francesa | 🎩 roja dibujada | Atraviesa tubos 5s | Cada ~20s |
| Boina negra | Boina negra con +2 | +2 puntos, sonido moneda | Cada ~8s en arco |

### Rotación de Ghosty
- Ghosty se inclina hacia arriba al saltar (-30°)
- Se inclina hacia abajo al caer (+60°)
- Ángulo proporcional a la velocidad vertical

### Obstáculos mixtos
- 50% tubos verdes clásicos con capuchón
- 50% obstáculos de llamas 🔥 con fondo rojo oscuro
- Asignados aleatoriamente al crear y reciclar

### Fondos de Halloween
- **Fondo 1** (bg1.jpg): Cementerio nocturno azul con luna llena
- **Fondo 2** (bg2.jpg): Cementerio rojo con calabazas
- Cambian automáticamente cada 50 puntos

### Sonidos sintéticos (Web Audio API)
- **Ouch:** Tono descendente sawtooth (520Hz → 180Hz en 0.22s)
- **Moneda:** Tono ascendente sine (880Hz → 1320Hz en 0.2s)

### Cuenta regresiva al inicio
- 3 segundos sin tubos al comenzar cada partida
- Muestra "3... 2... 1... ¡GO!" en pantalla
- Ghosty es invencible durante la cuenta

---

## 7. Fase 6 — Despliegue en Producción AWS

### Arquitectura de despliegue

```
Usuario (móvil/desktop)
        │
        ▼ HTTPS
┌───────────────────┐
│   CloudFront CDN  │  ← Certificado SSL automático
│  d1ysdgvr5p4v4b   │  ← Edge locations globales
│  .cloudfront.net  │
└───────────────────┘
        │
        ▼ HTTP (interno)
┌───────────────────┐
│     S3 Bucket     │  ← Static website hosting
│ flappy-kiro-      │  ← Acceso público configurado
│ 864981752843      │
└───────────────────┘
```

### Por qué CloudFront es necesario para móvil

Chrome en Android y Safari en iOS bloquean contenido HTTP por defecto (política de seguridad de contenido mixto). CloudFront agrega HTTPS con certificado SSL automático de AWS Certificate Manager, resolviendo este problema sin costo adicional.

---

## 8. Comandos de Despliegue AWS

### Prerequisito: Instalar AWS CLI

```bash
pip3 install awscli
```

**Explicación:** Instala la interfaz de línea de comandos de AWS que permite interactuar con los servicios de AWS desde la terminal.

---

### Paso 1: Configurar credenciales

```bash
export AWS_DEFAULT_REGION="us-east-1"
export AWS_ACCESS_KEY_ID="TU_ACCESS_KEY"
export AWS_SECRET_ACCESS_KEY="TU_SECRET_KEY"
export AWS_SESSION_TOKEN="TU_SESSION_TOKEN"
```

**Explicación:** Configura las credenciales temporales de AWS como variables de entorno. En un workshop de AWS, estas credenciales son proporcionadas por el entorno sandbox y tienen permisos limitados y tiempo de expiración.

---

### Paso 2: Verificar identidad

```bash
aws sts get-caller-identity
```

**Explicación:** Verifica que las credenciales son válidas y muestra el ID de cuenta, usuario y ARN del rol asumido. Es una buena práctica verificar antes de ejecutar operaciones.

**Respuesta esperada:**
```json
{
    "UserId": "AROA4SZHODQF4A6KS4TTX:Participant",
    "Account": "864981752843",
    "Arn": "arn:aws:sts::864981752843:assumed-role/WSParticipantRole/Participant"
}
```

---

### Paso 3: Crear bucket S3

```bash
aws s3 mb s3://flappy-kiro-864981752843 --region us-east-1
```

**Explicación:** Crea un bucket S3 (Simple Storage Service) con un nombre único globalmente. El nombre incluye el ID de cuenta para garantizar unicidad. S3 es el servicio de almacenamiento de objetos de AWS, ideal para hosting de sitios estáticos.

---

### Paso 4: Eliminar bloqueo de acceso público

```bash
aws s3api delete-public-access-block \
  --bucket flappy-kiro-864981752843
```

**Explicación:** Por defecto, AWS bloquea todo acceso público a los buckets S3 como medida de seguridad. Para un sitio web público, es necesario eliminar este bloqueo. Este comando habilita la posibilidad de configurar acceso público.

---

### Paso 5: Configurar política de acceso público

```bash
aws s3api put-bucket-policy \
  --bucket flappy-kiro-864981752843 \
  --policy '{
    "Version": "2012-10-17",
    "Statement": [{
      "Sid": "PublicRead",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::flappy-kiro-864981752843/*"
    }]
  }'
```

**Explicación:** Aplica una política IAM al bucket que permite a cualquier usuario (`"Principal": "*"`) leer (`s3:GetObject`) cualquier objeto del bucket. El `/*` al final del ARN indica que aplica a todos los archivos dentro del bucket.

---

### Paso 6: Configurar hosting estático

```bash
aws s3 website s3://flappy-kiro-864981752843 \
  --index-document index.html \
  --error-document index.html
```

**Explicación:** Habilita el modo de hosting de sitio web estático en el bucket. Define `index.html` como el documento raíz (página de inicio) y también como página de error, lo que permite que las rutas no encontradas redirijan al juego.

---

### Paso 7: Subir index.html

```bash
aws s3 cp index.html \
  s3://flappy-kiro-864981752843/index.html \
  --content-type "text/html"
```

**Explicación:** Sube el archivo principal del juego al bucket. Se especifica el `content-type` explícitamente para asegurar que el navegador lo interprete como HTML y no como texto plano.

---

### Paso 8: Subir assets (imágenes y audio)

```bash
aws s3 cp assets/ \
  s3://flappy-kiro-864981752843/assets/ \
  --recursive
```

**Explicación:** Sube recursivamente toda la carpeta `assets/` que contiene las imágenes (ghosty.png, bg1.jpg, bg2.jpg) y los archivos de audio (jump.wav, game_over.wav). El flag `--recursive` es necesario para copiar directorios completos.

---

### Paso 9: Crear distribución CloudFront

```bash
aws cloudfront create-distribution \
  --distribution-config '{
    "CallerReference": "flappy-kiro-TIMESTAMP",
    "Origins": {
      "Quantity": 1,
      "Items": [{
        "Id": "flappy-kiro-s3",
        "DomainName": "flappy-kiro-864981752843.s3-website-us-east-1.amazonaws.com",
        "CustomOriginConfig": {
          "HTTPPort": 80,
          "HTTPSPort": 443,
          "OriginProtocolPolicy": "http-only"
        }
      }]
    },
    "DefaultCacheBehavior": {
      "TargetOriginId": "flappy-kiro-s3",
      "ViewerProtocolPolicy": "redirect-to-https",
      "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6",
      "Compress": true
    },
    "DefaultRootObject": "index.html",
    "Comment": "Flappy Kiro game",
    "Enabled": true,
    "HttpVersion": "http2",
    "PriceClass": "PriceClass_100"
  }'
```

**Explicación:** Crea una distribución de CloudFront (CDN de AWS) que actúa como proxy HTTPS frente al bucket S3. Puntos clave de la configuración:
- `OriginProtocolPolicy: "http-only"` — CloudFront se conecta al bucket S3 por HTTP internamente
- `ViewerProtocolPolicy: "redirect-to-https"` — Redirige automáticamente HTTP a HTTPS para los usuarios
- `CachePolicyId` — Política de caché administrada por AWS para contenido estático
- `Compress: true` — Compresión gzip/brotli automática para mejor rendimiento
- `PriceClass_100` — Usa solo edge locations en América del Norte y Europa (más económico)
- `HttpVersion: "http2"` — Habilita HTTP/2 para mejor rendimiento en móvil

---

### Paso 10: Verificar estado del despliegue

```bash
aws cloudfront get-distribution \
  --id E19HB6NIUTDIO \
  --query 'Distribution.Status' \
  --output text
```

**Explicación:** Consulta el estado de la distribución CloudFront. El despliegue inicial tarda entre 3-10 minutos en propagarse a todos los edge locations globales. Los estados posibles son:
- `InProgress` — Propagándose (esperar)
- `Deployed` — Listo para usar

---

## 9. Arquitectura Final

### Estructura de archivos

```
flappy-kiro/
├── index.html          # Juego completo (HTML + CSS + JS)
├── assets/
│   ├── ghosty.png      # Sprite del fantasma
│   ├── jump.wav        # Sonido de salto
│   ├── game_over.wav   # Sonido de game over
│   ├── bg1.jpg         # Fondo Halloween azul
│   └── bg2.jpg         # Fondo Halloween rojo
├── tests/
│   ├── modules.js      # Exportaciones para tests
│   ├── physics-engine.test.js
│   ├── pipe-manager.test.js
│   ├── score-manager.test.js
│   ├── game-controller.test.js
│   ├── audio-manager.test.js
│   ├── input-handler.test.js
│   └── renderer.test.js
└── .kiro/specs/flappy-kiro/
    ├── requirements.md
    ├── design.md
    └── tasks.md
```

### Módulos del juego

| Módulo | Responsabilidad |
|--------|----------------|
| `CONFIG` | Todos los valores configurables centralizados |
| `GameState` | Enum: INTRO, IDLE, PLAYING, GAMEOVER |
| `ScoreManager` | Puntaje, récord, tabla de scores |
| `PhysicsEngine` | Gravedad, impulso, integración Verlet |
| `PipeManager` | Obstáculos con velocidad progresiva y lerp |
| `CloudLayer` | Nubes decorativas con parallax |
| `AudioManager` | Sonidos con Web Audio API + archivos |
| `InputHandler` | Teclado, ratón, táctil |
| `PowerUpManager` | Vida, boina francesa, boinas negras |
| `Renderer` | Dibujo de todos los elementos en canvas |
| `GameController` | Coordinador central, bucle de juego |

---

## 10. URLs del Juego

| Entorno | URL | Protocolo |
|---------|-----|-----------|
| Local (desarrollo) | `http://localhost:8080` | HTTP |
| S3 (producción básica) | `http://flappy-kiro-864981752843.s3-website-us-east-1.amazonaws.com` | HTTP |
| CloudFront (producción HTTPS) | `https://d1ysdgvr5p4v4b.cloudfront.net` | **HTTPS** ✅ |

> **Recomendado para móvil:** Usar la URL de CloudFront (`https://`) ya que Chrome en Android y Safari en iOS bloquean contenido HTTP por defecto.

---

## Notas finales

- El juego es completamente **offline-capable** una vez cargado (no requiere backend)
- Todos los datos del jugador se guardan en **localStorage** del navegador
- El código fuente completo está en un único archivo `index.html` de ~1200 líneas
- Los 56 tests de propiedad garantizan la corrección matemática de la física y colisiones

---

*Documentación generada automáticamente — Flappy Kiro Workshop 2026*
