// Ícono de parlante + tecla M. El estado de silencio es global (SoundManager del juego).

export function addMuteButton(scene, x, y) {
  const icon = scene.add.image(x, y, 'icon_sound_on').setDepth(60).setInteractive({ useHandCursor: true });

  const refresh = () => icon.setTexture(scene.sound.mute ? 'icon_sound_off' : 'icon_sound_on');
  const toggle = () => {
    scene.sound.mute = !scene.sound.mute;
    scene.game.events.emit('mute-changed');
  };

  icon.on('pointerdown', toggle);
  scene.input.keyboard.on('keydown-M', toggle);
  scene.game.events.on('mute-changed', refresh);
  scene.events.once('shutdown', () => scene.game.events.off('mute-changed', refresh));

  refresh();
  return icon;
}
