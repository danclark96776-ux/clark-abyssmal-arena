import { describe, expect, it } from 'vitest';
import { resolveDamageCallout, resolveMeterState } from './readability.js';

describe('combat readability helpers', () => {
  it('marks special hits with a bright attack palette and label', () => {
    const meta = resolveDamageCallout(26, { special: true, comboCount: 3 });

    expect(meta.damage).toBe(26);
    expect(meta.kind).toBe('special');
    expect(meta.label).toBe('SPECIAL');
    expect(meta.color).toBe(0xffd56a);
  });

  it('keeps blocked hits readable without inflating their visual weight', () => {
    const meta = resolveDamageCallout(8, { blocked: true, comboCount: 1 });

    expect(meta.kind).toBe('block');
    expect(meta.label).toBe('BLOCK');
    expect(meta.color).toBe(0x7fd4ff);
    expect(meta.scale).toBeLessThan(1);
  });

  it('marks special-ready meter states with a clear pulse signal', () => {
    const ready = resolveMeterState(100, 100, 50);
    const half = resolveMeterState(48, 100, 50);

    expect(ready.state).toBe('ready');
    expect(ready.label).toBe('SPECIAL READY');
    expect(ready.pulse).toBeGreaterThan(0.9);
    expect(half.state).toBe('charged');
  });
});
