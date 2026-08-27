export function resolveDamageCallout(damage, options = {}) {
  const comboCount = Math.max(1, Number(options.comboCount) || 1);
  const blocked = !!options.blocked;
  const special = !!options.special;

  if (blocked) {
    return {
      damage,
      kind: 'block',
      label: 'BLOCK',
      color: 0x7fd4ff,
      scale: 0.82,
      punchy: false
    };
  }

  if (special) {
    return {
      damage,
      kind: 'special',
      label: 'SPECIAL',
      color: 0xffd56a,
      scale: 1 + Math.min(comboCount * 0.08, 0.32),
      punchy: true
    };
  }

  const baseScale = Math.min(1 + (comboCount - 1) * 0.08, 1.32);
  return {
    damage,
    kind: 'hit',
    label: comboCount > 1 ? 'COMBO' : 'HIT',
    color: 0xff8a4c,
    scale: baseScale,
    punchy: true
  };
}

export function resolveMeterState(meter, maxMeter, specialCost) {
  const safeMax = Number.isFinite(maxMeter) && maxMeter > 0 ? maxMeter : 1;
  const safeCost = Number.isFinite(specialCost) && specialCost > 0 ? specialCost : safeMax;
  const value = Number.isFinite(meter) ? meter : 0;
  const ratio = Math.max(0, Math.min(1, value / safeMax));

  if (value >= safeCost) {
    return {
      state: 'ready',
      label: 'SPECIAL READY',
      pulse: 1,
      ratio
    };
  }

  return {
    state: 'charged',
    label: 'METER',
    pulse: Math.max(0.25, ratio),
    ratio
  };
}

