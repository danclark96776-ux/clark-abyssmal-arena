import { FIGHTERS } from './config.js';
import morvaneSprite from './fighters/sprites/morvane.js';
import palekingSprite from './fighters/sprites/paleking.js';
import ragnarokSprite from './fighters/sprites/ragnarok.js';
import velaraSprite from './fighters/sprites/velara.js';
import gorvathSprite from './fighters/sprites/gorvath.js';
import frostqueenSprite from './fighters/sprites/frostqueen.js';
import voidfangSprite from './fighters/sprites/voidfang.js';
import seraphineSprite from './fighters/sprites/seraphine.js';
import shitlerSprite from './fighters/sprites/shitler.js';

export const hdModels = {};

/* ---------- optional 2D sprite fighters ----------
   A single hand-drawn portrait, used in place of the procedural 3D rig
   entirely (checked before hdModels, so it wins over any HD import too —
   this is the character's new default look, not a fallback). Rendered as
   a camera-facing flat plane; "animated" via whole-sprite transforms
   (lunge, bob, recoil, horizontal flip) since there's only one frame to
   work with — true frame-by-frame animation would need additional poses
   from the source art. Small enough to embed directly, unlike the 3D
   models, so no import step is needed. */
export const SPRITE_ART = {
};
const spriteTextures = {};

export function getSpriteTexture(id) {
  if (!spriteTextures[id]) {
    spriteTextures[id] = new THREE.TextureLoader().load(SPRITE_ART[id].src);
    spriteTextures[id].magFilter = THREE.NearestFilter;
    spriteTextures[id].minFilter = THREE.LinearMipmapLinearFilter;
  }
  return spriteTextures[id];
}


/* ---------- optional multi-frame animated sprite fighters ----------
   A real frame-by-frame sprite atlas (extracted + background-removed from
   a provided sprite sheet). Checked before SPRITE_ART, so an animated
   sprite wins over a static one for the same id. Idle/Walk/Attack frames
   only — the source sheet's "Death" cycle didn't actually exist despite
   being labeled, and its Idle row was 7 duplicates of one pose, so those
   are represented honestly here (1 idle frame; walk and attack are the
   two states with genuine distinct poses). Attack frame index is driven
   by attack progress (not a free timer) so the windup-thrust-recover
   completes exactly once per punch/kick; walk frame index is driven by
   the existing walkPhase cycle. */
export const SPRITE_ANIM = {
  morvane: morvaneSprite,
  paleking: palekingSprite,
  ragnarok: ragnarokSprite,
  velara: velaraSprite,
  gorvath: gorvathSprite,
  frostqueen: frostqueenSprite,
  voidfang: voidfangSprite,
  seraphine: seraphineSprite,
  shitler: shitlerSprite
};
const spriteAnimTextures = {};

export function getSpriteAnimTextures(id) {
  if (!spriteAnimTextures[id]) {
    const src = SPRITE_ANIM[id].frames;
    const loader = new THREE.TextureLoader();
    const load = (uri) => {
      const t = loader.load(uri);
      t.magFilter = THREE.NearestFilter;
      t.minFilter = THREE.LinearMipmapLinearFilter;
      return t;
    };
    const result = {};
    for (const state in src) result[state] = src[state].map(load);
    spriteAnimTextures[id] = result;
  }
  return spriteAnimTextures[id];
}

export const HD_TARGET_HEIGHT = 1.85;
const HD_DB_NAME = 'AbyssalArenaHD';
const HD_DB_STORE = 'models';

function openHDDatabase() {
  return new Promise(function (resolve, reject) {
    if (!window.indexedDB) { reject(new Error('IndexedDB not available in this browser')); return; }
    const req = indexedDB.open(HD_DB_NAME, 1);
    req.onupgradeneeded = function (e) {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(HD_DB_STORE)) db.createObjectStore(HD_DB_STORE);
    };
    req.onsuccess = function (e) { resolve(e.target.result); };
    req.onerror = function () { reject(req.error || new Error('IndexedDB open failed')); };
  });
}

async function saveHDToDB(fighterId, arrayBuffer) {
  try {
    const db = await openHDDatabase();
    return new Promise(function (resolve) {
      const tx = db.transaction(HD_DB_STORE, 'readwrite');
      tx.objectStore(HD_DB_STORE).put(arrayBuffer, fighterId);
      tx.oncomplete = function () { resolve(true); };
      tx.onerror = function () { resolve(false); };
    });
  } catch (e) {
    return false;
  }
}

async function loadHDFromDB(fighterId) {
  try {
    const db = await openHDDatabase();
    return new Promise(function (resolve) {
      const tx = db.transaction(HD_DB_STORE, 'readonly');
      const req = tx.objectStore(HD_DB_STORE).get(fighterId);
      req.onsuccess = function () { resolve(req.result || null); };
      req.onerror = function () { resolve(null); };
    });
  } catch (e) {
    return null;
  }
}

function parseHDArrayBuffer(fighterId, arrayBuffer) {
  return new Promise(function (resolve, reject) {
    if (typeof THREE.GLTFLoader !== 'function') {
      reject(new Error('GLTFLoader did not load (check your internet connection — it loads from a CDN the first time the page opens)'));
      return;
    }
    let loader;
    try {
      loader = new THREE.GLTFLoader();
    } catch (e) {
      reject(new Error('GLTFLoader failed to initialize: ' + e.message));
      return;
    }
    loader.parse(arrayBuffer, '', function (gltf) {
      const root = gltf.scene || (gltf.scenes && gltf.scenes[0]);
      if (!root) { reject(new Error('the file loaded but had no scene in it')); return; }
      root.traverse(function (node) {
        if (!node.isMesh) return;
        if (node.geometry) node.geometry.computeVertexNormals();
        const mats = Array.isArray(node.material) ? node.material : [node.material];
        mats.forEach(function (mat) {
          if (!mat) return;
          mat.side = THREE.DoubleSide;
          if (node.geometry && node.geometry.attributes && node.geometry.attributes.color) {
            mat.vertexColors = true;
          }
          // this scene has no environment map, so a fully metallic material
          // (common in these exports) would render almost black outside of
          // direct specular highlights — pull it down toward a diffuse look.
          if (typeof mat.metalness === 'number' && mat.metalness > 0.5) {
            mat.metalness = 0.3;
          }
          if (typeof mat.roughness === 'number' && mat.roughness < 0.35) {
            mat.roughness = 0.5;
          }
          mat.needsUpdate = true;
        });
      });

      const RIG_PART_NAMES = ['Torso', 'Head', 'LeftArm', 'RightArm', 'LeftLeg', 'RightLeg'];
      const hasRig = RIG_PART_NAMES.every(function (n) { return !!root.getObjectByName(n); });

      if (!hasRig) {
        const box = new THREE.Box3().setFromObject(root);
        const size = new THREE.Vector3();
        box.getSize(size);
        const center = new THREE.Vector3();
        box.getCenter(center);
        const scale = size.y > 0 ? HD_TARGET_HEIGHT / size.y : 1;
        root.scale.setScalar(scale);
        root.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
      }
      // segmented rigs are pre-centered, pre-scaled (to HD_TARGET_HEIGHT), and
      // pre-pivoted per limb during export, so they're used as-is.

      hdModels[fighterId] = { root: root, hasRig: hasRig };
      resolve(hdModels[fighterId]);
    }, function (err) { reject(new Error('glTF parse error: ' + (err && err.message ? err.message : err))); });
  });
}

export function loadHDModel(fighterId, file) {
  return new Promise(function (resolve, reject) {
    const reader = new FileReader();
    reader.onerror = function () { reject(new Error('could not read the file (device may be low on memory for a file this size)')); };
    reader.onload = async function () {
      try {
        const result = await parseHDArrayBuffer(fighterId, reader.result);
        saveHDToDB(fighterId, reader.result); // cache for future sessions; failure here is non-fatal
        resolve(result);
      } catch (e) {
        reject(e);
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

export async function restoreHDModelsFromDB(onRestored) {
  for (let i = 0; i < FIGHTERS.length; i++) {
    const id = FIGHTERS[i].id;
    if (hdModels[id]) continue;
    const buf = await loadHDFromDB(id);
    if (!buf) continue;
    try {
      await parseHDArrayBuffer(id, buf);
      if (onRestored) onRestored();
    } catch (e) {
      // stale/corrupt cache entry — ignore, user can re-import
    }
  }
}


