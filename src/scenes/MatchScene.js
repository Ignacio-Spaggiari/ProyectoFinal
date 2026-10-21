import Phaser from 'phaser';
import {
  GOAL,
  GOAL_LINE_Y,
  BALL_SPOT,
  KICKER_START,
  KICK_POS,
  KEEPER_SCALE,
  KICKER_SCALE,
  AIM,
  DIFFICULTIES,
  POWER,
  CPU,
  ZONE_KEYS,
  ZONE_LABELS,
} from '../config.js';
import { Shootout } from '../logic/Shootout.js';
import {
  classifyPoint,
  zoneOf,
  zoneColRow,
  zoneRect,
  isSaved,
  chooseKeeperZone,
  pickCpuShot,
  pickHintSide,
} from '../logic/penalty.js';
import { addMuteButton } from '../ui/MuteButton.js';
import { textStyle, playSfx, goTo } from '../ui/theme.js';

const KEEPER_HOME = { x: 480, y: GOAL_LINE_Y };

// Onda triangular 0 -> 1 -> 0 con período 1
const triangle = (t) => {
  const f = t - Math.floor(t);
  return f < 0.5 ? f * 2 : 2 - f * 2;
};

// Posición de ida y vuelta entre min y max a velocidad constante (px/s)
const sweep = (elapsedMs, speed, min, max) => {
  const range = max - min;
  const d = ((elapsedMs / 1000) * speed) % (2 * range);
  return min + (d <= range ? d : 2 * range - d);
};

/** Escena del partido: tanda de penales y muerte súbita. */
export class MatchScene extends Phaser.Scene {
  constructor() {
    super('Match');
  }

  create() {
    this.diff = DIFFICULTIES[this.registry.get('difficulty')] || DIFFICULTIES.normal;
    this.shootout = new Shootout();
    this.phase = 'intro';
    this.suddenDeathAnnounced = false;
    this.pauseLocked = false;

    this.createField();
    this.createHud();
    this.createZones();
    this.setupInput();
    this.setupAudio();

    this.cameras.main.fadeIn(300, 0, 0, 0);
    this.resetActors('player');
    this.time.delayedCall(350, () => {
      playSfx(this, 'whistle', { volume: 0.6 });
      this.showBanner('¡A LOS PENALES!', '#ffffff', 900);
    });
    this.time.delayedCall(1500, () => this.nextTurn());
  }

  // ---------------------------------------------------------------- escena

  createField() {
    this.add.image(0, 0, 'stadium').setOrigin(0);
    ['PENALTY LOCK', '4REAL STUDIOS', 'PHASER 3', 'PENALTY LOCK', '4REAL STUDIOS', '¡VAMOS!'].forEach((t, i) => {
      this.add.text(i * 160 + 80, 249, t, textStyle(13, '#ffffff')).setOrigin(0.5).setAlpha(0.9);
    });

    this.goal = this.add.image(GOAL.x, GOAL.y, 'goal').setOrigin(0).setDepth(2);
    this.keeper = this.add.sprite(KEEPER_HOME.x, KEEPER_HOME.y, 'keeper_cpu', 'idle').setOrigin(0.5, 1).setDepth(3);
    this.shadow = this.add.ellipse(BALL_SPOT.x, BALL_SPOT.y + 13, 28, 8, 0x000000, 0.35).setDepth(4);
    this.ball = this.add.image(BALL_SPOT.x, BALL_SPOT.y, 'ball').setDepth(5);
    this.kicker = this.add.sprite(KICKER_START.x, KICKER_START.y, 'kicker_player', 'idle').setOrigin(0.5, 1).setDepth(6);

    this.crosshair = this.add.image(0, 0, 'crosshair').setDepth(8).setVisible(false);
    this.tweens.add({ targets: this.crosshair, alpha: 0.35, duration: 180, yoyo: true, repeat: -1 });
    this.aimGuide = this.add.graphics().setDepth(7);

    this.confetti = this.add
      .particles(0, 0, 'confetti', {
        speed: { min: 150, max: 380 },
        angle: { min: 200, max: 340 },
        gravityY: 500,
        lifespan: 1600,
        rotate: { min: 0, max: 360 },
        tint: [0xffd23f, 0x22c55e, 0x3b82f6, 0xef4444, 0xffffff],
        emitting: false,
      })
      .setDepth(25);
  }

  createHud() {
    const panel = this.add.graphics().setDepth(10);
    panel.fillStyle(0x0b1220, 0.85);
    panel.fillRoundedRect(300, 6, 360, 74, 12);
    panel.lineStyle(2, 0xffffff, 0.25);
    panel.strokeRoundedRect(300, 6, 360, 74, 12);

    this.add.text(385, 26, 'JUGADOR', textStyle(17, '#93c5fd')).setOrigin(0.5).setDepth(11);
    this.add.text(575, 26, 'CPU', textStyle(17, '#fca5a5')).setOrigin(0.5).setDepth(11);
    this.scoreText = this.add.text(480, 27, '0 – 0', textStyle(28, '#ffd23f')).setOrigin(0.5).setDepth(11);

    this.indicators = { player: [], cpu: [] };
    for (let i = 0; i < 5; i++) {
      this.indicators.player.push(this.add.image(341 + i * 22, 58, 'ind_pending').setDepth(11));
      this.indicators.cpu.push(this.add.image(531 + i * 22, 58, 'ind_pending').setDepth(11));
    }
    this.suddenDeathText = this.add
      .text(480, 92, 'MUERTE SÚBITA', textStyle(14, '#f87171', { stroke: '#000', strokeThickness: 4 }))
      .setOrigin(0.5)
      .setDepth(11)
      .setVisible(false);

    this.turnText = this.add
      .text(944, 14, '', textStyle(22, '#ffffff', { stroke: '#000', strokeThickness: 5 }))
      .setOrigin(1, 0)
      .setDepth(11);
    this.add
      .text(944, 46, `Dificultad: ${this.diff.label}`, textStyle(13, '#ffffff', { stroke: '#000', strokeThickness: 4 }))
      .setOrigin(1, 0)
      .setDepth(11);

    // Abajo a la derecha, para no tapar al pateador
    this.infoText = this.add
      .text(730, 492, '', {
        ...textStyle(15, '#ffffff'),
        backgroundColor: 'rgba(0,0,0,0.55)',
        padding: { x: 12, y: 6 },
      })
      .setOrigin(0.5)
      .setDepth(11)
      .setVisible(false);

    // Barra de potencia (abajo)
    this.powerLabel = this.add.text(40, 470, 'POTENCIA', textStyle(14, '#ffffff')).setDepth(11).setVisible(false);
    this.powerBar = this.add.graphics().setDepth(11);

    // Tiempo de reacción al atajar
    this.timerBar = this.add.graphics().setDepth(11);

    const pauseBtn = this.add.image(28, 28, 'icon_pause').setDepth(60).setInteractive({ useHandCursor: true });
    pauseBtn.on('pointerdown', () => this.openPause());
    addMuteButton(this, 68, 28);
  }

  createZones() {
    this.zones = [];
    for (let z = 1; z <= 6; z++) {
      const r = zoneRect(z);
      const rect = this.add
        .rectangle(r.x + r.w / 2, r.y + r.h / 2, r.w - 6, r.h - 6, 0xffffff, 0.06)
        .setStrokeStyle(2, 0xffffff, 0.35)
        .setDepth(7)
        .setVisible(false)
        .setInteractive({ useHandCursor: true });
      const label = this.add
        .text(r.x + r.w / 2, r.y + r.h / 2, ZONE_LABELS[z - 1], textStyle(26, '#ffffff'))
        .setOrigin(0.5)
        .setAlpha(0.45)
        .setDepth(7)
        .setVisible(false);
      rect.on('pointerdown', () => this.pickZone(z));
      rect.on('pointerover', () => this.phase === 'react' && !this.pickedZone && rect.setFillStyle(0xffffff, 0.2));
      rect.on('pointerout', () => this.pickedZone !== z && rect.setFillStyle(0xffffff, 0.06));
      this.zones.push({ rect, label });
    }
  }

  setupInput() {
    const kb = this.input.keyboard;
    kb.addCapture('SPACE');
    kb.on('keydown-SPACE', () => this.onAction());
    kb.on('keydown-ESC', () => this.openPause());
    kb.on('keydown', (event) => {
      const zone = ZONE_KEYS[event.key.toLowerCase()];
      if (zone) this.pickZone(zone);
    });
    this.input.on('pointerdown', (pointer, over) => {
      if (pointer.button !== 0 || over.length > 0) return;
      this.onAction();
    });
  }

  setupAudio() {
    this.crowd = this.cache.audio.exists('crowd') ? this.sound.add('crowd', { loop: true, volume: 0.35 }) : null;
    if (this.crowd) this.crowd.play();

    const onPause = () => this.crowd && this.crowd.pause();
    const onResume = () => {
      if (this.crowd) this.crowd.resume();
      // Evita que el mismo ESC que cerró la pausa la vuelva a abrir
      this.pauseLocked = true;
      this.time.delayedCall(200, () => {
        this.pauseLocked = false;
      });
    };
    this.events.on('pause', onPause);
    this.events.on('resume', onResume);
    this.events.once('shutdown', () => {
      this.events.off('pause', onPause);
      this.events.off('resume', onResume);
      if (this.crowd) {
        this.crowd.stop();
        this.crowd.destroy();
      }
    });
  }

  openPause() {
    if (this.pauseLocked || this.phase === 'over' || this.__leaving) return;
    this.scene.launch('Pause');
    this.scene.pause();
  }

  // ---------------------------------------------------------------- flujo de la tanda

  nextTurn() {
    const winner = this.shootout.winner();
    if (winner) {
      this.endMatch(winner);
      return;
    }

    if (this.shootout.isSuddenDeath()) {
      this.suddenDeathText.setVisible(true);
      if (!this.suddenDeathAnnounced) {
        this.suddenDeathAnnounced = true;
        this.updateHud();
        playSfx(this, 'whistle', { volume: 0.6 });
        this.showBanner('MUERTE SÚBITA', '#f87171', 1100);
        this.time.delayedCall(1700, () => this.startTurn());
        return;
      }
    }
    this.startTurn();
  }

  startTurn() {
    this.updateHud();
    if (this.shootout.nextShooter() === 'player') this.startPlayerKick();
    else this.startCpuKick();
  }

  endMatch(winner) {
    this.phase = 'over';
    this.setInfo('');
    playSfx(this, 'whistle', { volume: 0.6 });
    this.showBanner(winner === 'player' ? '¡GANASTE!' : 'FIN DE LA TANDA', winner === 'player' ? '#ffd23f' : '#f87171', 1200);
    const data = {
      player: this.shootout.playerGoals,
      cpu: this.shootout.cpuGoals,
      suddenDeath: this.shootout.player.length > this.shootout.regulation,
      difficulty: this.diff.label,
    };
    this.time.delayedCall(1700, () => goTo(this, winner === 'player' ? 'Victory' : 'Defeat', data));
  }

  resetActors(shooter) {
    this.tweens.killTweensOf([this.ball, this.shadow, this.keeper, this.kicker, this.goal]);
    this.ball.setPosition(BALL_SPOT.x, BALL_SPOT.y).setScale(1).setAngle(0).setAlpha(1);
    this.shadow.setPosition(BALL_SPOT.x, BALL_SPOT.y + 13).setScale(1).setAlpha(1);
    this.goal.setPosition(GOAL.x, GOAL.y);

    const mine = shooter === 'player';
    this.kicker
      .setTexture(mine ? 'kicker_player' : 'kicker_cpu', 'idle')
      .setPosition(KICKER_START.x, KICKER_START.y)
      .setRotation(0)
      .setScale(KICKER_SCALE);
    this.keeper
      .setTexture(mine ? 'keeper_cpu' : 'keeper_player', 'idle')
      .setPosition(KEEPER_HOME.x, KEEPER_HOME.y)
      .setRotation(0)
      .setScale(KEEPER_SCALE);
  }

  // ---------------------------------------------------------------- turno del jugador (patear)

  startPlayerKick() {
    this.resetActors('player');
    this.turnText.setText('¡Pateás vos!').setColor('#93c5fd');
    this.aimElapsed = 0;
    this.aimX = (AIM.minX + AIM.maxX) / 2;
    this.aimY = AIM.midY;
    this.power = 0;
    this.crosshair.setVisible(true).setPosition(this.aimX, this.aimY);
    this.phase = 'aimX';
    this.setInfo('Clic o ESPACIO para fijar la DIRECCIÓN');
  }

  onAction() {
    if (this.phase === 'aimX') {
      this.phase = 'aimY';
      this.aimElapsed = 0;
      this.setInfo('Clic o ESPACIO para fijar la ALTURA');
    } else if (this.phase === 'aimY') {
      this.phase = 'power';
      this.powerElapsed = 0;
      this.powerLabel.setVisible(true);
      this.setInfo('Clic o ESPACIO para fijar la POTENCIA');
    } else if (this.phase === 'power') {
      this.playerShoot();
    }
  }

  playerShoot() {
    this.phase = 'shooting';
    this.setInfo('');
    const power = this.power;
    let tx = this.aimX;
    let ty = this.aimY;
    if (power >= POWER.strong) {
      tx += Phaser.Math.Between(-POWER.maxDeviation, POWER.maxDeviation);
      ty += Phaser.Math.Between(-POWER.maxDeviation, POWER.maxDeviation);
    }
    ty = Math.min(ty, GOAL_LINE_Y - 6);

    const where = classifyPoint(tx, ty);
    const shotZone = where === 'in' ? zoneOf(tx, ty) : null;
    const keeperZone = chooseKeeperZone(shotZone, this.diff.guess);

    let result;
    if (where === 'post') result = 'palo';
    else if (where === 'out') result = 'afuera';
    else result = isSaved(shotZone, keeperZone, power < POWER.weak) ? 'atajado' : 'gol';

    this.runUp(450, 0, () => {
      this.crosshair.setVisible(false);
      this.aimGuide.clear();
      const dur = 720 - 380 * power;
      this.diveKeeper(keeperZone, dur * 0.75);
      this.flyBall(tx, ty, dur);
      this.time.delayedCall(dur, () => this.resolvePenalty('player', result, tx, ty));
    });
  }

  // ---------------------------------------------------------------- turno de la CPU (atajar)

  startCpuKick() {
    this.resetActors('cpu');
    this.turnText.setText('¡Atajala!').setColor('#fca5a5');
    this.phase = 'runup';
    this.pickedZone = null;
    this.cpuShot = pickCpuShot();
    this.showZones(true, 0.5);
    this.setInfo('Mirá al pateador... ¡preparate!');

    // Pista: inclinación del cuerpo durante la carrera (acierta el 60 %)
    const hint = pickHintSide(this.cpuShot.side);
    const lean = [-0.2, 0, 0.2][hint];

    this.time.delayedCall(450, () => {
      this.runUp(CPU.runUpMs, lean, () => this.cpuKickContact());
    });
  }

  cpuKickContact() {
    this.phase = 'react';
    this.reactElapsed = 0;
    this.showZones(true, 1);
    this.setInfo('¡ELEGÍ ZONA!  Q W E / A S D  o clic');
    this.flyBall(this.cpuShot.tx, this.cpuShot.ty, this.diff.reactionMs);
    this.time.delayedCall(this.diff.reactionMs, () => this.resolveCpuKick());
  }

  pickZone(zone) {
    if (this.phase !== 'react' || this.pickedZone) return;
    this.pickedZone = zone;
    this.zones.forEach(({ rect }, i) => rect.setFillStyle(i + 1 === zone ? 0x22c55e : 0xffffff, i + 1 === zone ? 0.3 : 0.06));
    this.diveKeeper(zone, 230);
  }

  resolveCpuKick() {
    this.phase = 'resolving';
    this.timerBar.clear();
    this.showZones(false);
    const keeperZone = this.pickedZone || 5; // si no eligió, queda en el centro
    const s = this.cpuShot;

    let result;
    if (s.where === 'post') result = 'palo';
    else if (s.where === 'out') result = 'afuera';
    else result = isSaved(s.zone, keeperZone, s.power < POWER.weak) ? 'atajado' : 'gol';

    this.resolvePenalty('cpu', result, s.tx, s.ty);
  }

  // ---------------------------------------------------------------- animaciones

  /** Carrera del pateador hasta la pelota; onContact se llama al patear. */
  runUp(duration, lean, onContact) {
    const k = this.kicker;
    k.setFrame('run');
    const steps = this.time.addEvent({
      delay: 110,
      loop: true,
      callback: () => k.setFrame(k.frame.name === 'run' ? 'idle' : 'run'),
    });
    this.tweens.add({ targets: k, rotation: lean, duration: duration * 0.6, ease: 'Sine.easeOut' });
    this.tweens.add({
      targets: k,
      x: KICK_POS.x,
      y: KICK_POS.y,
      duration,
      ease: 'Sine.easeIn',
      onComplete: () => {
        steps.remove();
        k.setFrame('kick');
        playSfx(this, 'kick');
        onContact();
      },
    });
  }

  flyBall(tx, ty, duration) {
    this.tweens.add({ targets: this.ball, x: tx, y: ty, scale: 0.5, duration, ease: 'Sine.easeOut' });
    this.tweens.add({ targets: this.ball, angle: 540, duration });
    this.tweens.add({
      targets: this.shadow,
      x: tx,
      y: GOAL_LINE_Y + 3,
      scaleX: 0.5,
      scaleY: 0.5,
      alpha: 0.5,
      duration,
      ease: 'Sine.easeOut',
    });
  }

  /** El arquero se tira hacia la zona elegida. */
  diveKeeper(zone, duration) {
    const { col, row } = zoneColRow(zone);
    const k = this.keeper;
    if (col === 1) {
      if (row === 0) {
        k.setFrame('jump');
        this.tweens.add({ targets: k, y: KEEPER_HOME.y - 42, duration, ease: 'Quad.easeOut' });
      } else {
        this.tweens.add({ targets: k, scaleY: KEEPER_SCALE * 0.92, duration: duration * 0.6, ease: 'Quad.easeOut' });
      }
      return;
    }
    const dir = col === 0 ? -1 : 1;
    k.setFrame(dir < 0 ? 'diveLeft' : 'diveRight');
    this.tweens.add({
      targets: k,
      x: KEEPER_HOME.x + dir * (row === 0 ? 80 : 50),
      y: row === 0 ? KEEPER_HOME.y - 45 : KEEPER_HOME.y,
      rotation: dir * (row === 0 ? 0.7 : 1.3),
      duration,
      ease: 'Quad.easeOut',
    });
  }

  /** Muestra el resultado del penal y actualiza la tanda. */
  resolvePenalty(shooter, result, tx, ty) {
    this.phase = 'resolving';
    this.setInfo('');
    this.shootout.record(shooter, result);
    this.updateHud();

    const mine = shooter === 'player';
    const ball = this.ball;

    if (result === 'gol') {
      playSfx(this, mine ? 'goal' : 'miss', { volume: mine ? 0.9 : 0.6 });
      this.tweens.add({ targets: ball, y: ty + 10, duration: 250, ease: 'Bounce.easeOut' });
      this.tweens.add({ targets: this.goal, y: GOAL.y + 3, duration: 60, yoyo: true, repeat: 3 });
      this.kicker.setFrame('celebrate');
      this.showBanner('¡GOL!', mine ? '#4ade80' : '#f87171');
      if (mine) this.confetti.explode(60, 480, 230);
    } else if (result === 'atajado') {
      playSfx(this, 'save', { volume: 0.8 });
      this.tweens.add({
        targets: ball,
        x: tx + Phaser.Math.Between(-140, 140),
        y: 400,
        scale: 0.8,
        duration: 450,
        ease: 'Quad.easeOut',
      });
      this.kicker.setFrame('lament');
      this.keeper.setFrame('celebrate');
      this.showBanner('¡ATAJADO!', mine ? '#f87171' : '#4ade80');
      if (!mine) this.confetti.explode(40, 480, 230);
    } else if (result === 'palo') {
      playSfx(this, 'post', { volume: 0.8 });
      this.tweens.add({
        targets: ball,
        x: tx + Phaser.Math.Between(-90, 90),
        y: 420,
        scale: 0.85,
        duration: 500,
        ease: 'Quad.easeOut',
      });
      this.kicker.setFrame('lament');
      this.showBanner('¡AL PALO!', '#e5e7eb');
    } else {
      playSfx(this, 'miss', { volume: 0.7 });
      this.tweens.add({
        targets: ball,
        x: tx + (tx - 480) * 0.35,
        y: ty - 40,
        scale: 0.35,
        alpha: 0,
        duration: 350,
      });
      this.kicker.setFrame('lament');
      this.showBanner('¡AFUERA!', '#e5e7eb');
    }

    this.time.delayedCall(1900, () => this.nextTurn());
  }

  showBanner(text, color, hold = 1100) {
    const banner = this.add
      .text(480, 200, text, textStyle(72, color, { stroke: '#0b1220', strokeThickness: 12 }))
      .setOrigin(0.5)
      .setDepth(30)
      .setScale(0);
    this.tweens.add({ targets: banner, scale: 1, duration: 380, ease: 'Back.easeOut' });
    this.tweens.add({
      targets: banner,
      alpha: 0,
      y: 175,
      delay: hold,
      duration: 300,
      onComplete: () => banner.destroy(),
    });
  }

  // ---------------------------------------------------------------- HUD

  setInfo(text) {
    this.infoText.setText(text).setVisible(text !== '');
  }

  showZones(visible, alpha = 1) {
    this.zones.forEach(({ rect, label }) => {
      rect.setVisible(visible).setAlpha(alpha).setFillStyle(0xffffff, 0.06);
      label.setVisible(visible).setAlpha(0.45 * alpha);
    });
  }

  updateHud() {
    this.scoreText.setText(`${this.shootout.playerGoals} – ${this.shootout.cpuGoals}`);
    ['player', 'cpu'].forEach((side) => {
      this.shootout.visibleSlots(side).forEach((r, i) => {
        const key = r === undefined ? 'ind_pending' : r === 'gol' ? 'ind_goal' : 'ind_miss';
        this.indicators[side][i].setTexture(key);
      });
    });
  }

  drawPowerBar() {
    const x = 40;
    const y = 492;
    const w = 260;
    const h = 22;
    const g = this.powerBar;
    g.clear();
    g.fillStyle(0x0b1220, 0.85);
    g.fillRoundedRect(x - 4, y - 4, w + 8, h + 8, 8);
    const color = this.power < POWER.weak ? 0x22c55e : this.power < POWER.strong ? 0xfacc15 : 0xef4444;
    g.fillStyle(color, 1);
    g.fillRoundedRect(x, y, Math.max(6, w * this.power), h, 5);
    g.lineStyle(2, 0xffffff, 0.8);
    g.lineBetween(x + w * POWER.weak, y - 2, x + w * POWER.weak, y + h + 2);
    g.lineBetween(x + w * POWER.strong, y - 2, x + w * POWER.strong, y + h + 2);
  }

  drawAimGuide() {
    const g = this.aimGuide;
    g.clear();
    g.lineStyle(2, 0xff2d2d, 0.5);
    if (this.phase === 'aimX') {
      g.lineBetween(this.aimX, GOAL.y - 20, this.aimX, GOAL_LINE_Y);
    } else {
      g.lineBetween(this.aimX, GOAL.y - 20, this.aimX, GOAL_LINE_Y);
      g.lineStyle(2, 0xffffff, 0.5);
      g.lineBetween(GOAL.x - 20, this.aimY, GOAL.x + GOAL.width + 20, this.aimY);
    }
  }

  drawTimerBar() {
    const g = this.timerBar;
    g.clear();
    const left = Math.max(0, 1 - this.reactElapsed / this.diff.reactionMs);
    g.fillStyle(0x0b1220, 0.8);
    g.fillRoundedRect(330, 330, 300, 12, 6);
    g.fillStyle(left > 0.35 ? 0x22c55e : 0xef4444, 1);
    g.fillRoundedRect(330, 330, 300 * left, 12, 6);
  }

  update(time, delta) {
    switch (this.phase) {
      case 'aimX':
        this.aimElapsed += delta;
        this.aimX = sweep(this.aimElapsed, this.diff.aimSpeed, AIM.minX, AIM.maxX);
        this.crosshair.setPosition(this.aimX, this.aimY);
        this.drawAimGuide();
        break;
      case 'aimY':
        this.aimElapsed += delta;
        // Empieza desde abajo y sube
        this.aimY = AIM.maxY - (sweep(this.aimElapsed, this.diff.aimSpeed * 0.7, AIM.minY, AIM.maxY) - AIM.minY);
        this.crosshair.setPosition(this.aimX, this.aimY);
        this.drawAimGuide();
        break;
      case 'power':
        this.powerElapsed += delta;
        this.power = triangle(this.powerElapsed / POWER.cycleMs);
        this.drawPowerBar();
        break;
      case 'react':
        this.reactElapsed += delta;
        this.drawTimerBar();
        break;
      default:
        break;
    }

    if (this.phase !== 'power' && this.powerLabel.visible && this.phase !== 'shooting') {
      this.powerLabel.setVisible(false);
      this.powerBar.clear();
    }
  }
}
