import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, mergeSettings } from './settings.js';

describe('settings persistence helpers', () => {
  it('merges saved values without replacing defaults for missing keys', () => {
    const merged = mergeSettings(DEFAULT_SETTINGS, {
      uiScale: 1.25,
      keybinds: {
        p1: {
          left: 'KeyZ'
        }
      }
    });

    expect(merged.uiScale).toBe(1.25);
    expect(merged.keybinds.p1.left).toBe('KeyZ');
    expect(merged.keybinds.p2.left).toBe('ArrowLeft');
  });

  it('clamps the saved UI scale to the supported range', () => {
    const merged = mergeSettings(DEFAULT_SETTINGS, { uiScale: 99 });
    expect(merged.uiScale).toBe(1.5);
  });
});
