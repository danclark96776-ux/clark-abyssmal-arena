# Architecture

Everything lives in `abyssal-arena.html`: `<style>` block, then HTML for the
menu/roster/HUD/controls, then one CDN `<script src>` tag (Three.js r128),
then one large inline `<script>` containing the whole game.

The file is mostly base64 image data by volume. The actual code is roughly
1,900 lines. To find things, search for the landmark identifiers below rather
than scrolling.

---

## Rendering

Three.js with an **orthographic** camera looking down the Z axis — the game is
2.5D: a flat side-on view, but rendered in a real 3D scene.

Scene contents:
- `HemisphereLight` + three `DirectionalLight`s (key / rim / fill)
- a ground plane and a canvas-generated rune-circle floor decal (`runeMesh`)
- `backdropGroup` — procedural pillars, hidden whenever a photo backdrop is used
- the two fighters' `THREE.Group`s
- transient hit-spark rings (`sparks`)

**Stage backdrops** live in `STAGE_ART`, keyed by fighter id, as base64 JPEG.
Each character has a home arena; there's also a `RANDOM_STAGE_ART` pool with a
20% chance to override. `getStageTexture()` loads and caches at most one
backdrop per match (whichever stage actually gets picked), not all of them.

---

## Fighters

`class Fighter` is the core. Its constructor checks **`SPRITE_ANIM[id]`
first**:

1. **Exists** → animated sprite. A flat camera-facing `PlaneGeometry` with a
   `MeshBasicMaterial`; frames are swapped by changing `material.map`. This is
   the path all 8 real characters use.
2. **Doesn't exist** → `buildFighter(theme)`, a procedural low-poly rig. This
   is what the four placeholder characters (`ashborn`, `malphas`, `grendel`,
   `inferna`) use.

That's the whole priority list. There used to be two more paths — a static
single-image `SPRITE_ART` registry and an imported-GLTF `hdModels` path — both
have been **removed**; see "Removed systems" below.

Sprites are flipped horizontally with `group.scale.x = -1`, **not** a 3D
Y-rotation — a flat plane rotated in 3D would show its back face.

---

## The animation system

Attacks come in two tiers. Internally the states are named **`punch`** (Light)
and **`kick`** (Heavy). The UI labels say LIGHT and HEAVY. **Do not rename the
internal strings** — a lot of logic keys off them, and the names are only
cosmetically wrong.

There are two playback modes:

### Tiered playback

Used when a character has `lightFull` / `heavyFull` frames. Plays an 8-phase
symmetric arc across the attack duration:

| % of attack | frame shown |
|---|---|
| 0 | idle |
| 12.5 | `{tier}T1` |
| 25 | `{tier}T2` |
| 37.5 | `{tier}T3` |
| 50 | **`{tier}Full` — damage registers here** |
| 62.5 | `{tier}T3` |
| 75 | `{tier}T2` |
| 87.5 | `{tier}T1` |
| 100 | idle |

Only the forward half needs drawing; the return reuses the same frames in
reverse. Hit detection uses a tight window at `dur * 0.46–0.54` so damage lands
exactly on the full-extension frame.

Missing tier frames degrade gracefully — T3 falls back to T2, T2 to T1, T1 to
idle. Partial art deliveries work with no code change.

**Ragnarok is the only character currently on this path**, and is the reference
implementation.

### Flat playback

Everyone else. An array of frames played linearly across the attack window.
`attack` = Light, `attack2` = Heavy. If `attack2` is absent, `attack` is reused
for both (currently only Velara).

Hit detection here uses the older configurable windows,
`CFG.PUNCH_ACTIVE` / `CFG.KICK_ACTIVE`, scaled proportionally.

### Shared behaviour

- `getAttackDur()` gives sprite-animated fighters **1.6×** the base attack
  duration. Without this, multi-frame attacks flicker rather than read as
  motion.
- `getSpriteAnimTextures(id)` builds and caches `THREE.Texture` objects, one
  per fighter, only when a `Fighter` is actually constructed for that id (i.e.
  at match start for whichever two characters got picked) — not for the whole
  roster at page load. It iterates `for (const state in src)`, so **adding new
  state keys needs no code change** — just add them to the registry.
- `_setSpriteFrame(state, idx)` swaps the texture, with a short-circuit if the
  frame is already current.
- **KO bypasses `animateHD()` entirely.** The KO fall is a direct rotation tween
  in `update()`, so KO frame-swapping is handled there separately. If you add a
  new state and it mysteriously never shows during KO, this is why.

---

## Key identifiers to search for

| Search for | What it is |
|---|---|
| `const FIGHTERS` | roster definition — ids, names, taglines, colours, weapons |
| `const SPRITE_ANIM` | animated sprite frame data (the bulk of the file) |
| `const STAGE_ART` | arena backdrop images |
| `class Fighter` | fighter construction and the two rendering paths |
| `animateHD(dt)` | sprite animation + frame selection (tiered and flat) |
| `getAttackDur` | attack duration, including the 1.6× sprite multiplier |
| `const CFG` | tunables: durations, damage, ranges, hit windows |
| `function aiThink` | AI opponent state machine |

---

## Texture settings

Sprite and stage textures use `THREE.LinearFilter` for minification with
`generateMipmaps = false`. Sprites are non-power-of-two (e.g. 157×193), the
camera is fixed orthographic, and sprites render small on screen — mipmapping
bought nothing visually here and was a known WebGL1/older-mobile-GPU
compatibility risk. If a future change brings mipmaps back for some reason,
every shipped frame needs an RGB-dilation pass first: GPU mipmap generation
blends RGB and alpha together, so leftover background colour sitting under
`alpha=0` would bleed back as a visible halo at small render sizes.

## Sprite file format

Frames ship as **lossless WebP**, not PNG — see `SPRITE-PIPELINE.md` for the
conversion step. This is purely a delivery-format optimization; nothing about
frame selection, background removal, or the failure modes below changes
because of it.

---

## Removed systems

Two rendering paths that used to exist have been deleted outright, not just
made unreachable:

- **`SPRITE_ART`** — a single-static-image fallback, superseded by
  `SPRITE_ANIM` for every character that ever had it. The registry was
  confirmed empty before removal.
- **`hdModels` / GLTFLoader / IndexedDB HD-model import** — file picker,
  CDN loader script, IndexedDB persistence, parse/import/restore functions,
  and the roster "Import HD model" button. `SPRITE_ANIM` was checked first in
  the `Fighter` constructor for every character that had real art, so this
  path was dead weight for all 8 animated fighters, and the 4 procedural
  placeholders never had models imported for them either.

If a high-fidelity 3D-import mode is wanted again in the future, it should be
rebuilt deliberately rather than resurrected from this removed code — the
`Fighter` constructor and rendering pipeline have both moved on since it was
written.
