export const CFG = {
  GRAVITY: -24,
  JUMP_V: 8.6,
  MOVE_SPEED: 3.6,
  ARENA_MIN: -4.1,
  ARENA_MAX: 4.1,
  MIN_SEP: 0.95,
  PUNCH_DUR: 0.32,
  KICK_DUR: 0.46,
  PUNCH_ACTIVE: [0.10, 0.18],
  KICK_ACTIVE: [0.17, 0.27],
  PUNCH_RANGE: 1.3,
  KICK_RANGE: 1.55,
  PUNCH_DMG: 6,
  KICK_DMG: 10,
  CHIP_MULT: 0.18,
  HITSTUN: 0.30,
  KNOCKBACK: 2.1,
  ATTACK_COOLDOWN: 0.14,
  COMBO_WINDOW: 0.38,
  METER_GAIN_PER_HIT: 18,
  SPECIAL_COST: 50,
  SPECIAL_DMG_SCALE: 1.5,
  SPECIAL_RANGE_SCALE: 1.25,
  ROUND_TIME: 60,
  MAX_HP: 100,
  MAX_METER: 100
};

// Each fighter's visuals, stats and lore now live in their own file under
// src/data/fighters/ — re-exported here so existing imports of FIGHTERS
// from './config.js' keep working unchanged.
export { FIGHTERS } from './fighters/index.js';

// Resolves a fighter's per-character combat stats, falling back to the
// global defaults above for any stat a fighter file doesn't override.
export function clampMeter(value, maxMeter = CFG.MAX_METER) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(maxMeter, Math.max(0, value));
}

export function computeComboMultiplier(comboCount) {
  const count = Math.max(0, Math.floor(comboCount || 0));
  if (count <= 0) return 1;
  return 1 + count * 0.12;
}

export function computeAttackDamage(baseDamage, comboCount, blocked = false) {
  const dmg = baseDamage * computeComboMultiplier(comboCount);
  if (blocked) return dmg * CFG.CHIP_MULT;
  return dmg;
}

export function computeMeterGain(baseGain, comboCount) {
  return baseGain * computeComboMultiplier(comboCount);
}

export function computeSpecialAttackDamage(baseDamage, meter, requiredMeter = CFG.SPECIAL_COST, dmgScale = CFG.SPECIAL_DMG_SCALE) {
  if (!Number.isFinite(baseDamage) || !Number.isFinite(meter) || !Number.isFinite(requiredMeter) || !Number.isFinite(dmgScale)) return baseDamage;
  if (meter < requiredMeter) return baseDamage;
  return baseDamage * dmgScale;
}

export function computeSpecialRange(baseRange, meter, requiredMeter = CFG.SPECIAL_COST, rangeScale = CFG.SPECIAL_RANGE_SCALE) {
  if (!Number.isFinite(baseRange) || !Number.isFinite(meter) || !Number.isFinite(requiredMeter) || !Number.isFinite(rangeScale)) return baseRange;
  if (meter < requiredMeter) return baseRange;
  return baseRange * rangeScale;
}

export function resolveStats(theme) {
  const s = (theme && theme.stats) || {};
  const special = (theme && theme.special) || {};
  const specialCost = special.cost ?? s.specialCost ?? CFG.SPECIAL_COST;
  const specialDmgScale = special.dmgScale ?? s.specialDmgScale ?? CFG.SPECIAL_DMG_SCALE;
  const specialRangeScale = special.rangeScale ?? s.specialRangeScale ?? CFG.SPECIAL_RANGE_SCALE;
  return {
    maxHp: s.maxHp ?? CFG.MAX_HP,
    moveSpeed: s.moveSpeed ?? CFG.MOVE_SPEED,
    jumpV: s.jumpV ?? CFG.JUMP_V,
    punchDmg: s.punchDmg ?? CFG.PUNCH_DMG,
    kickDmg: s.kickDmg ?? CFG.KICK_DMG,
    punchRange: s.punchRange ?? CFG.PUNCH_RANGE,
    kickRange: s.kickRange ?? CFG.KICK_RANGE,
    punchDur: s.punchDur ?? CFG.PUNCH_DUR,
    kickDur: s.kickDur ?? CFG.KICK_DUR,
    attackCooldown: s.attackCooldown ?? CFG.ATTACK_COOLDOWN,
    comboWindow: s.comboWindow ?? CFG.COMBO_WINDOW,
    meterGain: s.meterGain ?? CFG.METER_GAIN_PER_HIT,
    specialName: special.name ?? 'Abyssal Burst',
    specialCost: specialCost,
    specialDmgScale: specialDmgScale,
    specialRangeScale: specialRangeScale,
    specialColor: special.color ?? 0xffa94d,
    specialEffect: special.effect ?? 'flare',
    maxMeter: s.maxMeter ?? CFG.MAX_METER
  };
}

