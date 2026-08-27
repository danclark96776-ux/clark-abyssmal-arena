export default {
  id: 'malphas',
  name: 'Malphas',
  tagline: 'Judge of the Abyss',
  emblem: '⚖',
  primary: 0x241b12,
  secondary: 0xc9a24b,
  accent: 0xc9a24b,
  feature: 'horns',
  weapon: 'twinblades',
  aiStyle: 'counter',
  special: {
    name: 'Final Ruling',
    cost: 50,
    dmgScale: 1.75,
    rangeScale: 1.35,
    color: 0xc9a24b,
    effect: 'flare'
  },
  stats: {
    maxHp: 98,
    moveSpeed: 3.8,
    jumpV: 8.7,
    punchDmg: 6,
    kickDmg: 10,
    punchRange: 1.35,
    kickRange: 1.55,
    punchDur: 0.28,
    kickDur: 0.42,
    attackCooldown: 0.12
  },
  lore: 'Malphas presides over the arena as both combatant and verdict, twin blades weighing each opponent\'s worth ' +
    'in the space between heartbeats. Precise rather than powerful, it never wastes a strike — every cut is a ruling, ' +
    'and every ruling is final.'
};
