export default {
  id: 'gorvath',
  name: 'Gorvath',
  tagline: 'The Maw',
  emblem: '🦷',
  primary: 0x8a9482,
  secondary: 0x3d2f22,
  accent: 0x9aff3b,
  feature: 'devourer',
  weapon: null,
  aiStyle: 'grappler',
  special: {
    name: 'Maul the Sky',
    cost: 50,
    dmgScale: 1.9,
    rangeScale: 1.45,
    color: 0x9aff3b,
    effect: 'flare'
  },
  stats: {
    maxHp: 120,
    moveSpeed: 3.1,
    jumpV: 7.8,
    punchDmg: 7,
    kickDmg: 11,
    punchRange: 1.4,
    kickRange: 1.6,
    punchDur: 0.36,
    kickDur: 0.52,
    attackCooldown: 0.18
  },
  lore: 'Gorvath was not born, it was assembled from every creature the Abyss found too dangerous to let roam free — ' +
    'stitched shut by a maw that never stops hungering. It shrugs off wounds that would fell lesser things, ' +
    'grinding forward on sheer mass while its jaws wait for anything careless enough to get close.'
};
