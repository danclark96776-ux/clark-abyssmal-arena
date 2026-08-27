import { CFG, FIGHTERS, resolveStats } from './data/config.js';
import {
  advanceModeProgression,
  describeModeIntro,
  describeModeResult,
  describeModeState,
  getAIDifficultyForMode,
  getModeSettings
} from './data/modes.js';
import { applyStage, getFighterHomeStage } from './data/stages.js';
import { Fighter } from './game/fighter.js';
import { aiThink, getFighterAIStyleLabel } from './game/ai.js';
import { resolveDamageCallout, resolveMeterState } from './game/readability.js';
import { SPRITE_ANIM, SPRITE_ART, hdModels, loadHDModel, restoreHDModelsFromDB } from './data/assets.js';
import { SETTINGS, setKeybind, setUIScale, resetSettings, keyLabel } from './data/settings.js';

let renderer, scene, camera;
let runeMat, runeMesh;
let backdropGroup, defaultFog;
let sparks = [];
let floatingDamage = [];
let shakeT = 0;

let p1 = null, p2 = null;

/* ---------- optional high-fidelity model import ----------
   Real .glb exports have no skeleton, so they can't be posed limb-by-limb
   like the built-in rigs — Fighter falls back to whole-body animation for
   any fighter with an entry here (see animateHD), unless the export is a
   genuinely segmented rig (see hasRig below). Loaded client-side via
   FileReader, so there's no server/CORS dependency and no need to bundle
   the (large) source files into this page. Every import is re-centered
   over its feet and rescaled to HD_TARGET_HEIGHT automatically, regardless
   of how the source file was originally scaled or pivoted.

   Imports are also cached in IndexedDB so this only ever has to happen
   once per device — closing the tab or reloading the page will restore
   every previously-imported model automatically on boot. */
let chosenP1 = null, chosenP2 = null;
let vsWalkTimers = [];
let vsWalkLoopId = 0;
let twoPlayerMode = false;
let gameState = 'menu'; // menu | select | vs | intro | fight | roundEnd | matchEnd
let paused = false;
let roundNum = 1;
let scores = [0, 0];
let roundTime = CFG.ROUND_TIME;
let roundEnding = false;
let prevP1Hp = CFG.MAX_HP, prevP2Hp = CFG.MAX_HP;
let gameMode = 'quick';
let modeWave = 0;
let currentStageTheme = null;

const keys = {};
const touch = { left: false, right: false, jump: false, block: false, punch: false, kick: false, special: false };
let rebindListening = null; // { who: 'p1'|'p2', action, btn } while waiting for a key press
let settingsOpenedFromPause = false;

function determineMatchWinner() {
  if (scores[0] >= 2) return 0;
  if (scores[1] >= 2) return 1;
  return null;
}

function roundLabel() {
  return 'ROUND ' + Math.min(roundNum, 3);
}

/* ---------- three.js scene ---------- */

function createRuneTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');
  const cx = 256, cy = 256;
  ctx.strokeStyle = 'rgba(201,162,75,0.9)';
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(cx, cy, 230, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, 190, 0, Math.PI * 2); ctx.stroke();
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx + 190 * Math.cos(a), cy + 190 * Math.sin(a));
    ctx.lineTo(cx + 230 * Math.cos(a), cy + 230 * Math.sin(a));
    ctx.stroke();
  }
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.2;
    ctx.save();
    ctx.translate(cx + 150 * Math.cos(a), cy + 150 * Math.sin(a));
    ctx.rotate(a);
    ctx.beginPath();
    ctx.moveTo(-8, 10); ctx.lineTo(0, -16); ctx.lineTo(8, 10); ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
  ctx.beginPath();
  ctx.moveTo(cx, cy - 190);
  for (let i = 1; i <= 6; i++) {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
    ctx.lineTo(cx + 190 * Math.cos(a), cy + 190 * Math.sin(a));
  }
  ctx.stroke();
  return new THREE.CanvasTexture(c);
}

function initThree() {
  const canvas = document.getElementById('gl');
  renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0a0d);
  defaultFog = new THREE.Fog(0x0b0a0d, 7, 18);
  scene.fog = defaultFog;

  const aspect = 16 / 9;
  const viewSize = 3.1;
  camera = new THREE.OrthographicCamera(-viewSize * aspect, viewSize * aspect, viewSize, -viewSize * 0.55, 0.1, 50);
  camera.position.set(0, 1.4, 10);
  camera.lookAt(0, 1.1, 0);

  scene.add(new THREE.HemisphereLight(0x8899cc, 0x1a0f14, 0.85));
  const key = new THREE.DirectionalLight(0xfff2d8, 1.3);
  key.position.set(3, 6, 6);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xff4d1a, 0.6);
  rim.position.set(-4, 3, -4);
  scene.add(rim);
  const fill = new THREE.DirectionalLight(0xffffff, 0.45);
  fill.position.set(0, 2, 9);
  scene.add(fill);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 20),
    new THREE.MeshStandardMaterial({ color: 0x141117, roughness: 0.9, metalness: 0.1 })
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  const runeTex = createRuneTexture();
  runeMat = new THREE.MeshBasicMaterial({ map: runeTex, transparent: true, opacity: 0.8, depthWrite: false });
  runeMesh = new THREE.Mesh(new THREE.CircleGeometry(2.6, 48), runeMat);
  runeMesh.rotation.x = -Math.PI / 2;
  runeMesh.position.y = 0.01;
  scene.add(runeMesh);

  backdropGroup = new THREE.Group();
  scene.add(backdropGroup);
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0x201c22, roughness: 0.95 });
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const h = 3 + Math.random();
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.5, h, 0.5), pillarMat);
      pillar.position.set(side * (5 + i * 1.4), h / 2 - 0.3, -3 - i * 1.2);
      backdropGroup.add(pillar);
    }
  }

  handleResize();
  window.addEventListener('resize', handleResize);
  // The stage is sized purely in CSS, so observe it directly rather than
  // guessing from the window — this also catches browser-zoom changes.
  if (window.ResizeObserver) {
    new ResizeObserver(handleResize).observe(document.getElementById('stage-wrap'));
  }
}

function handleResize() {
  const wrap = document.getElementById('stage-wrap');
  const w = wrap.clientWidth, h = wrap.clientHeight;
  if (w <= 0 || h <= 0) return;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(w, h, false);
}

function spawnSpark(x, y, color, radiusMin = 0.05, radiusMax = 0.12, life = 0.28) {
  const mat = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.9, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(new THREE.RingGeometry(radiusMin, radiusMax, 16), mat);
  mesh.position.set(x, y, 0.3);
  scene.add(mesh);
  sparks.push({ mesh: mesh, life: life, age: 0 });
}

function spawnSpecialBurst(fighter, color, effect = 'flare') {
  const baseX = fighter ? fighter.x : 0;
  const baseY = fighter ? 1.0 + Math.random() * 0.4 : 1.0;
  const burstColor = color || 0xffa94d;

  if (effect === 'shadow') {
    for (let i = 0; i < 10; i++) {
      const x = baseX + (Math.random() - 0.5) * 1.2;
      const y = baseY + Math.random() * 0.8;
      const triangle = new THREE.Mesh(
        new THREE.ConeGeometry(0.06, 0.18, 3),
        new THREE.MeshBasicMaterial({ color: burstColor, transparent: true, opacity: 0.9 })
      );
      triangle.position.set(x, y, 0.25 + i * 0.01);
      triangle.rotation.z = Math.random() * Math.PI;
      scene.add(triangle);
      sparks.push({ mesh: triangle, life: 0.42, age: 0, spin: (Math.random() - 0.5) * 5 });
    }
    return;
  }

  if (effect === 'shock') {
    for (let i = 0; i < 14; i++) {
      const x = baseX + (Math.random() - 0.5) * 1.3;
      const y = baseY + Math.random() * 0.9;
      const streak = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.28, 0.02),
        new THREE.MeshBasicMaterial({ color: burstColor, transparent: true, opacity: 0.85 })
      );
      streak.position.set(x, y, 0.35);
      streak.rotation.z = (Math.random() - 0.5) * 1.4;
      scene.add(streak);
      sparks.push({ mesh: streak, life: 0.24, age: 0, spin: (Math.random() - 0.5) * 9 });
    }
    return;
  }

  if (effect === 'frost') {
    for (let i = 0; i < 16; i++) {
      const x = baseX + (Math.random() - 0.5) * 1.1;
      const y = baseY + Math.random() * 0.8;
      spawnSpark(x, y, burstColor, 0.02, 0.09, 0.36);
    }
    return;
  }

  for (let i = 0; i < 12; i++) {
    const x = baseX + (Math.random() - 0.5) * 0.9;
    const y = baseY + Math.random() * 0.7;
    spawnSpark(x, y, burstColor);
  }
}

function updateSparks(dt) {
  for (let i = sparks.length - 1; i >= 0; i--) {
    const s = sparks[i];
    s.age += dt;
    const t = s.age / s.life;
    s.mesh.scale.setScalar(1 + t * 3);
    s.mesh.rotation.z = (s.spin || 0) * t;
    if (s.mesh.material && 'opacity' in s.mesh.material) {
      s.mesh.material.opacity = 0.9 * (1 - t);
    }
    if (t >= 1) {
      scene.remove(s.mesh);
      sparks.splice(i, 1);
    }
  }
}

function spawnDamageText(x, y, amount, options = {}) {
  const meta = resolveDamageCallout(amount, options);
  const wrap = document.getElementById('stage-wrap');
  const el = document.createElement('div');
  el.className = 'damage-callout';
  el.textContent = meta.label + ' ' + meta.damage;
  el.style.setProperty('--damage-color', '#' + meta.color.toString(16).padStart(6, '0'));
  el.style.setProperty('--damage-scale', meta.scale.toFixed(2));
  el.style.opacity = '1';
  wrap.appendChild(el);
  floatingDamage.push({
    el,
    x,
    y,
    age: 0,
    life: 0.9,
    drift: (Math.random() - 0.5) * 0.2
  });
}

function updateFloatingDamage(dt) {
  for (let i = floatingDamage.length - 1; i >= 0; i--) {
    const fx = floatingDamage[i];
    fx.age += dt;
    const t = Math.min(1, fx.age / fx.life);
    const worldPos = new THREE.Vector3(fx.x, fx.y + 0.9 + (fx.age * 0.35) + fx.drift, 0.4);
    const projected = worldPos.project(camera);
    const stage = document.getElementById('stage-wrap');
    const rect = stage.getBoundingClientRect();
    const left = ((projected.x + 1) * 0.5) * rect.width;
    const top = ((1 - ((projected.y + 1) * 0.5 + 0.08)) * rect.height);
    fx.el.style.left = left + 'px';
    fx.el.style.top = top + 'px';
    fx.el.style.opacity = String(1 - t);
    fx.el.style.transform = 'translate(-50%, 0) scale(' + (1 + t * 0.55) + ')';
    if (t >= 1) {
      fx.el.remove();
      floatingDamage.splice(i, 1);
    }
  }
}

/* ---------- DOM helpers ---------- */

function $(id) { return document.getElementById(id); }
function hexToCss(n) { return '#' + n.toString(16).padStart(6, '0'); }
function delay(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

function showScreen(name) {
  if (name !== 'vs') {
    vsWalkLoopId++;
    vsWalkTimers.forEach(function (timer) { clearInterval(timer); });
    vsWalkTimers = [];
  }
  document.querySelectorAll('.screen').forEach(function (el) { el.classList.add('hidden'); });
  $(name).classList.remove('hidden');
  $('hud').classList.add('hidden');
  $('controls').classList.add('hidden');
}

async function playBanner(text, holdMs) {
  const el = $('banner');
  el.textContent = text;
  el.classList.remove('show');
  void el.offsetWidth;
  el.classList.add('show');
  await delay(holdMs);
  el.classList.remove('show');
}

function getPortraitSrc(id) {
  if (SPRITE_ANIM[id]) return SPRITE_ANIM[id].frames.idle[0];
  if (SPRITE_ART[id]) return SPRITE_ART[id].src;
  return null;
}

function cardHTML(f) {
  const portrait = getPortraitSrc(f.id);
  const emblemHTML = SPRITE_ANIM[f.id]
    ? '<span class="vs-walk-art"><img class="emblem-art big" src="' + portrait + '" alt=""></span>'
    : portrait
      ? '<img class="emblem-art big" src="' + portrait + '" alt="">'
      : '<span class="emblem big">' + f.emblem + '</span>';
  return emblemHTML +
    '<span class="pname">' + f.name + '</span>' +
    '<span class="ptag">' + f.tagline + '</span>' +
    (f.lore ? '<span class="lore">' + f.lore + '</span>' : '');
}

async function startVsWalkLoops() {
  const loopId = ++vsWalkLoopId;
  vsWalkTimers.forEach(function (timer) { clearInterval(timer); });
  vsWalkTimers = [];
  const previews = Array.from(document.querySelectorAll('.vs-walk-art')).map(async function (container) {
    const fighterId = container.parentElement.dataset.fighterId;
    const walkFrames = SPRITE_ANIM[fighterId].frames.walk;
    const image = container.querySelector('img');
    await Promise.all(walkFrames.map(function (src) {
      return new Promise(function (resolve) {
        const preload = new Image();
        preload.onload = resolve;
        preload.onerror = resolve;
        preload.src = src;
      });
    }));
    if (loopId !== vsWalkLoopId) return;
    let frameIndex = 0;
    image.src = walkFrames[frameIndex];
    vsWalkTimers.push(setInterval(function () {
      frameIndex = (frameIndex + 1) % walkFrames.length;
      image.src = walkFrames[frameIndex];
    }, 140));
  });
  await Promise.all(previews);
}

let hdImportTarget = null;
let currentRosterForP2 = false;
let selectedRosterFighter = null;

function refreshRosterHDBadges() {
  if (!$('select').classList.contains('hidden')) {
    renderRoster(currentRosterForP2);
  }
}

function renderRoster(forP2) {
  currentRosterForP2 = forP2;
  selectedRosterFighter = null;
  renderFighterDetail(null);
  const rosterEl = $('roster');
  rosterEl.innerHTML = '';
  FIGHTERS.forEach(function (f) {
    const hasSprite = !!(SPRITE_ANIM[f.id] || SPRITE_ART[f.id]);
    const card = document.createElement('div');
    card.className = 'plaque' + (hasSprite ? '' : ' unavailable');
    if (hasSprite) {
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
    }
    if (f.lore) card.title = f.lore;
    card.style.setProperty('--accent', hexToCss(f.accent));
    card.style.setProperty('--primary', hexToCss(f.primary));
    const portrait = getPortraitSrc(f.id);
    const emblemHTML = portrait
      ? '<img class="emblem-art" src="' + portrait + '" alt="">'
      : '<span class="emblem">' + f.emblem + '</span>';
    card.innerHTML = emblemHTML +
      '<span class="pname">' + f.name + '</span>' +
      '<span class="ptag">' + f.tagline + '</span>';
    card.addEventListener('click', function () {
      if (!hasSprite) return;
      selectedRosterFighter = f;
      rosterEl.querySelectorAll('.plaque').forEach(function (plaque) { plaque.classList.remove('selected'); });
      card.classList.add('selected');
      renderFighterDetail(f);
    });
    if (hasSprite) {
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectedRosterFighter = f;
          rosterEl.querySelectorAll('.plaque').forEach(function (plaque) { plaque.classList.remove('selected'); });
          card.classList.add('selected');
          renderFighterDetail(f);
        }
      });
    }

    if (hasSprite) {
      rosterEl.appendChild(card);
      return;
    }

    rosterEl.appendChild(card);
  });
}

function renderFighterDetail(fighter) {
  const resolved = fighter ? resolveStats(fighter) : null;
  const homeStage = fighter ? getFighterHomeStage(fighter) : null;
  $('detailName').textContent = fighter ? fighter.name : 'Choose a fighter';
  $('detailTagline').textContent = fighter ? fighter.tagline : 'Select an icon to inspect them';
  $('detailLore').textContent = fighter ? fighter.lore : '';
  const aiStyleLabel = fighter ? getFighterAIStyleLabel(fighter) : '';
  $('detailStats').innerHTML = fighter && resolved
    ? '<span>HP ' + resolved.maxHp + '</span><span>MOVE ' + resolved.moveSpeed.toFixed(1) + '</span>' +
      '<span>JUMP ' + resolved.jumpV.toFixed(1) + '</span><span>LIGHT ' + resolved.punchDmg + '</span>' +
      '<span>HEAVY ' + resolved.kickDmg + '</span><span>SPEC ' + resolved.specialName + '</span>' +
      '<span>ARENA ' + (homeStage ? homeStage.name : 'Unknown') + '</span>' +
      '<span>AI ' + aiStyleLabel + '</span>'
    : '';
  const portrait = fighter && getPortraitSrc(fighter.id);
  $('detailArt').innerHTML = portrait
    ? '<img class="detail-art-image" src="' + portrait + '" alt="' + fighter.name + ' idle asset">'
    : fighter ? '<span class="detail-emblem">' + fighter.emblem + '</span>' : '';
  const hdBtn = $('detailHdBtn');
  if (fighter && !SPRITE_ANIM[fighter.id] && !SPRITE_ART[fighter.id]) {
    hdBtn.hidden = false;
    hdBtn.disabled = typeof THREE.GLTFLoader !== 'function';
    hdBtn.className = 'hd-btn' + (hdModels[fighter.id] ? ' loaded' : '');
    hdBtn.textContent = hdModels[fighter.id] ? 'HD model loaded' : 'Import HD model';
    hdBtn.onclick = function (e) {
      e.stopPropagation();
      hdImportTarget = { fighterId: fighter.id, btn: hdBtn };
      $('hdFileInput').click();
    };
  } else {
    hdBtn.hidden = true;
    hdBtn.onclick = null;
  }
  $('selectConfirmBtn').disabled = !fighter;
}

function openSelect(forP2) {
  $('selectTitle').textContent = forP2 ? "Choose Rival's Fighter" : 'Choose Your Fighter';
  renderRoster(forP2);
  showScreen('select');
  gameState = 'select';
}

function onPick(theme, forP2) {
  if (!forP2) {
    chosenP1 = theme;
    if (twoPlayerMode) {
      openSelect(true);
    } else {
      const pool = FIGHTERS.filter(function (f) { return f.id !== theme.id; });
      chosenP2 = pool[Math.floor(Math.random() * pool.length)];
      showVS();
    }
  } else {
    chosenP2 = theme;
    showVS();
  }
}

function showVS() {
  $('vsP1').dataset.fighterId = chosenP1.id;
  $('vsP2').dataset.fighterId = chosenP2.id;
  $('vsP1').innerHTML = cardHTML(chosenP1);
  $('vsP2').innerHTML = cardHTML(chosenP2);
  startVsWalkLoops();
  showScreen('vs');
  gameState = 'vs';
}

function updateHUD() {
  const p1pct = Math.max(0, p1.hp / p1.stats.maxHp * 100);
  const p2pct = Math.max(0, p2.hp / p2.stats.maxHp * 100);
  const p1MeterPct = Math.max(0, p1.meter / p1.stats.maxMeter * 100);
  const p2MeterPct = Math.max(0, p2.meter / p2.stats.maxMeter * 100);
  const p1Ready = resolveMeterState(p1.meter, p1.stats.maxMeter, p1.stats.specialCost);
  const p2Ready = resolveMeterState(p2.meter, p2.stats.maxMeter, p2.stats.specialCost);

  $('p1Fill').style.width = p1pct + '%';
  $('p2Fill').style.width = p2pct + '%';
  $('p1Meter').style.width = p1MeterPct + '%';
  $('p2Meter').style.width = p2MeterPct + '%';
  $('p1Meter').classList.toggle('ready', p1Ready.state === 'ready');
  $('p2Meter').classList.toggle('ready', p2Ready.state === 'ready');
  $('p1Fill').classList.toggle('low', p1pct < 25);
  $('p2Fill').classList.toggle('low', p2pct < 25);
  $('p1Combo').textContent = 'x' + Math.max(1, p1.comboCount || 1);
  $('p2Combo').textContent = 'x' + Math.max(1, p2.comboCount || 1);
  $('timer').textContent = Math.ceil(roundTime);
  $('timer').classList.toggle('urgent', roundTime < 10);
  const modeStatus = $('modeStatus');
  if (modeStatus) modeStatus.textContent = describeModeState(gameMode, modeWave);
}

function updatePips() {
  for (let i = 0; i < 2; i++) {
    const wrap = $(i === 0 ? 'pipsP1' : 'pipsP2');
    wrap.querySelectorAll('.pip').forEach(function (dot, idx) {
      dot.classList.toggle('filled', idx < scores[i]);
    });
  }
}

/* ---------- settings ---------- */

const KEYBIND_ACTIONS = [
  ['left', 'Left'],
  ['right', 'Right'],
  ['jump', 'Jump'],
  ['block', 'Block'],
  ['punch', 'Light Attack'],
  ['kick', 'Heavy Attack'],
  ['special', 'Special']
];

function applyUIScale() {
  document.documentElement.style.setProperty('--ui-scale', SETTINGS.uiScale);
  $('uiScaleSlider').value = SETTINGS.uiScale;
  $('uiScaleValue').textContent = Math.round(SETTINGS.uiScale * 100) + '%';
}

function renderKeybindRows(who) {
  const list = $(who === 'p1' ? 'keybindsP1' : 'keybindsP2');
  list.innerHTML = '';
  KEYBIND_ACTIONS.forEach(function ([action, label]) {
    const row = document.createElement('div');
    row.className = 'keybind-row';
    const span = document.createElement('span');
    span.textContent = label;
    const btn = document.createElement('button');
    btn.className = 'rebind-btn';
    btn.textContent = keyLabel(SETTINGS.keybinds[who][action]);
    btn.addEventListener('click', function () {
      if (rebindListening && rebindListening.btn) {
        rebindListening.btn.classList.remove('listening');
        rebindListening.btn.textContent = keyLabel(SETTINGS.keybinds[rebindListening.who][rebindListening.action]);
      }
      rebindListening = { who: who, action: action, btn: btn };
      btn.classList.add('listening');
      btn.textContent = 'Press a key…';
    });
    row.appendChild(span);
    row.appendChild(btn);
    list.appendChild(row);
  });
}

function renderAllKeybinds() {
  renderKeybindRows('p1');
  renderKeybindRows('p2');
}

/* ---------- match flow ---------- */

async function beginMatch(t1, t2, twoP) {
  if (p1) scene.remove(p1.group);
  if (p2) scene.remove(p2.group);
  p1 = new Fighter(t1, false);
  p2 = new Fighter(t2, !twoP);
  scene.add(p1.group);
  scene.add(p2.group);
  currentStageTheme = applyStage({ scene: scene, backdropGroup: backdropGroup, defaultFog: defaultFog }, t1, t2);
  scores = [0, 0];
  roundNum = 1;
  const modeConfig = currentModeConfig();
  roundTime = modeConfig.roundTime;
  $('p1Name').textContent = t1.name.toUpperCase();
  $('p2Name').textContent = t2.name.toUpperCase();
  if (gameMode === 'training') {
    $('timer').textContent = String(modeConfig.roundTime);
  }
  updatePips();
  await startRound();
}

async function startRound() {
  p1.reset(-2.2, 1);
  p2.reset(2.2, -1);
  prevP1Hp = p1.hp;
  prevP2Hp = p2.hp;
  roundEnding = false;
  roundTime = currentModeConfig().roundTime;
  updateHUD();
  gameState = 'intro';
  await playBanner(describeModeIntro(gameMode, modeWave), 850);
  if (currentStageTheme && currentStageTheme.name) {
    await playBanner(currentStageTheme.name, 700);
  }
  await playBanner(roundLabel(), 850);
  await playBanner('FIGHT!', 500);
  gameState = 'fight';
}

async function endRoundSequence() {
  await delay(450);
  let text = 'K.O.';
  if (p1.hp > 0 && p2.hp > 0) text = 'TIME UP';
  else if (p1.hp <= 0 && p2.hp <= 0) text = 'DOUBLE K.O.';
  await playBanner(text, 1000);
  updatePips();

  const matchWinner = determineMatchWinner();
  if (matchWinner !== null) {
    await delay(250);
    showMatchEnd(matchWinner === 0);
    return;
  }

  roundNum = Math.min(roundNum + 1, 3);
  refreshModeStateDisplay();
  await startRound();
}

function currentModeConfig() {
  return getModeSettings(gameMode);
}

function setGameMode(mode) {
  gameMode = mode;
  modeWave = 0;
  document.querySelectorAll('.mode-btn').forEach(function (btn) {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });
  const modeInfo = currentModeConfig();
  $('startBtn').textContent = mode === 'arcade' ? 'Begin Arcade Run' : mode === 'training' ? 'Enter Training' : mode === 'survival' ? 'Start Survival' : 'Enter the Arena';
  if (modeInfo && modeInfo.description) {
    const menuTagline = document.querySelector('#menu .tagline');
    if (menuTagline) menuTagline.textContent = modeInfo.description.toUpperCase();
  }
  const modeState = document.querySelector('#menu #modeState');
  if (modeState) modeState.textContent = describeModeState(mode, modeWave);
}

function refreshModeStateDisplay() {
  const modeState = document.querySelector('#menu #modeState');
  if (modeState) modeState.textContent = describeModeState(gameMode, modeWave);
}

function showMatchEnd(p1Won) {
  gameState = 'matchEnd';
  refreshModeStateDisplay();

  const title = twoPlayerMode
    ? (p1Won ? 'PLAYER 1 WINS' : 'PLAYER 2 WINS')
    : describeModeResult(gameMode, modeWave, p1Won);
  $('matchEndTitle').textContent = title;
  showScreen('matchEnd');
}

/* ---------- input ---------- */

function mergedP1Input() {
  const kb = SETTINGS.keybinds.p1;
  return {
    left: !!keys[kb.left] || touch.left,
    right: !!keys[kb.right] || touch.right,
    jump: !!keys[kb.jump] || touch.jump,
    block: !!keys[kb.block] || touch.block,
    punch: !!keys[kb.punch] || touch.punch,
    kick: !!keys[kb.kick] || touch.kick,
    special: !!keys[kb.special] || touch.special
  };
}

function mergedP2Input() {
  const kb = SETTINGS.keybinds.p2;
  return {
    left: !!keys[kb.left],
    right: !!keys[kb.right],
    jump: !!keys[kb.jump],
    block: !!keys[kb.block],
    punch: !!keys[kb.punch],
    kick: !!keys[kb.kick],
    special: !!keys[kb.special]
  };
}

function setupInput() {
  window.addEventListener('keydown', function (e) {
    if (rebindListening) {
      e.preventDefault();
      setKeybind(rebindListening.who, rebindListening.action, e.code);
      rebindListening.btn.classList.remove('listening');
      rebindListening = null;
      renderAllKeybinds();
      return;
    }
    const bound = Object.values(SETTINGS.keybinds.p1).concat(Object.values(SETTINGS.keybinds.p2));
    if (bound.includes(e.code)) e.preventDefault();
    keys[e.code] = true;
  });
  window.addEventListener('keyup', function (e) { keys[e.code] = false; });

  document.querySelectorAll('.pad-btn').forEach(function (btn) {
    const act = btn.dataset.act;
    const set = function (v) { return function (e) { e.preventDefault(); touch[act] = v; }; };
    btn.addEventListener('pointerdown', set(true));
    btn.addEventListener('pointerup', set(false));
    btn.addEventListener('pointerleave', set(false));
    btn.addEventListener('pointercancel', set(false));
  });
}

/* ---------- main loop ---------- */

function triggerShake() { shakeT = 0.16; }

function tick(now) {
  requestAnimationFrame(tick);
  const dt = Math.min(0.033, (now - (tick.last || now)) / 1000);
  tick.last = now;

  if (gameState === 'fight' && !paused) {
    const p1in = mergedP1Input();
    p1.update(dt, p2, p1in);
    if (twoPlayerMode) {
      p2.update(dt, p1, mergedP2Input());
    } else {
      aiThink(p2, p1, dt, getAIDifficultyForMode(gameMode, modeWave));
      p2.update(dt, p1, null);
    }

    if (p1.hp < prevP1Hp) {
      const damageTaken = Math.max(0, prevP1Hp - p1.hp);
      spawnSpark(p2.x - p2.facing * 0.7, 1.0, 0xff5a1f);
      spawnDamageText(p1.x, 1.15, damageTaken, {
        comboCount: p2.comboCount,
        blocked: p1.state === 'block',
        special: p2.state === 'special'
      });
      triggerShake();
    }
    if (p2.hp < prevP2Hp) {
      const damageTaken = Math.max(0, prevP2Hp - p2.hp);
      spawnSpark(p1.x + p1.facing * 0.7, 1.0, 0x5fd0e8);
      spawnDamageText(p2.x, 1.15, damageTaken, {
        comboCount: p1.comboCount,
        blocked: p2.state === 'block',
        special: p1.state === 'special'
      });
      triggerShake();
    }
    prevP1Hp = p1.hp;
    prevP2Hp = p2.hp;

    if (p1.specialBurstQueued) {
      spawnSpecialBurst(p1, p1.stats.specialColor, p1.stats.specialEffect);
      p1.specialBurstQueued = false;
    }
    if (p2.specialBurstQueued) {
      spawnSpecialBurst(p2, p2.stats.specialColor, p2.stats.specialEffect);
      p2.specialBurstQueued = false;
    }

    roundTime = Math.max(0, roundTime - dt);
    updateHUD();

    if (!roundEnding && (p1.hp <= 0 || p2.hp <= 0 || roundTime <= 0)) {
      roundEnding = true;
      const p1WonRound = p1.hp > p2.hp;
      if (p1WonRound) scores[0]++;
      else if (p2.hp > p1.hp) scores[1]++;
      else { scores[0]++; scores[1]++; }

      modeWave = advanceModeProgression(gameMode, modeWave, p1WonRound);
      refreshModeStateDisplay();

      const roundWinner = determineMatchWinner();
      if (roundWinner !== null || roundNum >= 3) {
        gameState = 'roundEnd';
        endRoundSequence();
      } else {
        gameState = 'roundEnd';
        endRoundSequence();
      }
    }
  }

  if (shakeT > 0) {
    shakeT -= dt;
    camera.position.x = (Math.random() - 0.5) * 0.06;
    camera.position.y = 1.4 + (Math.random() - 0.5) * 0.06;
  } else {
    camera.position.x = 0;
    camera.position.y = 1.4;
  }

  updateSparks(dt);
  updateFloatingDamage(dt);
  if (runeMat) runeMat.opacity = 0.7 + Math.sin(now * 0.0015) * 0.1;

  renderer.render(scene, camera);
}

/* ---------- boot ---------- */

function boot() {
  initThree();
  setupInput();
  applyUIScale();
  renderAllKeybinds();
  restoreHDModelsFromDB(refreshRosterHDBadges);

  document.querySelectorAll('.mode-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      setGameMode(btn.dataset.mode);
    });
  });
  setGameMode('quick');

  $('startBtn').addEventListener('click', function () { openSelect(false); });

  $('fightBtn').addEventListener('click', async function () {
    document.querySelectorAll('.screen').forEach(function (el) { el.classList.add('hidden'); });
    $('hud').classList.remove('hidden');
    $('controls').classList.remove('hidden');
    await beginMatch(chosenP1, chosenP2, twoPlayerMode);
  });

  $('selectConfirmBtn').addEventListener('click', function () {
    if (selectedRosterFighter) onPick(selectedRosterFighter, currentRosterForP2);
  });

  $('selectBackBtn').addEventListener('click', function () {
    if (currentRosterForP2) {
      openSelect(false);
      return;
    }
    showScreen('menu');
    gameState = 'menu';
  });
  $('vsBackBtn').addEventListener('click', function () {
    openSelect(false);
  });

  $('twoPToggle').addEventListener('change', function (e) { twoPlayerMode = e.target.checked; });

  $('hdFileInput').addEventListener('change', async function (e) {
    const file = e.target.files && e.target.files[0];
    const target = hdImportTarget;
    e.target.value = '';
    if (!file || !target) return;
    target.btn.textContent = 'Loading…';
    target.btn.className = 'hd-btn loading';
    try {
      await loadHDModel(target.fighterId, file);
      target.btn.textContent = '✓ HD model';
      target.btn.className = 'hd-btn loaded';
    } catch (err) {
      target.btn.textContent = 'Import failed — tap for details';
      target.btn.className = 'hd-btn';
      target.btn.onclick = function (ev) {
        ev.stopPropagation();
        alert('HD import failed:\n\n' + (err && err.message ? err.message : err));
      };
    }
  });

  $('pauseBtn').addEventListener('click', function () {
    if (gameState !== 'fight') return;
    paused = true;
    $('pauseOverlay').classList.remove('hidden');
  });
  $('resumeBtn').addEventListener('click', function () {
    paused = false;
    $('pauseOverlay').classList.add('hidden');
  });
  $('rematchBtn').addEventListener('click', async function () {
    paused = false;
    $('pauseOverlay').classList.add('hidden');
    scores = [0, 0];
    roundNum = 1;
    updatePips();
    await startRound();
  });
  $('menuBtn').addEventListener('click', function () {
    paused = false;
    $('pauseOverlay').classList.add('hidden');
    openSelect(false);
  });
  $('playAgainBtn').addEventListener('click', function () { openSelect(false); });
  $('matchEndBackBtn').addEventListener('click', function () {
    showScreen('menu');
    gameState = 'menu';
  });

  $('settingsBtn').addEventListener('click', function () {
    settingsOpenedFromPause = false;
    showScreen('settings');
  });
  refreshModeStateDisplay();
  $('settingsBtnPause').addEventListener('click', function () {
    settingsOpenedFromPause = true;
    $('pauseOverlay').classList.add('hidden');
    $('settings').classList.remove('hidden');
  });
  $('settingsBackBtn').addEventListener('click', function () {
    $('settings').classList.add('hidden');
    if (settingsOpenedFromPause) {
      $('pauseOverlay').classList.remove('hidden');
    } else {
      showScreen('menu');
      gameState = 'menu';
    }
  });
  $('settingsResetBtn').addEventListener('click', function () {
    resetSettings();
    applyUIScale();
    renderAllKeybinds();
  });
  $('uiScaleSlider').addEventListener('input', function (e) {
    setUIScale(parseFloat(e.target.value));
    applyUIScale();
  });

  requestAnimationFrame(tick);
}

document.addEventListener('DOMContentLoaded', boot);

