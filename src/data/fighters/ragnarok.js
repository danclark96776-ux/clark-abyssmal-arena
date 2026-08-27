export default {
  id: 'ragnarok',
  name: 'Ragnarok',
  tagline: 'The Wrathful',
  emblem: '🪓',
  primary: 0x2b2b30,
  secondary: 0x3a1414,
  accent: 0xff6a1a,
  gem: 0x39ff6a,
  feature: 'wrath',
  weapon: 'battleaxe',
  aiStyle: 'grappler',
  special: {
    name: 'Blood Oath',
    cost: 50,
    dmgScale: 1.9,
    rangeScale: 1.45,
    color: 0xff7a3c,
    effect: 'flare'
  },
  stats: {
    maxHp: 105,
    moveSpeed: 3.4,
    jumpV: 8.4,
    punchDmg: 8,
    kickDmg: 13,
    punchRange: 1.35,
    kickRange: 1.6,
    punchDur: 0.34,
    kickDur: 0.5,
    attackCooldown: 0.16
  },
  lore: 'Once a jarl who swore vengeance on the gods that abandoned his people to famine, ' +
    'Ragnarok clawed his way out of the frost-choked underworld with a battleaxe forged from his own oath. ' +
    'He fights with a wrath that never cools, trading speed for the certainty that every blow he lands will be remembered.'
};
