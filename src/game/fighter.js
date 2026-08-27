import {
  CFG,
  clampMeter,
  computeAttackDamage,
  computeMeterGain,
  computeSpecialAttackDamage,
  computeSpecialRange,
  resolveStats
} from '../data/config.js';
import { HD_TARGET_HEIGHT, SPRITE_ANIM, SPRITE_ART, getSpriteAnimTextures, getSpriteTexture, hdModels } from '../data/assets.js';

function makeMat(color, glow) {
  return new THREE.MeshStandardMaterial({
    color: color,
    roughness: glow ? 0.35 : 0.6,
    metalness: glow ? 0.15 : 0.3,
    emissive: glow ? color : 0x000000,
    emissiveIntensity: glow ? 0.8 : 0
  });
}

function addFeature(theme, parts, mats) {
  const g = parts.hips;
  switch (theme.feature) {
    case 'wrath': {
      const cloak = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.55), mats.secondaryMat);
      cloak.position.set(-0.18, 0.55, 0);
      cloak.rotation.y = Math.PI / 2;
      g.add(cloak);
      if (parts.shoulderL) {
        const gemColor = theme.gem || 0x39ff6a;
        const gemMat = new THREE.MeshStandardMaterial({
          color: gemColor, emissive: gemColor, emissiveIntensity: 1.1, roughness: 0.25, metalness: 0.1
        });
        const claw = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.22, 5), mats.primaryMat);
        claw.position.set(0, -0.66, 0);
        claw.rotation.z = Math.PI;
        parts.shoulderL.add(claw);
        const gem = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), gemMat);
        gem.position.set(0, -0.42, 0.1);
        parts.shoulderL.add(gem);
        parts.shoulderL.scale.set(1.3, 1.2, 1.3);
      }
      break;
    }
    case 'succubus': {
      for (const side of [-1, 1]) {
        const horn = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.24, 6), mats.secondaryMat);
        horn.position.set(0.02, 1.1, side * 0.1);
        horn.rotation.z = -side * 0.35;
        horn.rotation.x = -0.3;
        g.add(horn);
      }
      const wingR = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 0.05), mats.secondaryMat);
      wingR.position.set(-0.18, 0.76, 0.1);
      wingR.rotation.z = 0.55;
      wingR.rotation.y = 0.3;
      g.add(wingR);
      const tipR = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.42, 4), mats.secondaryMat);
      tipR.position.set(-0.58, 1.0, 0.12);
      tipR.rotation.z = 1.15;
      g.add(tipR);
      const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.38, 0.05), mats.secondaryMat);
      wingL.position.set(-0.16, 0.68, -0.1);
      wingL.rotation.z = -0.45;
      wingL.rotation.y = -0.35;
      g.add(wingL);
      const tipL = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.2, 4), mats.secondaryMat);
      tipL.position.set(-0.4, 0.84, -0.12);
      tipL.rotation.z = -1.0;
      g.add(tipL);
      let prevX = 0, prevY = 0.15;
      for (let i = 0; i < 4; i++) {
        const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.05 - i * 0.008, 0.06 - i * 0.008, 0.24, 6), mats.primaryMat);
        const x = prevX - 0.16 - i * 0.02;
        const y = prevY - i * 0.05;
        seg.position.set(x, y, 0);
        seg.rotation.z = Math.PI / 2 + i * 0.18;
        g.add(seg);
        prevX = x;
        prevY = y;
      }
      const barb = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.16, 4), mats.accentMat);
      barb.position.set(prevX - 0.14, prevY - 0.05, 0);
      barb.rotation.z = Math.PI / 2 + 4 * 0.18;
      g.add(barb);
      break;
    }
    case 'devourer': {
      for (const side of [-1, 1]) {
        const horn = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.13, 5), mats.secondaryMat);
        horn.position.set(0.14, 1.05, side * 0.08);
        horn.rotation.z = -side * 0.4;
        g.add(horn);
      }
      const jawMat = new THREE.MeshStandardMaterial({ color: 0x3a1414, roughness: 0.6 });
      const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.2, 0.08), jawMat);
      mouth.position.set(0.2, 0.4, 0);
      g.add(mouth);
      const glow = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.09, 0.02), mats.accentMat);
      glow.position.set(0.24, 0.4, 0);
      g.add(glow);
      const toothMat = new THREE.MeshStandardMaterial({ color: 0xe8e0c8, roughness: 0.4 });
      for (let i = -3; i <= 3; i++) {
        const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.05, 4), toothMat);
        tooth.position.set(0.24, 0.48, i * 0.045);
        tooth.rotation.x = Math.PI;
        g.add(tooth);
        const toothB = tooth.clone();
        toothB.position.y = 0.32;
        toothB.rotation.x = 0;
        g.add(toothB);
      }
      const tongue = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.02, 0.3, 6),
        new THREE.MeshStandardMaterial({ color: 0xaa3a4a, roughness: 0.5 })
      );
      tongue.position.set(0.36, 0.36, 0);
      tongue.rotation.z = Math.PI / 2;
      g.add(tongue);
      for (const side of [-1, 1]) {
        const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.06, 0.34, 6), mats.primaryMat);
        upper.position.set(0.05, 0.55, side * 0.22);
        upper.rotation.z = side * 0.6;
        g.add(upper);
        const fore = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.3, 6), mats.primaryMat);
        fore.position.set(0.2, 0.4, side * 0.14);
        fore.rotation.z = side * 1.3;
        g.add(fore);
        const hand = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.09), mats.primaryMat);
        hand.position.set(0.3, 0.4, side * 0.07);
        g.add(hand);
      }
      break;
    }
    case 'wings':
    case 'wings-demon': {
      const wingColor = theme.feature === 'wings' ? mats.accentMat : mats.secondaryMat;
      for (const side of [-1, 1]) {
        const wing = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.55, 0.05), wingColor);
        wing.position.set(-0.18, 0.75, side * 0.08);
        wing.rotation.z = side * 0.5;
        wing.rotation.y = side * 0.25;
        g.add(wing);
        const tip = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.4, 4), wingColor);
        tip.position.set(-0.55, 0.98, side * 0.1);
        tip.rotation.z = side * 1.1;
        g.add(tip);
      }
      break;
    }
    case 'horns': {
      for (const side of [-1, 1]) {
        const horn = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.28, 6), mats.accentMat);
        horn.position.set(0.08, 1.08, side * 0.12);
        horn.rotation.z = -side * 0.5;
        g.add(horn);
      }
      break;
    }
    case 'crown': {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.03, 6, 12), mats.accentMat);
      ring.position.set(0, 1.06, 0);
      ring.rotation.x = Math.PI / 2;
      g.add(ring);
      for (let i = 0; i < 5; i++) {
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.14, 4), mats.accentMat);
        const a = (i / 5) * Math.PI * 2;
        spike.position.set(0.19 * Math.cos(a), 1.16, 0.19 * Math.sin(a));
        g.add(spike);
      }
      break;
    }
    case 'cape': {
      const cape = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.95), mats.secondaryMat);
      cape.position.set(-0.16, 0.45, 0);
      cape.rotation.y = Math.PI / 2;
      g.add(cape);
      break;
    }
    case 'tail': {
      let prevX = 0, prevY = 0.15;
      for (let i = 0; i < 4; i++) {
        const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.05 - i * 0.008, 0.06 - i * 0.008, 0.24, 6), mats.secondaryMat);
        const x = prevX - 0.16 - i * 0.02;
        const y = prevY - i * 0.05;
        seg.position.set(x, y, 0);
        seg.rotation.z = Math.PI / 2 + i * 0.15;
        g.add(seg);
        prevX = x;
      }
      break;
    }
    case 'beast': {
      const earL = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 5), mats.secondaryMat);
      earL.position.set(0.06, 1.1, 0.1);
      earL.rotation.z = -0.3;
      g.add(earL);
      const earR = earL.clone();
      earR.position.z = -0.1;
      g.add(earR);
      const snout = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.16), mats.secondaryMat);
      snout.position.set(0.24, 0.86, 0);
      g.add(snout);
      let prevX = 0;
      for (let i = 0; i < 3; i++) {
        const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.22, 6), mats.primaryMat);
        const x = prevX - 0.16 - i * 0.02;
        seg.position.set(x, 0.18 - i * 0.03, 0);
        seg.rotation.z = Math.PI / 2 + i * 0.2;
        g.add(seg);
        prevX = x;
      }
      break;
    }
    case 'brute': {
      for (const side of [-1, 1]) {
        const pad = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.34), mats.secondaryMat);
        pad.position.set(0, 0.72, side * 0.32);
        g.add(pad);
      }
      const maw = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.14, 0.06), mats.accentMat);
      maw.position.set(0.2, 0.42, 0);
      g.add(maw);
      break;
    }
    default:
      break;
  }
}

function addWeapon(theme, rightShoulder, mats) {
  if (!theme.weapon) return;
  const group = new THREE.Group();
  group.position.set(0, -0.64, 0);
  if (theme.weapon === 'greatsword-fire' || theme.weapon === 'greatsword-ice') {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.07, 1.05, 0.03), mats.accentMat);
    blade.position.set(0.15, -0.4, 0);
    blade.rotation.z = -0.25;
    group.add(blade);
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, 0.05), mats.secondaryMat);
    guard.position.set(0.06, 0.06, 0);
    guard.rotation.z = -0.25;
    group.add(guard);
  } else if (theme.weapon === 'spear') {
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.2, 6), mats.secondaryMat);
    shaft.position.set(0.1, -0.4, 0);
    shaft.rotation.z = -0.2;
    group.add(shaft);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.22, 6), mats.accentMat);
    tip.position.set(0.28, 0.15, 0);
    tip.rotation.z = -0.2;
    group.add(tip);
  } else if (theme.weapon === 'twinblades') {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.6, 0.03), mats.accentMat);
    blade.position.set(0.1, -0.3, 0);
    blade.rotation.z = -0.3;
    group.add(blade);
  } else if (theme.weapon === 'battleaxe') {
    const haft = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.0, 6), mats.secondaryMat);
    haft.position.set(0.14, -0.35, 0);
    haft.rotation.z = -0.2;
    group.add(haft);
    const headGeo = new THREE.ConeGeometry(0.28, 0.32, 4);
    const headA = new THREE.Mesh(headGeo, mats.accentMat);
    headA.scale.set(1, 0.55, 0.3);
    headA.position.set(0.32, 0.05, 0);
    headA.rotation.z = Math.PI / 2 - 0.2;
    group.add(headA);
    const headB = headA.clone();
    headB.position.set(0.32, -0.78, 0);
    headB.rotation.z = -Math.PI / 2 + 0.2;
    group.add(headB);
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.16, 4), mats.secondaryMat);
    spike.position.set(0.45, -0.37, 0);
    spike.rotation.z = Math.PI / 2 - 0.2;
    group.add(spike);
  }
  rightShoulder.add(group);
}

function buildFighter(theme) {
  const group = new THREE.Group();
  const primaryMat = makeMat(theme.primary, false);
  const secondaryMat = makeMat(theme.secondary, false);
  const accentMat = makeMat(theme.accent, true);
  const mats = { primaryMat: primaryMat, secondaryMat: secondaryMat, accentMat: accentMat };

  const hips = new THREE.Group();
  hips.position.y = 0.95;
  group.add(hips);

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.3), primaryMat);
  torso.position.set(0, 0.4, 0);
  hips.add(torso);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), secondaryMat);
  head.position.set(0, 0.88, 0);
  hips.add(head);

  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.2), accentMat);
  visor.position.set(0.15, 0.88, 0);
  hips.add(visor);

  function buildLimb(isArm, side) {
    const pivot = new THREE.Group();
    const len = isArm ? 0.6 : 0.85;
    const yBase = isArm ? 0.68 : 0;
    const zOff = isArm ? side * 0.34 : side * 0.15;
    pivot.position.set(0, yBase, zOff);
    const limbMat = isArm ? primaryMat : secondaryMat;
    const limb = new THREE.Mesh(new THREE.BoxGeometry(0.15, len, 0.15), limbMat);
    limb.position.set(0, -len / 2, 0);
    pivot.add(limb);
    const endCap = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.17, 0.17), secondaryMat);
    endCap.position.set(0, -len, 0);
    pivot.add(endCap);
    hips.add(pivot);
    return pivot;
  }

  const shoulderL = buildLimb(true, -1);
  const shoulderR = buildLimb(true, 1);
  const hipL = buildLimb(false, -1);
  const hipR = buildLimb(false, 1);

  addFeature(theme, { hips: hips, shoulderL: shoulderL, shoulderR: shoulderR, hipL: hipL, hipR: hipR }, mats);
  addWeapon(theme, shoulderR, mats);

  const flash = new THREE.Mesh(
    new THREE.PlaneGeometry(0.7, 1.3),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 })
  );
  flash.position.set(0, 0.5, 0.2);
  hips.add(flash);

  return {
    group: group,
    parts: { hips: hips, torso: torso, head: head, shoulderL: shoulderL, shoulderR: shoulderR, hipL: hipL, hipR: hipR, flash: flash }
  };
}

/* ---------- Fighter game object ---------- */

class Fighter {
  constructor(theme, isCPU) {
    this.theme = theme;
    this.isCPU = isCPU;
    this.stats = resolveStats(theme);
    this.comboCount = 0;
    this.comboTimer = 0;
    this.meter = 0;
    this.lastHitAt = 0;
    const hdEntry = hdModels[theme.id];
    if (SPRITE_ANIM[theme.id]) {
      const animInfo = SPRITE_ANIM[theme.id];
      this.group = new THREE.Group();
      this.poseGroup = new THREE.Group();
      const animTex = getSpriteAnimTextures(theme.id);
      const planeH = HD_TARGET_HEIGHT;
      const planeW = planeH * animInfo.aspect;
      const geo = new THREE.PlaneGeometry(planeW, planeH);
      const mat = new THREE.MeshBasicMaterial({
        map: animTex.idle[0],
        transparent: true,
        alphaTest: 0.05,
        depthWrite: false,
        side: THREE.FrontSide
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.y = planeH / 2;
      this.poseGroup.add(mesh);
      this.group.add(this.poseGroup);
      this.parts = null;
      this.isSprite = true;
      this.spriteMesh = mesh;
      this.animTex = animTex;
      this.spriteBaseAspect = animInfo.aspect;
      this.animState = 'idle';
      this.animFrameIdx = 0;
    } else if (SPRITE_ART[theme.id]) {
      const spriteInfo = SPRITE_ART[theme.id];
      this.group = new THREE.Group();
      this.poseGroup = new THREE.Group();
      const tex = getSpriteTexture(theme.id);
      const planeH = HD_TARGET_HEIGHT;
      const planeW = planeH * spriteInfo.aspect;
      const geo = new THREE.PlaneGeometry(planeW, planeH);
      const mat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: !!spriteInfo.transparent,
        alphaTest: spriteInfo.transparent ? 0.05 : 0,
        depthWrite: !spriteInfo.transparent,
        side: THREE.FrontSide
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.y = planeH / 2;
      this.poseGroup.add(mesh);
      this.group.add(this.poseGroup);
      this.parts = null;
      this.isSprite = true;
    } else if (hdEntry && hdEntry.hasRig) {
      this.group = new THREE.Group();
      const clonedRoot = hdEntry.root.clone(true);
      this.group.add(clonedRoot);
      this.poseGroup = null;
      this.parts = {
        torso: clonedRoot.getObjectByName('Torso'),
        head: clonedRoot.getObjectByName('Head'),
        shoulderL: clonedRoot.getObjectByName('LeftArm'),
        shoulderR: clonedRoot.getObjectByName('RightArm'),
        hipL: clonedRoot.getObjectByName('LeftLeg'),
        hipR: clonedRoot.getObjectByName('RightLeg'),
        flash: null
      };
      this.isSprite = false;
    } else if (hdEntry) {
      this.group = new THREE.Group();
      this.poseGroup = new THREE.Group();
      this.poseGroup.add(hdEntry.root.clone(true));
      this.group.add(this.poseGroup);
      this.parts = null;
      this.isSprite = false;
    } else {
      const rig = buildFighter(theme);
      this.group = rig.group;
      this.parts = rig.parts;
      this.poseGroup = null;
      this.isSprite = false;
    }
    this.restRotations = this.parts
      ? Object.fromEntries(Object.entries(this.parts)
        .filter(([, part]) => part && part.rotation)
        .map(([name, part]) => [name, part.rotation.clone()]))
      : null;
    this.reset(0, 1);
  }

  reset(x, facing) {
    this.x = x;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.facing = facing;
    this.hp = this.stats.maxHp;
    this.state = 'idle';
    this.stateTimer = 0;
    this.attackHasHit = false;
    this.cooldown = 0;
    this.grounded = true;
    this.walkPhase = 0;
    this.idleT = Math.random() * 10;
    this.aiTimer = 0;
    this.aiIntent = { left: false, right: false, jump: false, block: false, punch: false, kick: false, special: false };
    this.flashT = 0;
    this.specialGlow = 0;
    this.specialBurstQueued = false;
    this.comboCount = 0;
    this.comboTimer = 0;
    this.meter = 0;
    this.lastHitAt = 0;
    this.resetVisualPose();
    this.syncMesh();
  }

  resetVisualPose() {
    this.group.rotation.set(0, 0, 0);
    this.group.scale.set(1, 1, 1);
    if (this.poseGroup) {
      this.poseGroup.position.set(0, 0, 0);
      this.poseGroup.rotation.set(0, 0, 0);
      this.poseGroup.scale.set(1, 1, 1);
    }
    if (this.restRotations) {
      Object.entries(this.restRotations).forEach(([name, rotation]) => {
        this.parts[name].rotation.copy(rotation);
      });
    }
    if (this.animTex) this._setSpriteFrame('idle', 0);
  }

  canAct() {
    return this.state === 'idle' || this.state === 'walk';
  }

  getAttackDur(kind) {
    if (kind === 'special') {
      const base = Math.max(this.stats.kickDur, this.stats.punchDur) * 1.3;
      return this.animTex ? base * 1.5 : base;
    }
    const base = kind === 'punch' ? this.stats.punchDur : this.stats.kickDur;
    // Sprite-animated fighters get more time to play through their frames —
    // fixes the flicker/"disappearing" look multi-frame attacks had when
    // forced through in the same tight window used by 3D/procedural fighters.
    return this.animTex ? base * 1.6 : base;
  }

  triggerAttack(kind) {
    if (!this.canAct() || !this.grounded || this.cooldown > 0) return;
    if (kind === 'special') {
      if (this.meter < this.stats.specialCost) return;
      this.state = 'special';
      this.stateTimer = 0;
      this.attackHasHit = false;
      this.cooldown = this.getAttackDur('special') + this.stats.attackCooldown;
      this.specialGlow = 1;
      this.specialBurstQueued = true;
      this.flashT = 0.26;
      this.meter = clampMeter(this.meter - this.stats.specialCost, this.stats.maxMeter);
      return;
    }
    this.state = kind;
    this.stateTimer = 0;
    this.attackHasHit = false;
    this.cooldown = this.getAttackDur(kind) + this.stats.attackCooldown;
  }

  registerComboHit(kind, damage, attackerFacing) {
    const now = performance.now() / 1000;
    const comboGap = now - this.lastHitAt;
    if (comboGap <= this.stats.comboWindow) {
      this.comboCount += 1;
    } else {
      this.comboCount = 1;
    }
    this.comboTimer = this.stats.comboWindow;
    this.lastHitAt = now;
    this.meter = clampMeter(this.meter + computeMeterGain(this.stats.meterGain, this.comboCount), this.stats.maxMeter);
    return {
      damage: computeAttackDamage(damage, this.comboCount, false),
      fromFacing: attackerFacing,
      comboLevel: this.comboCount
    };
  }

  applyHit(damage, fromFacing, blocked) {
    const dmg = blocked ? damage * CFG.CHIP_MULT : damage;
    this.hp = Math.max(0, this.hp - dmg);
    this.vx = fromFacing * (blocked ? CFG.KNOCKBACK * 0.4 : CFG.KNOCKBACK);
    this.flashT = 0.18;
    if (!blocked) {
      this.state = 'hit';
      this.stateTimer = 0;
    }
    if (this.hp <= 0) {
      this.state = 'ko';
      this.stateTimer = 0;
    }
  }

  update(dt, opponent, input) {
    if (this.state === 'ko') {
      this.stateTimer += dt;
      const t = Math.min(1, this.stateTimer / 0.4);
      this.group.rotation.z = -this.facing * (Math.PI / 2.1) * t;
      this.y = Math.max(0, this.y);
      this.applyGravity(dt);
      if (this.animTex) {
        const stateKey = this.animTex.ko ? 'ko' : 'idle';
        this._setSpriteFrame(stateKey, 0);
      }
      this.syncMesh();
      return;
    }

    if (this.flashT > 0) this.flashT -= dt;
    this.specialGlow = Math.max(0, this.specialGlow - dt * 1.4);
    if (this.cooldown > 0) this.cooldown -= dt;
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.comboCount = 0;
    }

    const activeInput = input || this.aiIntent;

    // horizontal intent
    let moveDir = 0;
    if (this.canAct() || !this.grounded) {
      if (activeInput.left) moveDir -= 1;
      if (activeInput.right) moveDir += 1;
    }
    this.vx = moveDir * this.stats.moveSpeed;

    // block
    if (this.canAct() && this.grounded && activeInput.block) {
      this.state = 'block';
    } else if (this.state === 'block' && !activeInput.block) {
      this.state = 'idle';
    }

    // jump
    if (this.canAct() && this.grounded && activeInput.jump) {
      this.vy = this.stats.jumpV;
      this.grounded = false;
    }

    // attacks
    if (activeInput.special) this.triggerAttack('special');
    if (activeInput.punch) this.triggerAttack('punch');
    if (activeInput.kick) this.triggerAttack('kick');

    this.applyGravity(dt);

    // integrate
    this.x += this.vx * dt;
    this.x = Math.max(CFG.ARENA_MIN, Math.min(CFG.ARENA_MAX, this.x));

    // separation from opponent
    if (opponent && this.state !== 'hit' && opponent.state !== 'ko' && this.state !== 'ko') {
      const dx = this.x - opponent.x;
      const dist = Math.abs(dx);
      if (dist < CFG.MIN_SEP) {
        const push = (CFG.MIN_SEP - dist) / 2;
        const dir = dx >= 0 ? 1 : -1;
        this.x += dir * push;
        this.x = Math.max(CFG.ARENA_MIN, Math.min(CFG.ARENA_MAX, this.x));
      }
    }

    // auto-face opponent when not mid-action
    if (opponent && (this.state === 'idle' || this.state === 'walk')) {
      this.facing = opponent.x >= this.x ? 1 : -1;
    }

    // state machine / animation timers
    if (this.state === 'punch' || this.state === 'kick' || this.state === 'special') {
      this.stateTimer += dt;
      const isSpecial = this.state === 'special';
      const dur = this.getAttackDur(this.state);
      const activeBase = isSpecial ? [0.12, 0.28] : (this.state === 'punch' ? CFG.PUNCH_ACTIVE : CFG.KICK_ACTIVE);
      const activeScale = dur / (isSpecial ? Math.max(this.stats.kickDur, this.stats.punchDur) * 1.3 : (this.state === 'punch' ? this.stats.punchDur : this.stats.kickDur));
      const active = [activeBase[0] * activeScale, activeBase[1] * activeScale];
      if (!this.attackHasHit && this.stateTimer >= active[0] && this.stateTimer <= active[1] && opponent) {
        const baseRange = isSpecial ? this.stats.kickRange : (this.state === 'punch' ? this.stats.punchRange : this.stats.kickRange);
        const baseDmg = isSpecial ? this.stats.kickDmg : (this.state === 'punch' ? this.stats.punchDmg : this.stats.kickDmg);
        const range = isSpecial ? computeSpecialRange(baseRange, this.meter + this.stats.specialCost, this.stats.specialCost, this.stats.specialRangeScale) : baseRange;
        const dmg = isSpecial ? computeSpecialAttackDamage(baseDmg, this.meter + this.stats.specialCost, this.stats.specialCost, this.stats.specialDmgScale) : baseDmg;
        const dx = opponent.x - this.x;
        const facingRight = this.facing === 1;
        const inFront = facingRight ? dx > -0.1 : dx < 0.1;
        if (inFront && Math.abs(dx) <= range && opponent.state !== 'ko') {
          const blocked = opponent.state === 'block' && ((opponent.facing === 1 && dx < 0) || (opponent.facing === -1 && dx > 0));
          const effectiveDmg = blocked ? dmg * CFG.CHIP_MULT : dmg;
          const comboInfo = this.registerComboHit(this.state, effectiveDmg, this.facing);
          opponent.applyHit(comboInfo.damage, comboInfo.fromFacing, blocked);
          this.attackHasHit = true;
        }
      }
      if (this.stateTimer >= dur) {
        this.state = 'idle';
      }
    } else if (this.state === 'hit') {
      this.stateTimer += dt;
      if (this.stateTimer >= CFG.HITSTUN) this.state = 'idle';
    } else {
      if (!this.grounded) {
        this.state = 'jump';
      } else if (Math.abs(this.vx) > 0.05 && this.state !== 'block') {
        this.state = 'walk';
      } else if (this.state !== 'block') {
        this.state = 'idle';
      }
    }

    this.animate(dt);
    this.syncMesh();
  }

  applyGravity(dt) {
    if (!this.grounded) {
      this.vy += CFG.GRAVITY * dt;
      this.y += this.vy * dt;
      if (this.y <= 0) {
        this.y = 0;
        this.vy = 0;
        this.grounded = true;
      }
    }
  }

  animate(dt) {
    if (this.state === 'ko') return;
    if (!this.parts) { this.animateHD(dt); return; }
    const p = this.parts;
    Object.entries(this.restRotations).forEach(([name, rotation]) => {
      p[name].rotation.copy(rotation);
    });

    if (this.state === 'punch' || this.state === 'kick') {
      const dur = this.state === 'punch' ? this.stats.punchDur : this.stats.kickDur;
      const t = Math.min(1, this.stateTimer / dur);
      let swing;
      if (t < 0.35) swing = -0.5 * (t / 0.35);
      else if (t < 0.6) swing = -0.5 + 1.9 * ((t - 0.35) / 0.25);
      else swing = 1.4 * (1 - (t - 0.6) / 0.4);
      if (this.state === 'punch') {
        p.shoulderR.rotation.z = swing;
        p.shoulderL.rotation.z = -swing * 0.3;
        p.torso.rotation.y = swing * 0.15;
      } else {
        p.hipR.rotation.z = swing * 0.9;
        p.torso.rotation.x = -swing * 0.1;
      }
    } else if (this.state === 'special') {
      const dur = this.getAttackDur('special');
      const t = Math.min(1, this.stateTimer / dur);
      const flare = 1 + this.specialGlow * 2;
      p.shoulderR.rotation.z = 1.3 * flare;
      p.shoulderL.rotation.z = -1.3 * flare;
      p.torso.rotation.y = this.facing * 0.3;
      p.head.rotation.y = this.facing * 0.2;
      if (p.flash && p.flash.material) {
        p.flash.material.color.setHex(this.stats.specialColor || 0xffa94d);
        p.flash.material.opacity = 0.18 + this.specialGlow * 0.75 + Math.sin(t * 18) * 0.08;
      }
    } else if (this.state === 'block') {
      p.shoulderL.rotation.z = 0.9;
      p.shoulderR.rotation.z = 0.9;
      p.torso.rotation.y = 0.1;
      p.hipL.rotation.z = 0;
      p.hipR.rotation.z = 0;
    } else if (this.state === 'hit') {
      p.torso.rotation.y = -this.facing * 0.2;
      p.head.rotation.y = -this.facing * 0.25;
    } else if (this.state === 'walk') {
      this.walkPhase += dt * 8;
      p.hipL.rotation.z = Math.sin(this.walkPhase) * 0.55;
      p.hipR.rotation.z = Math.sin(this.walkPhase + Math.PI) * 0.55;
      p.shoulderL.rotation.z = Math.sin(this.walkPhase + Math.PI) * 0.35;
      p.shoulderR.rotation.z = Math.sin(this.walkPhase) * 0.35;
      p.torso.rotation.y = 0;
      p.head.rotation.y = 0;
    } else if (this.state === 'jump') {
      p.hipL.rotation.z = 0.25;
      p.hipR.rotation.z = -0.15;
      p.shoulderL.rotation.z = -0.3;
      p.shoulderR.rotation.z = 0.3;
    } else {
      this.idleT += dt;
      p.torso.rotation.z = Math.sin(this.idleT * 1.6) * 0.02;
      p.shoulderL.rotation.z = Math.sin(this.idleT * 1.3) * 0.08 - 0.05;
      p.shoulderR.rotation.z = Math.sin(this.idleT * 1.3 + Math.PI) * 0.08 + 0.05;
      p.hipL.rotation.z = 0;
      p.hipR.rotation.z = 0;
      p.torso.rotation.y = 0;
      p.head.rotation.y = 0;
    }

    if (p.flash && p.flash.material.opacity !== undefined) {
      p.flash.material.opacity = Math.max(0, this.flashT / 0.18) * 0.6;
    }
  }

  animateHD(dt) {
    const pg = this.poseGroup;
    const hasAnim = !!this.animTex;
    let px = 0, py = 0, rx = 0, ry = 0, rz = 0, sc = 1;

    // Picks the best available frame-set for a desired state, falling back to
    // idle if this character doesn't have dedicated frames for it (most only
    // have idle/walk/attack; a few also have attack2/hit/ko).
    const framesOr = (state) => (hasAnim && this.animTex[state]) ? state : 'idle';

    if (this.state === 'punch' || this.state === 'kick') {
      const dur = this.getAttackDur(this.state);
      const t = Math.min(1, this.stateTimer / dur);
      let lunge;

      if (t < 0.35) lunge = -0.05 * (t / 0.35);
      else if (t < 0.6) lunge = -0.05 + 0.35 * ((t - 0.35) / 0.25);
      else lunge = 0.30 * (1 - (t - 0.6) / 0.4);
      px = lunge;
      ry = hasAnim ? 0 : lunge * 0.4;
      sc = 1 + Math.max(0, lunge) * 0.06;
      if (hasAnim) {
        const wanted = this.state === 'kick' ? 'attack2' : 'attack';
        const stateKey = this.animTex[wanted] ? wanted : framesOr('attack');
        const frames = this.animTex[stateKey];
        const idx = frames.length > 1 ? Math.min(frames.length - 1, Math.floor(t * frames.length)) : 0;
        this._setSpriteFrame(stateKey, idx);
      }
    } else if (this.state === 'special') {
      const dur = this.getAttackDur('special');
      const t = Math.min(1, this.stateTimer / dur);
      px = this.facing * 0.22 * (1 - t);
      ry = this.facing * 0.22;
      sc = 1 + this.specialGlow * 0.5;
      const wanted = this.animTex.attack2 ? 'attack2' : 'attack';
      const frames = this.animTex[wanted] || this.animTex.attack || this.animTex.idle;
      const idx = frames.length > 1 ? Math.min(frames.length - 1, Math.floor(t * frames.length)) : 0;
      if (hasAnim) this._setSpriteFrame(wanted, idx);
    } else if (this.state === 'block') {
      px = -0.05; ry = -0.15; sc = 0.97;
      if (hasAnim) this._setSpriteFrame('idle', 0);
    } else if (this.state === 'hit') {
      px = -this.facing * 0.12; ry = -this.facing * 0.15;
      if (hasAnim) this._setSpriteFrame(framesOr('hit'), 0);
    } else if (this.state === 'walk') {
      this.walkPhase += dt * 8;
      py = Math.abs(Math.sin(this.walkPhase)) * 0.04;
      rz = hasAnim ? 0 : Math.sin(this.walkPhase) * 0.03;
      if (hasAnim) {
        const stateKey = framesOr('walk');
        const frames = this.animTex[stateKey];
        const cyclePos = (this.walkPhase % (Math.PI * 2)) / (Math.PI * 2);
        const idx = frames.length > 1 ? Math.floor(cyclePos * frames.length) % frames.length : 0;
        this._setSpriteFrame(stateKey, idx);
      }
    } else if (this.state === 'jump') {
      rx = -0.08;
      if (hasAnim) this._setSpriteFrame('idle', 0);
    } else {
      this.idleT += dt;
      py = Math.sin(this.idleT * 1.6) * 0.02;
      ry = Math.sin(this.idleT * 0.8) * 0.04;
      if (hasAnim) this._setSpriteFrame('idle', 0);
    }
    pg.position.set(px, py, 0);
    pg.rotation.set(rx, ry, rz);
    pg.scale.setScalar(sc);
  }

  _setSpriteFrame(state, idx) {
    if (this.animState === state && this.animFrameIdx === idx) return;
    this.animState = state;
    this.animFrameIdx = idx;
    const texture = this.animTex[state][idx];
    this.spriteMesh.material.map = texture;
    this.spriteMesh.material.needsUpdate = true;
    const updateScale = () => {
      if (this.spriteMesh.material.map !== texture) return;
      const image = texture.image;
      const width = image && (image.naturalWidth || image.width);
      const height = image && (image.naturalHeight || image.height);
      if (width && height) this.spriteMesh.scale.x = (width / height) / this.spriteBaseAspect;
    };
    updateScale();
    if (texture.image && !texture.image.complete) {
      texture.image.addEventListener('load', updateScale, { once: true });
    }
  }

  syncMesh() {
    this.group.position.set(this.x, this.y, 0);
    if (this.isSprite) {
      this.group.rotation.y = 0;
      this.group.scale.x = this.facing === 1 ? 1 : -1;
    } else {
      this.group.rotation.y = this.facing === 1 ? 0 : Math.PI;
    }
  }
}



export { Fighter };
