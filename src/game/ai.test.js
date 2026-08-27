import { describe, expect, it } from 'vitest';
import { CFG, resolveStats } from '../data/config.js';
import { FIGHTERS } from '../data/fighters/index.js';
import { aiThink, getAIDifficultyProfile, getFighterAIProfile } from './ai.js';

describe('combat tuning and AI difficulty', () => {
  it('exposes combo and meter settings in resolved stats', () => {
    const stats = resolveStats({ stats: { maxHp: 220 } });

    expect(stats.comboWindow).toBe(CFG.COMBO_WINDOW);
    expect(stats.meterGain).toBe(CFG.METER_GAIN_PER_HIT);
    expect(stats.specialCost).toBe(CFG.SPECIAL_COST);
  });

  it('scales AI aggression and reaction time by difficulty', () => {
    const easy = getAIDifficultyProfile('easy');
    const hard = getAIDifficultyProfile('hard');

    expect(easy.reactionTime).toBeGreaterThan(hard.reactionTime);
    expect(hard.aggression).toBeGreaterThan(easy.aggression);
    expect(hard.blockBias).toBeGreaterThan(easy.blockBias);
  });

  it('blocks when the enemy is actively attacking at close range', () => {
    const baseRandom = Math.random;
    Math.random = () => 0.99;

    try {
      const fighter = {
        x: 0,
        y: 0,
        state: 'idle',
        aiTimer: 0,
        aiIntent: { left: false, right: false, jump: false, block: false, punch: false, kick: false, special: false },
        meter: 100,
        hp: 45,
        stats: { kickRange: 1.55, punchRange: 1.3, specialCost: 50, maxHp: 100 }
      };
      const opponent = {
        x: 0.45,
        y: 0,
        state: 'punch',
        facing: 1,
        stats: { kickRange: 1.55, punchRange: 1.3, specialCost: 50, maxHp: 100 }
      };

      aiThink(fighter, opponent, 1, 'hard');

      expect(fighter.aiIntent.block).toBe(true);
    } finally {
      Math.random = baseRandom;
    }
  });

  it('retreats when low on health and threatened at close range', () => {
    const baseRandom = Math.random;
    Math.random = () => 0.2;

    try {
      const fighter = {
        x: 0,
        y: 0,
        state: 'idle',
        aiTimer: 0,
        aiIntent: { left: false, right: false, jump: false, block: false, punch: false, kick: false, special: false },
        meter: 30,
        hp: 25,
        stats: { kickRange: 1.55, punchRange: 1.3, specialCost: 50, maxHp: 100 }
      };
      const opponent = {
        x: 0.72,
        y: 0,
        state: 'kick',
        facing: -1,
        stats: { kickRange: 1.55, punchRange: 1.3, specialCost: 50, maxHp: 100 }
      };

      aiThink(fighter, opponent, 1, 'normal');

      expect(fighter.aiIntent.left).toBe(true);
    } finally {
      Math.random = baseRandom;
    }
  });

  it('uses a desperate special finisher when low on health and meter is ready', () => {
    const baseRandom = Math.random;
    Math.random = () => 0.35;

    try {
      const fighter = {
        x: 0,
        y: 0,
        state: 'idle',
        aiTimer: 0,
        aiIntent: { left: false, right: false, jump: false, block: false, punch: false, kick: false, special: false },
        meter: 100,
        hp: 22,
        stats: { kickRange: 1.55, punchRange: 1.3, specialCost: 50, maxHp: 100 }
      };
      const opponent = {
        x: 0.62,
        y: 0,
        state: 'idle',
        facing: 1,
        stats: { kickRange: 1.55, punchRange: 1.3, specialCost: 50, maxHp: 100 }
      };

      aiThink(fighter, opponent, 1, 'hard');

      expect(fighter.aiIntent.special).toBe(true);
    } finally {
      Math.random = baseRandom;
    }
  });

  it('punishes a blocking opponent with a special when meter is ready', () => {
    const baseRandom = Math.random;
    Math.random = () => 0.3;

    try {
      const fighter = {
        x: 0,
        y: 0,
        state: 'idle',
        aiTimer: 0,
        aiIntent: { left: false, right: false, jump: false, block: false, punch: false, kick: false, special: false },
        meter: 100,
        hp: 80,
        stats: { kickRange: 1.55, punchRange: 1.3, specialCost: 50, maxHp: 100 }
      };
      const opponent = {
        x: 0.58,
        y: 0,
        state: 'block',
        facing: 1,
        stats: { kickRange: 1.55, punchRange: 1.3, specialCost: 50, maxHp: 100 }
      };

      aiThink(fighter, opponent, 1, 'hard');

      expect(fighter.aiIntent.special).toBe(true);
    } finally {
      Math.random = baseRandom;
    }
  });

  it('uses fighter archetypes to bias pressure and spacing', () => {
    const rushdown = getFighterAIProfile({ aiStyle: 'rushdown' });
    const zoner = getFighterAIProfile({ aiStyle: 'zoner' });

    expect(rushdown.aggression).toBeGreaterThan(zoner.aggression);
    expect(rushdown.forwardBias).toBeGreaterThan(zoner.forwardBias);
    expect(rushdown.resetBias).toBeGreaterThan(zoner.resetBias);
  });

  it('adapts AI pressure when archetypes clash in a matchup', () => {
    const rushdown = getFighterAIProfile({ aiStyle: 'rushdown' }, { aiStyle: 'zoner' });
    const zoner = getFighterAIProfile({ aiStyle: 'zoner' }, { aiStyle: 'rushdown' });
    const rushdownBase = getFighterAIProfile({ aiStyle: 'rushdown' });
    const zonerBase = getFighterAIProfile({ aiStyle: 'zoner' });

    expect(rushdown.forwardBias).toBeGreaterThan(rushdownBase.forwardBias);
    expect(rushdown.aggression).toBeGreaterThan(rushdownBase.aggression);
    expect(zoner.spacingBias).toBeGreaterThan(zonerBase.spacingBias);
  });

  it('applies distinct AI archetypes to roster fighters', () => {
    const rushdown = FIGHTERS.find((fighter) => fighter.id === 'velara');
    const zoner = FIGHTERS.find((fighter) => fighter.id === 'seraphine');
    const counter = FIGHTERS.find((fighter) => fighter.id === 'ashborn');

    expect(rushdown.aiStyle).toBe('rushdown');
    expect(zoner.aiStyle).toBe('zoner');
    expect(counter.aiStyle).toBe('counter');
  });

  it('gives each AI style a readable label for roster presentation', () => {
    const rushdown = getFighterAIProfile({ aiStyle: 'rushdown' });
    const zoner = getFighterAIProfile({ aiStyle: 'zoner' });

    expect(rushdown.label).toBe('Rushdown');
    expect(zoner.label).toBe('Zoner');
    expect(FIGHTERS.every((fighter) => fighter.aiStyle && getFighterAIProfile(fighter).label)).toBe(true);
  });
});
