import Phaser from 'phaser';
import { DIFFICULTIES, DIFFICULTY_ORDER } from '../config.js';
import { createButton, MenuNav } from '../ui/Button.js';
import { addMuteButton } from '../ui/MuteButton.js';
import { textStyle, goTo, playSfx, startMusic } from '../ui/theme.js';
import { KITS, getKit, saveKitId } from '../skins.js';
import { KEYS } from '../enums/keys.js';
import { FETCHING, READY } from '../enums/status.js';
import { ES } from '../enums/languages.js';
import { getPhrase, getTranslations } from '../services/translations.js';
import { GAME_LANGUAGES, saveLanguage } from '../language.js';

/** Menú principal: elegir dificultad, elegir equipación, elegir idioma y jugar. */
export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    this.langStatus = READY;

    this.add.image(0, 0, 'stadium').setOrigin(0);
    this.add.rectangle(0, 0, 960, 540, 0x050b1f, 0.55).setOrigin(0);
    this.add.image(240, 110, 'goal').setOrigin(0).setAlpha(0.35);

    const title = this.add
      .text(480, 96, 'PENALTY LOCK', textStyle(76, '#ffd23f', { stroke: '#0b1220', strokeThickness: 12 }))
      .setOrigin(0.5);
    this.tweens.add({ targets: title, scale: 1.04, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.subtitle = this.add.text(480, 160, '', textStyle(18, '#ffffff')).setOrigin(0.5);

    const ball = this.add.image(480, 206, 'ball').setScale(1.3);
    this.tweens.add({ targets: ball, y: 190, duration: 420, yoyo: true, repeat: -1, ease: 'Quad.easeOut' });
    this.tweens.add({ targets: ball, angle: 360, duration: 2000, repeat: -1 });

    const changeDiff = (dir) => {
      const i = DIFFICULTY_ORDER.indexOf(this.registry.get('difficulty'));
      const next = DIFFICULTY_ORDER[(i + dir + DIFFICULTY_ORDER.length) % DIFFICULTY_ORDER.length];
      this.registry.set('difficulty', next);
      this.refreshTexts();
    };

    const size = { width: 380, height: 50 };
    // El torneo siempre empieza en cuartos de final
    const startTournament = () => {
      this.registry.set('stage', 0);
      goTo(this, 'Match');
    };
    this.playBtn = createButton(this, 480, 280, '', startTournament, size);
    this.diffBtn = createButton(this, 480, 350, '', () => changeDiff(1), { ...size, size: 20 });
    this.diffBtn.onLeft = () => {
      playSfx(this, 'click', { volume: 0.6 });
      changeDiff(-1);
    };
    this.diffBtn.onRight = () => {
      playSfx(this, 'click', { volume: 0.6 });
      changeDiff(1);
    };
    // Equipación: clic abre la pantalla de selección; flechas laterales la cambian acá mismo
    const changeKit = (dir) => {
      playSfx(this, 'click', { volume: 0.6 });
      const i = KITS.findIndex((k) => k.id === getKit(this.registry.get('kit')).id);
      const kit = KITS[(i + dir + KITS.length) % KITS.length];
      this.registry.set('kit', kit.id);
      saveKitId(kit.id);
      this.refreshTexts();
    };
    this.kitBtn = createButton(this, 480, 420, '', () => goTo(this, 'Skins'), { ...size, size: 18 });
    this.kitBtn.onLeft = () => changeKit(-1);
    this.kitBtn.onRight = () => changeKit(1);

    // Idioma: solo los códigos (ES / EN), que no se traducen
    this.langBtn = createButton(this, 80, 30, '', () => this.changeLanguage(1), { width: 130, height: 40, size: 18 });
    this.langBtn.onLeft = () => this.changeLanguage(-1);
    this.langBtn.onRight = () => this.changeLanguage(1);

    new MenuNav(this, [this.playBtn, this.diffBtn, this.kitBtn, this.langBtn]);

    this.help = this.add.text(480, 494, '', textStyle(14, '#cbd5e1')).setOrigin(0.5);
    this.add.text(480, 520, '© 4real studios', textStyle(12, '#94a3b8')).setOrigin(0.5);

    this.refreshTexts();

    addMuteButton(this, 930, 30);
    startMusic(this);
    this.cameras.main.fadeIn(300, 0, 0, 0);
  }

  /** Vuelve a resolver con getPhrase(...) todos los textos visibles del menú. */
  refreshTexts() {
    const diff = DIFFICULTIES[this.registry.get('difficulty')];
    const kit = getKit(this.registry.get('kit'));
    this.subtitle.setText(getPhrase(KEYS.APUNTA_CARGA_LA_POTENCIA_Y_ADIVINA_EL_PALO_DEL_RIVAL));
    this.playBtn.setLabel(getPhrase(KEYS.JUGAR_TORNEO));
    this.diffBtn.setLabel(`${getPhrase(KEYS.DIFICULTAD)} ◀ ${getPhrase(diff.label).toUpperCase()} ▶`);
    this.kitBtn.setLabel(`${getPhrase(KEYS.EQUIPACION)}: ◀ ${getPhrase(kit.name).toUpperCase()} ▶`);
    this.langBtn.setLabel(`◀ ${this.registry.get('lang').toUpperCase()} ▶`);
    this.help.setText(getPhrase(KEYS.MOUSE_CLIC_EN_LOS_BOTONES_TECLADO_FLECHAS_ENTER_M_SILENCIAR));
  }

  /** Carga las traducciones del idioma elegido y después actualiza los textos, sin reiniciar la escena. */
  async changeLanguage(dir) {
    if (this.langStatus === FETCHING) return;
    playSfx(this, 'click', { volume: 0.6 });

    const i = GAME_LANGUAGES.indexOf(this.registry.get('lang'));
    const lang = GAME_LANGUAGES[(i + dir + GAME_LANGUAGES.length) % GAME_LANGUAGES.length];
    this.langStatus = FETCHING;
    this.langBtn.setLabel(`◀ ${lang.toUpperCase()} ▶`).setAlpha(0.6);
    try {
      await getTranslations(lang);
      this.registry.set('lang', lang);
      saveLanguage(lang);
    } catch (error) {
      // Sin traducciones se ven las keys (español): el selector lo refleja
      console.warn('No se pudieron cargar las traducciones de Traducila:', error);
      this.registry.set('lang', ES);
      saveLanguage(ES);
    }
    this.langStatus = READY;
    // La escena puede haberse cerrado mientras se esperaba la respuesta
    if (!this.sys.isActive()) return;
    this.langBtn.setAlpha(1);
    this.refreshTexts();
  }
}
