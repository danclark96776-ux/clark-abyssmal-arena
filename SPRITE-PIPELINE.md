# Sprite pipeline

How character art gets from a source sheet into the game — and the specific ways
that has gone wrong before.

**Read the failure modes section before doing any sprite work.** Every item in it
is something that actually happened on this project and cost real time. None of
them are hypothetical.

---

## The target format

Frames live in `SPRITE_ANIM`, keyed by fighter id:

```js
const SPRITE_ANIM = {
  someguy: {
    aspect: 0.8135,          // frame width / height — keeps proportions right
    frames: {
      idle:      [ 'data:image/png;base64,...' ],
      walk:      [ ...6 frames... ],
      attack:    [ ...Light... ],
      attack2:   [ ...Heavy... ],   // optional; falls back to attack
      hit:       [ ... ],           // optional; falls back to idle
      ko:        [ ... ]            // optional; falls back to idle
    }
  }
};
```

For the **tiered** system instead of flat `attack`/`attack2`, supply:
`lightT1, lightT2, lightT3, lightFull, heavyT1, heavyT2, heavyT3, heavyFull`
(one frame each). The engine auto-detects tiered mode by the presence of
`lightFull`. See `ARCHITECTURE.md`.

Do the actual extraction/background-removal work in PNG with real alpha — it's
the easiest format to reason about and to inspect. As a **final step before
shipping**, re-encode each frame as **lossless WebP** (not lossy — this project
verifies bit-exact RGB-where-alpha>0 on every converted frame) and embed that
instead; it runs roughly a third the size of the equivalent PNG for the same
pixels, for a large file-size win at zero quality cost. `getSpriteAnimTextures()`
loads whatever keys exist regardless of the image format in the data URI, so no
code change is needed to add states or to switch formats.

---

## Generating new art

The project has moved to **Retro Diffusion** for new characters, specifically
because it **outputs genuine alpha transparency by default**. That one property
eliminates the single largest source of pain here (see failure mode 1).

Practical notes:

- Use **static generation, not the animation presets**. The presets have fixed
  frame counts and layouts and won't produce the exact tiered frame set this
  project uses. Generate each pose individually.
- Generate the **idle pose first** and use it as a reference image for every
  subsequent pose — that's what holds the character consistent. RD accepts up to
  9 reference images; in practice the idle plus whichever frame is closest in
  pose is enough.
- Generate in an order where each frame has a close neighbour to reference:
  idle → walk → light_t1 → t2 → t3 → light_full → heavy_t1 → … → hit → ko.
- **Don't let the character touch the canvas edge.** Pad the canvas. This matters
  most for `_full` poses with extended weapons or spread wings.
- Don't put "pixel art" in the prompt text — the style setting handles it, and
  including it in the prompt tends to fight the style setting.
- One canvas size per character, identical across all its frames.

Suggested naming for delivery, which maps cleanly onto the registry:

```
{id}_idle_00.png
{id}_walk_00.png … {id}_walk_0N.png
{id}_light_t1.png  {id}_light_t2.png  {id}_light_t3.png  {id}_light_full.png
{id}_heavy_t1.png  {id}_heavy_t2.png  {id}_heavy_t3.png  {id}_heavy_full.png
{id}_hit_00.png    {id}_ko_00.png
```

---

## Failure modes — read this part

### 1. Source sheets with *fake* transparency

Most older art in this project is flattened RGB with a **checkerboard pattern
baked into the pixels** to simulate transparency. There is no alpha channel.
Reconstructing transparency from these is genuinely hard and has consumed more
time than any other task here.

Why it's hard: the character's own palette overlaps the checker's colours.
Ragnarok's dark armour vs a near-black checker tile. Sloth's pale skin vs a light
checker tile. Colour thresholding either leaves checker fragments or eats the
character. Geometric tile-fitting fails too, because the checker grid drifts
across the sheet and tiles aren't perfectly uniform.

**What worked** (on a sheet whose dark tile was mid-grey ~118, leaving a real gap
above the armour values):

1. Tight colour match on both checker values, tolerance ~11.
2. Add anti-aliased "seam" pixels — greys *between* the two checker values that
   sit adjacent to already-matched background.
3. Keep only the largest connected opaque component, plus components >2% of frame
   area, then `binary_fill_holes`.

**Prefer regenerating a character over fighting a checkerboard sheet.** It is
usually faster.

### 2. Neighbouring sprites bleeding into frames

A scan once found **67 of 91 frames** contained fragments of *adjacent characters*
captured by over-wide crop boundaries. Velara's attack frames contained part of
Gorvath. Voidfang's contained the Frozen Prince.

This is nearly invisible in a still frame and shows up in play as a second
character flickering at the screen edge.

Automated fix, by connected-component analysis:
1. Drop side-hugging blobs that don't horizontally overlap the main character.
2. Drop side-hugging blobs whose centroid sits >33% of frame width from the main
   character's centroid (catches the overlapping cases the first pass misses).

**Run an equivalent check after any re-extraction.**

### 3. Pinholes letting background through

Small holes inside a silhouette let the arena show through the character. Fix by
`binary_fill_holes`, but **only fill small holes** — a size cap of roughly
`max(12px, 0.08% of frame area)` — otherwise you'll fill legitimate gaps like the
space between an arm and the body. 72 frames needed this once.

### 4. Duplicate frames pretending to be animation

Several source sheets have had "idle" rows that were the same pose repeated
across every cell, and columns whose labels didn't match their contents (a sheet
labelled `light_t1` above and `light_t2` below the same column).

**Pixel-diff adjacent frames before trusting labels.** A mean absolute difference
below roughly 15–20 on aligned crops means it's the same pose with anti-aliasing
noise, not a real animation frame.

### 5. Wrong character entirely

One Ragnarok sheet's `ko` cell contained *Sloth*. Sheets are not always
internally consistent. Look at every frame.

### 6. Verify visually, on two backgrounds

This project has repeatedly shipped "looks fine" fixes that were not fine.
Numeric checks (transparency %, border opacity) are useful screens but have
produced both false positives and false negatives.

Composite each frame onto **at least two different-coloured backgrounds** — a
mid-green and a magenta work well — zoom in, and actually look before calling it
done. Artifacts often only show against one particular colour.

---

## Flat vs tiered: which to use

Tiered is not automatically better. It fits art drawn as a **half arc** —
wind-up poses building to a single full-extension frame — because the engine
mirrors the return for free.

It's a *downgrade* for art drawn as a **set of distinct action poses**, because
6 source frames only map onto 4 tier slots and 2 get silently discarded.

Ragnarok's art arrived as explicit `t1/t2/t3/full` poses, so tiering fit exactly.
The other characters' art didn't, and was deliberately left flat after checking.
Judge per character, and look at the frames before converting.
