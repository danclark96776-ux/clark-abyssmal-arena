export default {
  id: 'frostqueen',
  name: 'Frostqueen',
  tagline: "Winter's Edge",
  emblem: '❄',
  primary: 0xdfe9f2,
  secondary: 0x2c3e50,
  accent: 0x8ecbff,
  feature: 'crown',
  weapon: 'greatsword-ice',
  aiStyle: 'counter',
  special: {
    name: 'Frost Nova',
    cost: 50,
    dmgScale: 1.8,
    rangeScale: 1.4,
    color: 0x8ecbff,
    effect: 'frost'
  },
  stats: {
    maxHp: 102,
    moveSpeed: 3.3,
    jumpV: 8.3,
    punchDmg: 8,
    kickDmg: 12,
    punchRange: 1.5,
    kickRange: 1.7,
    punchDur: 0.36,
    kickDur: 0.5,
    attackCooldown: 0.17
  },
  lore: 'She ruled a court that froze the moment she took the crown, and she has never once looked back on the thaw ' +
    'she left behind. Frostqueen fights the way winter arrives — unhurried, absolute, and impossible to argue with ' +
    'once her ice-forged greatsword is already swinging.'
};
