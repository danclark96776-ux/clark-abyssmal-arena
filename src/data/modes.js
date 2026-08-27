export const MODE_DEFINITIONS = {
  quick: {
    label: 'Quick',
    roundTime: 60,
    aiDifficulty: 'normal',
    description: 'Standard one-round arena match.'
  },
  arcade: {
    label: 'Arcade',
    roundTime: 60,
    aiDifficulty: 'normal',
    description: 'Win streaks push the CPU harder.'
  },
  survival: {
    label: 'Survival',
    roundTime: 75,
    aiDifficulty: 'normal',
    description: 'Each cleared round raises the challenge.'
  },
  training: {
    label: 'Training',
    roundTime: 90,
    aiDifficulty: 'easy',
    description: 'Longer round with low-pressure AI.'
  }
};

export function getModeSettings(mode = 'quick') {
  return MODE_DEFINITIONS[mode] || MODE_DEFINITIONS.quick;
}

export function advanceModeProgression(mode = 'quick', wave = 0, p1Won = true) {
  if (mode !== 'arcade' && mode !== 'survival') return wave;
  return p1Won ? Math.max(0, wave + 1) : 0;
}

export function describeModeState(mode = 'quick', wave = 0) {
  const config = getModeSettings(mode);
  if (mode === 'arcade') {
    return 'Arcade Streak ' + String(Math.max(1, wave + 1));
  }
  if (mode === 'survival') {
    return 'Survival Wave ' + String(Math.max(1, wave + 1));
  }
  if (mode === 'training') return 'Training';
  return config.label + ' Match';
}

export function describeModeResult(mode = 'quick', wave = 0, p1Won = true) {
  if (mode === 'arcade') {
    return p1Won ? 'Arcade Streak ' + String(Math.max(1, wave + 1)) : 'Arcade Defeat';
  }
  if (mode === 'survival') {
    return p1Won ? 'Survival Wave ' + String(Math.max(1, wave + 1)) : 'Survival Ended';
  }
  if (mode === 'training') {
    return p1Won ? 'Training Clear' : 'Training Failed';
  }
  return p1Won ? 'Victory' : 'Defeat';
}

export function describeModeIntro(mode = 'quick', wave = 0) {
  if (mode === 'arcade') {
    return 'Arcade Streak ' + String(Math.max(1, wave + 1));
  }
  if (mode === 'survival') {
    return 'Survival Wave ' + String(Math.max(1, wave + 1));
  }
  if (mode === 'training') return 'Training Round';
  return 'Quick Match';
}

export function getAIDifficultyForMode(mode = 'quick', wave = 0) {
  const config = getModeSettings(mode);
  if (mode === 'training') return 'easy';
  if (mode === 'survival') {
    if (wave >= 4) return 'nightmare';
    if (wave >= 2) return 'hard';
    return 'normal';
  }
  if (mode === 'arcade') {
    if (wave >= 4) return 'nightmare';
    if (wave >= 2) return 'hard';
    return config.aiDifficulty;
  }
  return config.aiDifficulty;
}
