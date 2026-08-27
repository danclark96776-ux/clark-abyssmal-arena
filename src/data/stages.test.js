import { describe, expect, it } from 'vitest';
import { getFighterHomeStage, getStageBannerText, getStageThemeForMatch } from './stages.js';

describe('stage presentation', () => {
  it('uses a readable home-stage name for fighter matchups', () => {
    const baseRandom = Math.random;
    Math.random = () => 0.9;

    try {
      const theme = getStageThemeForMatch({ id: 'velara' }, { id: 'seraphine' });

      expect(theme.id).toBe('velara');
      expect(theme.name).toBe('Velara Vault');
    } finally {
      Math.random = baseRandom;
    }
  });

  it('shows a fighter’s home stage in their arena identity', () => {
    const theme = getFighterHomeStage({ id: 'seraphine' });

    expect(theme.id).toBe('seraphine');
    expect(theme.name).toBe('Seraphine Spire');
  });

  it('provides a stage banner that makes the arena legible mid-match', () => {
    const baseRandom = Math.random;
    Math.random = () => 0.9;

    try {
      const banner = getStageBannerText({ id: 'ragnarok' }, { id: 'inferna' });

      expect(banner).toBe('Ragnarok Rift');
    } finally {
      Math.random = baseRandom;
    }
  });
});
