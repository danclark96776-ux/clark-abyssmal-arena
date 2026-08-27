export default {
  id: 'grendel',
  name: 'Grendel',
  tagline: 'Bonecrusher',
  emblem: '👹',
  primary: 0x9aa08f,
  secondary: 0x4a4a42,
  accent: 0xff3b1a,
  feature: 'brute',
  weapon: null,
  aiStyle: 'grappler',
  special: {
    name: 'Bone Breaker',
    cost: 50,
    dmgScale: 1.9,
    rangeScale: 1.3,
    color: 0xff3b1a,
    effect: 'shock'
  },
  stats: {
    maxHp: 130,
    moveSpeed: 2.9,
    jumpV: 7.6,
    punchDmg: 9,
    kickDmg: 14,
    punchRange: 1.4,
    kickRange: 1.6,
    punchDur: 0.4,
    kickDur: 0.56,
    attackCooldown: 0.2
  },
  lore: 'Grendel measures its opponents by the sound their bones make. Slow to commit and slower to fall, ' +
    'it absorbs punishment that would end most fights early and answers with blows heavy enough to end them instead. ' +
    'Patience is its only tactic, and it has never needed a second one.'
};
