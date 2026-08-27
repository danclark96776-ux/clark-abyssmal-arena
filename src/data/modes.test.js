import { describe, expect, it } from 'vitest';
import {
  advanceModeProgression,
  describeModeIntro,
  describeModeResult,
  describeModeState,
  getAIDifficultyForMode,
  getModeSettings
} from './modes.js';

describe('mode progression', () => {
  it('gives training a longer round and an easy AI profile', () => {
    const training = getModeSettings('training');
    expect(training.roundTime).toBe(90);
    expect(training.aiDifficulty).toBe('easy');
  });

  it('escalates survival difficulty by wave', () => {
    expect(getAIDifficultyForMode('survival', 0)).toBe('normal');
    expect(getAIDifficultyForMode('survival', 2)).toBe('hard');
    expect(getAIDifficultyForMode('survival', 4)).toBe('nightmare');
  });

  it('advances mode progress after each round result', () => {
    expect(advanceModeProgression('arcade', 0, true)).toBe(1);
    expect(advanceModeProgression('arcade', 2, true)).toBe(3);
    expect(advanceModeProgression('survival', 3, false)).toBe(0);
  });

  it('labels the current mode state for HUD display', () => {
    expect(describeModeState('quick', 0)).toBe('Quick Match');
    expect(describeModeState('arcade', 2)).toBe('Arcade Streak 3');
    expect(describeModeState('survival', 3)).toBe('Survival Wave 4');
    expect(describeModeState('training', 0)).toBe('Training');
  });

  it('shares mode-end labels across match results', () => {
    expect(describeModeResult('arcade', 2, true)).toBe('Arcade Streak 3');
    expect(describeModeResult('survival', 3, false)).toBe('Survival Ended');
    expect(describeModeResult('training', 0, true)).toBe('Training Clear');
  });

  it('announces the round intro for each mode', () => {
    expect(describeModeIntro('arcade', 2)).toBe('Arcade Streak 3');
    expect(describeModeIntro('survival', 3)).toBe('Survival Wave 4');
    expect(describeModeIntro('training', 0)).toBe('Training Round');
  });
});
