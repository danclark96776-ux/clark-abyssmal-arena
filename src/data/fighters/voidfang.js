export default {
  id: 'voidfang',
  name: 'Voidfang',
  tagline: 'Chained Beast',
  emblem: '🐺',
  primary: 0x5a1414,
  secondary: 0x1c0808,
  accent: 0x9c9c9c,
  feature: 'beast',
  weapon: null,
  aiStyle: 'rushdown',
  special: {
    name: 'Howl Breaker',
    cost: 50,
    dmgScale: 1.8,
    rangeScale: 1.45,
    color: 0x9c9c9c,
    effect: 'shock'
  },
  stats: {
    maxHp: 95,
    moveSpeed: 4.2,
    jumpV: 8.8,
    punchDmg: 7,
    kickDmg: 10,
    punchRange: 1.3,
    kickRange: 1.5,
    punchDur: 0.28,
    kickDur: 0.4,
    attackCooldown: 0.12
  },
  lore: 'Voidfang was kept chained beneath the arena for a hundred years, fed only enough to keep the rage alive. ' +
    'The chains are gone now, but the instinct to lunge the instant a gap opens never left. ' +
    'It closes distance faster than almost anything else in the pit, and it does not tire of the chase.'
};
