import { describe, expect, it } from 'vitest';
import {
  CFG,
  computeAttackDamage,
  computeComboMultiplier,
  computeMeterGain,
  computeSpecialAttackDamage,
  computeSpecialRange,
  clampMeter,
  resolveStats
} from './config.js';

describe('combat math helpers', () => {
  it('raises damage and meter gain with combo chains', () => {
    expect(computeComboMultiplier(0)).toBe(1);
    expect(computeComboMultiplier(3)).toBeGreaterThan(1);
    expect(computeAttackDamage(12, 3, false)).toBeGreaterThan(12);
    expect(computeMeterGain(18, 3)).toBeGreaterThan(18);
  });

  it('scales special attacks only when meter is available', () => {
    expect(computeSpecialAttackDamage(12, 49, 50)).toBe(12);
    expect(computeSpecialAttackDamage(12, 50, 50)).toBeGreaterThan(12);
    expect(computeSpecialRange(1.5, 50, 50)).toBeGreaterThan(1.5);
  });

  it('accepts fighter-specific special profiles and custom cost scaling', () => {
    const stats = resolveStats({
      stats: { specialCost: 42, specialDmgScale: 1.8, specialRangeScale: 1.35 },
      special: {
        name: 'Frost Nova',
        cost: 42,
        dmgScale: 1.8,
        rangeScale: 1.35,
        color: 0x8ecbff,
        effect: 'frost'
      }
    });
    expect(stats.specialName).toBe('Frost Nova');
    expect(stats.specialCost).toBe(42);
    expect(stats.specialDmgScale).toBeGreaterThan(CFG.SPECIAL_DMG_SCALE);
    expect(stats.specialColor).toBe(0x8ecbff);
    expect(stats.specialEffect).toBe('frost');
  });

  it('caps meter values and preserves a valid minimum floor', () => {
    expect(clampMeter(250, 100)).toBe(100);
    expect(clampMeter(-20, 100)).toBe(0);
    expect(clampMeter(40, 100)).toBe(40);
  });
});
