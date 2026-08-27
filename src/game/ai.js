export const AI_DIFFICULTY = {
  easy: { reactionTime: 0.28, aggression: 0.5, blockBias: 0.3, preferPunch: 0.5 },
  normal: { reactionTime: 0.22, aggression: 0.7, blockBias: 0.45, preferPunch: 0.55 },
  hard: { reactionTime: 0.16, aggression: 0.9, blockBias: 0.65, preferPunch: 0.6 },
  nightmare: { reactionTime: 0.12, aggression: 1.1, blockBias: 0.8, preferPunch: 0.66 }
};

export const AI_ARCHETYPES = {
  balanced: { label: 'Balanced', aggression: 1, forwardBias: 0.5, resetBias: 0.35, blockBias: 0.08, spacingBias: 0.35, preferPunch: 0.5 },
  rushdown: { label: 'Rushdown', aggression: 1.28, forwardBias: 0.82, resetBias: 0.62, blockBias: 0.1, spacingBias: 0.24, preferPunch: 0.56 },
  zoner: { label: 'Zoner', aggression: 0.7, forwardBias: 0.28, resetBias: 0.18, blockBias: 0.18, spacingBias: 0.74, preferPunch: 0.48 },
  counter: { label: 'Counter', aggression: 0.9, forwardBias: 0.46, resetBias: 0.8, blockBias: 0.26, spacingBias: 0.42, preferPunch: 0.52 },
  grappler: { label: 'Grappler', aggression: 1.08, forwardBias: 0.68, resetBias: 0.48, blockBias: 0.12, spacingBias: 0.3, preferPunch: 0.49 }
};

export function getAIDifficultyProfile(difficulty = 'normal') {
  return AI_DIFFICULTY[difficulty] || AI_DIFFICULTY.normal;
}

function getMatchupAdjustment(styleName, opponentStyleName) {
  const adjustment = {
    aggression: 0,
    forwardBias: 0,
    resetBias: 0,
    blockBias: 0,
    spacingBias: 0,
    preferPunch: 0
  };

  const matchKey = `${styleName}__${opponentStyleName}`;
  switch (matchKey) {
    case 'rushdown__zoner':
      adjustment.aggression += 0.12;
      adjustment.forwardBias += 0.18;
      adjustment.resetBias += 0.08;
      adjustment.preferPunch += 0.04;
      break;
    case 'zoner__rushdown':
      adjustment.spacingBias += 0.22;
      adjustment.blockBias += 0.08;
      adjustment.forwardBias -= 0.1;
      adjustment.aggression -= 0.05;
      break;
    case 'counter__rushdown':
      adjustment.resetBias += 0.12;
      adjustment.blockBias += 0.1;
      adjustment.spacingBias += 0.06;
      break;
    case 'grappler__zoner':
      adjustment.aggression += 0.06;
      adjustment.forwardBias += 0.1;
      adjustment.blockBias += 0.04;
      break;
    case 'balanced__rushdown':
      adjustment.forwardBias += 0.06;
      adjustment.aggression += 0.06;
      break;
    case 'balanced__zoner':
      adjustment.spacingBias += 0.08;
      adjustment.blockBias += 0.04;
      break;
    default:
      break;
  }

  return adjustment;
}

export function getFighterAIProfile(fighterOrConfig = {}, opponentConfig = {}) {
  const source = typeof fighterOrConfig === 'string' ? { aiStyle: fighterOrConfig } : (fighterOrConfig || {});
  const opponentSource = typeof opponentConfig === 'string' ? { aiStyle: opponentConfig } : (opponentConfig || {});
  const styleName = String(source.aiStyle ?? source.style ?? source.aiProfile ?? 'balanced').toLowerCase();
  const opponentStyleName = String(opponentSource.aiStyle ?? opponentSource.style ?? opponentSource.aiProfile ?? 'balanced').toLowerCase();
  const baseProfile = AI_ARCHETYPES[styleName] || AI_ARCHETYPES.balanced;
  const matchupAdjustment = getMatchupAdjustment(styleName, opponentStyleName);
  const adjustedProfile = { ...baseProfile };

  Object.entries(matchupAdjustment).forEach(function ([key, delta]) {
    if (delta !== 0) adjustedProfile[key] = Number((baseProfile[key] ?? 0) + delta);
  });

  return {
    ...adjustedProfile,
    style: styleName,
    label: baseProfile.label || styleName.charAt(0).toUpperCase() + styleName.slice(1)
  };
}

export function getFighterAIStyleLabel(fighterOrConfig = {}, opponentConfig = {}) {
  return getFighterAIProfile(fighterOrConfig, opponentConfig).label;
}

export function aiThink(fighter, opponent, dt, difficulty = 'normal') {
  fighter.aiTimer -= dt;
  const intent = fighter.aiIntent;
  const profile = getAIDifficultyProfile(difficulty);
  const styleProfile = getFighterAIProfile(fighter, opponent);
  const dx = opponent.x - fighter.x;
  const dist = Math.abs(dx);
  const forwardBias = styleProfile.forwardBias ?? 0.5;
  const resetBias = styleProfile.resetBias ?? 0.35;
  const spacingBias = styleProfile.spacingBias ?? 0.35;

  if (fighter.aiTimer <= 0) {
    fighter.aiTimer = profile.reactionTime + Math.random() * (0.18 + (1 - profile.aggression) * 0.14);
    intent.left = false;
    intent.right = false;
    intent.jump = false;
    intent.block = false;
    intent.punch = false;
    intent.kick = false;
    intent.special = false;

    if (fighter.state !== 'idle' && fighter.state !== 'walk') {
      return;
    }

    const attackingState = opponent && ['punch', 'kick', 'special'].includes(opponent.state);
    const blockingOpponent = opponent && opponent.state === 'block';
    const healthRatio = fighter.hp / Math.max(1, fighter.stats.maxHp || fighter.hp || 1);
    const lowHealth = healthRatio <= 0.32;
    const meterReady = fighter.meter >= fighter.stats.specialCost;

    if (attackingState) {
      const attackRange = opponent.state === 'special'
        ? (opponent.stats?.kickRange ?? 1.55) * 1.25
        : (opponent.state === 'kick' ? (opponent.stats?.kickRange ?? 1.55) : (opponent.stats?.punchRange ?? 1.3));
      const closeThreat = dist <= attackRange * 0.7 + 0.2;
      const adjustedBlockBias = profile.blockBias + (styleProfile.blockBias ?? 0) + spacingBias * 0.08;
      const timelyBlock = dist <= attackRange + 0.45 && (closeThreat || Math.random() < adjustedBlockBias + (dist < 1.2 ? 0.18 : 0.05));
      if (lowHealth && dist <= attackRange + 0.3) {
        if (Math.random() < 0.35 + profile.aggression * 0.1 + resetBias * 0.2) {
          if (dx > 0) intent.left = true; else intent.right = true;
        }
        if (Math.random() < 0.35 + profile.aggression * 0.1 + forwardBias * 0.18) intent.jump = true;
        return;
      }
      if (timelyBlock) {
        intent.block = true;
        return;
      }
    }

    if (blockingOpponent && meterReady && dist <= (fighter.stats.kickRange ?? 1.55) + 0.5) {
      const punishChance = 0.24 + profile.aggression * 0.22 + (forwardBias - 0.5) * 0.2 + (styleProfile.blockBias ?? 0) * 0.18;
      if (Math.random() < Math.min(0.95, punishChance)) {
        intent.special = true;
        return;
      }
    }

    if (lowHealth && meterReady && dist <= (fighter.stats.kickRange ?? 1.55) + 0.45) {
      const desperationChance = 0.18 + profile.aggression * 0.18 + (1 - healthRatio) * 0.55 + (forwardBias - 0.5) * 0.18;
      if (Math.random() < Math.min(0.9, desperationChance)) {
        intent.special = true;
        return;
      }
    }

    const attackBias = Math.random() < (profile.preferPunch + (styleProfile.preferPunch ?? 0.5) * 0.12) ? 'punch' : 'kick';
    if (meterReady && dist < fighter.stats.kickRange + 0.35 && Math.random() < 0.12 + profile.aggression * 0.08 + (forwardBias - 0.5) * 0.18) {
      intent.special = true;
      return;
    }
    if (dist > fighter.stats.kickRange + 0.4) {
      const pressForward = Math.random() < 0.52 + forwardBias * 0.4;
      if (pressForward) {
        if (dx > 0) intent.right = true; else intent.left = true;
      } else if (dx > 0) {
        intent.left = true;
      } else {
        intent.right = true;
      }
      if (Math.random() < 0.06 + profile.aggression * 0.04 + forwardBias * 0.08) intent.jump = true;
    } else if (dist < 0.7) {
      const retreating = Math.random() < 0.18 + (1 - forwardBias) * 0.18 + profile.aggression * 0.06;
      if (retreating) {
        if (dx > 0) intent.left = true; else intent.right = true;
      } else if (Math.random() < 0.28 + profile.aggression * 0.18 + forwardBias * 0.12) {
        if (attackBias === 'punch') intent.punch = true; else intent.kick = true;
      }
    } else {
      const r = Math.random();
      if (r < 0.38 + profile.aggression * 0.22 + forwardBias * 0.12) intent.punch = true;
      else if (r < 0.66 + profile.aggression * 0.18 + (1 - forwardBias) * 0.12) intent.kick = true;
      else if (r < 0.82 + profile.blockBias * 0.18 + (styleProfile.blockBias ?? 0.08) * 0.5) intent.block = true;
      else if (Math.random() < forwardBias) {
        if (dx > 0) intent.right = true; else intent.left = true;
      } else if (dx > 0) {
        intent.left = true;
      } else {
        intent.right = true;
      }
    }
  }
}

