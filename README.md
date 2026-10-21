# Penalty Lock

Juego de tanda de penales en 2D hecho con **Phaser 3 + Vite** (JavaScript). El jugador alterna entre patear y atajar contra la CPU: 5 penales por lado, definición anticipada y muerte súbita si hay empate.

## Cómo ejecutarlo

Requiere [Node.js](https://nodejs.org/) 18 o superior.

```bash
npm install
npm run dev
```

Se abre en `http://localhost:5173`. Para generar la versión final: `npm run build` (queda en `dist/`).

## Controles

| Acción | Mouse | Teclado |
| --- | --- | --- |
| Fijar mira / potencia (patear) | Clic izquierdo | ESPACIO |
| Elegir zona para atajar | Clic sobre la zona | Q W E (arriba) / A S D (abajo) |
| Pausa | Botón en pantalla | ESC |
| Navegar menús | Clic en botones | Flechas + ENTER |
| Silenciar audio | Ícono de parlante | M |

## Reglas implementadas (según el GDD)

- Arco dividido en 6 zonas (2 filas × 3 columnas).
- **Patear:** la mira recorre el arco horizontalmente, luego verticalmente, y después se detiene la barra de potencia (ciclo de 1,2 s).
  - Potencia 0–35 %: tiro débil, el arquero lo ataja aunque se tire a la zona vecina.
  - Potencia 35–85 %: tiro normal.
  - Potencia 85–100 %: solo se ataja si el arquero elige la zona exacta, pero se suma un desvío aleatorio de ±20 px (puede ir afuera o al palo).
- **Arquero CPU:** elige zona con pesos (más abajo y al centro) y "lee" el tiro con 15 % / 25 % / 35 % según la dificultad. La velocidad de la mira también depende de la dificultad.
- **Atajar:** el pateador CPU toma carrera (1 s) y su cuerpo se inclina hacia el lado del tiro el 60 % de las veces. Hay una ventana de reacción (0,8 s en Normal) para elegir zona; si no se elige, el arquero queda en el centro. La CPU erra (afuera o palo) el 10 % de las veces.
- **Tanda:** 5 penales por lado alternados, definición anticipada y muerte súbita.

## Estructura

```
src/
  main.js              Configuración de Phaser (960×540, Scale.FIT)
  config.js            Constantes del juego (dificultades, potencia, zonas)
  logic/
    Shootout.js        Marcador, definición anticipada y muerte súbita
    penalty.js         Zonas, palos, atajadas y decisiones de la CPU
  gfx/textures.js      Gráficos generados por código
  audio/synth.js       Sonidos sintetizados con Web Audio
  ui/                  Botones, navegación con teclado y botón de silencio
  skins.js             Equipaciones del jugador (se recuerdan en el navegador)
  scenes/              Boot (carga), Menu, Instructions, Skins, Match, Pause, Victory, Defeat
```

## Créditos y licencias

Todos los gráficos (estadio, arco, pelota, jugadores, trofeo, íconos) y todos los sonidos (hinchada, patada, gol, atajada, palo, silbato, jingles) se **generan por código** dentro del proyecto, por lo que no se usan assets de terceros.

- Música: `src/audio/cancionprincipal.mp3` (canción principal en bucle, aportada por el autor del proyecto).

- Motor: [Phaser 3](https://phaser.io/) — Licencia MIT.
- Herramienta de build: [Vite](https://vitejs.dev/) — Licencia MIT.

Desarrollado por **4real studios**.
