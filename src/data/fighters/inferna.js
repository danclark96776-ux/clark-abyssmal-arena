export default {
  id: 'inferna',
  name: 'Inferna',
  tagline: 'Crimson Wing',
  emblem: '😈',
  primary: 0x7a1220,
  secondary: 0x2b0a10,
  accent: 0xff4d4d,
  feature: 'wings-demon',
  weapon: null,
  aiStyle: 'rushdown',
  special: {
    name: 'Hellfire Plunge',
    cost: 50,
    dmgScale: 1.8,
    rangeScale: 1.45,
    color: 0xff4d4d,
    effect: 'flare'
  },
  stats: {
    maxHp: 90,
    moveSpeed: 4.0,
    jumpV: 9.6,
    punchDmg: 6,
    kickDmg: 9,
    punchRange: 1.3,
    kickRange: 1.5,
    punchDur: 0.27,
    kickDur: 0.39,
    attackCooldown: 0.11
  },
  lore: 'Inferna was a lesser flame until it learned to fly, and now nothing in the arena moves as freely through the air. ' +
    'It fights in short, blistering bursts — a strike from an angle no one expected, then gone again before retaliation lands.'
};
