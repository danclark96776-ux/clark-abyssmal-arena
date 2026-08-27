export default {
  id: 'morvane',
  name: 'Morvane',
  tagline: 'The Masquerade',
  emblem: '🎭',
  primary: 0x0f0e10,
  secondary: 0x5a1420,
  accent: 0x5fd0e8,
  feature: 'tail',
  weapon: null,
  aiStyle: 'rushdown',
  special: {
    name: 'Mirror Nocturne',
    cost: 50,
    dmgScale: 1.75,
    rangeScale: 1.45,
    color: 0x5fd0e8,
    effect: 'shadow'
  },
  stats: {
    maxHp: 88,
    moveSpeed: 4.0,
    jumpV: 9.0,
    punchDmg: 6,
    kickDmg: 9,
    punchRange: 1.2,
    kickRange: 1.4,
    punchDur: 0.27,
    kickDur: 0.4,
    attackCooldown: 0.12
  },
  lore: 'No one has seen Morvane\'s true face, and the mask never slips — not even when the killing starts. ' +
    'A duelist of the Abyssal courts, Morvane trades in misdirection and speed, darting in and out of range before an opponent ' +
    'can commit to a counter. Every performance ends the same way: the mask bows, and someone else does not get up.'
};
