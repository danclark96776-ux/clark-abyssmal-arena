# Abyssal Arena

A browser-based 2.5D fighting game. Twelve-character roster themed on Dante's
Inferno, extended to twelve circles of Hell — each fighter tied to a sin, a
signature colour, and their own arena.

**Everything is one file: `abyssal-arena.html` (~4.3 MB).** Open it in a browser
and it runs. No build step, no server, no dependencies to install (besides the
Three.js CDN script, see below). All game logic, all sprite frames (base64
WebP), and all stage backdrops are embedded inline.

Keeping it a single portable file is a **deliberate design requirement**, not an
oversight. Don't "improve" it by splitting assets out into folders.

---

## Running it

Double-click `abyssal-arena.html`, or drag it into a browser tab. That's it.

Three.js r128 loads from CDN, so first load needs internet. Once cached it
runs offline.

**Controls**

| Action | Keyboard (P1) | Keyboard (P2) | Touch |
|---|---|---|---|
| Move | A / D | ← / → | on-screen D-pad |
| Jump | W | ↑ | ▲ button |
| Block | S | ↓ | GUARD |
| Light attack | J | 1 | LIGHT |
| Heavy attack | K | 2 | HEAVY |

Two-player local mode is a toggle on the menu screen. Otherwise you fight the AI.

---

## Project layout

```
abyssal-arena.html      the entire game
README.md               this file
ARCHITECTURE.md         how the code is organised, where things live
SPRITE-PIPELINE.md      how character art gets from a source sheet into the game
ROSTER.md               who exists, who doesn't, what art is still needed
```

Read `ARCHITECTURE.md` before changing code. Read `SPRITE-PIPELINE.md` before
touching any character art — that one documents several failure modes that have
cost real time on this project, and it's worth ten minutes to not rediscover
them.

---

## Current state, honestly

**8 of 12 characters have real sprite art.** The other 4 (`ashborn`, `malphas`,
`grendel`, `inferna`) still render as procedural low-poly 3D placeholder rigs.
They're playable, they just don't look finished.

**Two of those four are already spoken for** — Pride is replacing `ashborn` and
Sloth is replacing `malphas`, with art in hand but not yet extracted and wired
in. `grendel` and `inferna` are undecided (see `ROSTER.md`). The Warden
(distinct from Ragnarok — see the lore note in `ROSTER.md`) and Lumen Noctis
(Envy) are both confirmed as wanting a playable slot eventually, pending art.

**Ragnarok** is on a **tiered** animation system (idle → t1 → t2 → t3 → full →
t3 → t2 → t1 → idle, mirrored for Light and Heavy) and is the reference
implementation for it — see `ARCHITECTURE.md`. Everyone else with art uses flat
per-state frame arrays.

**Known rough edges**
- Velara's Light and Heavy attacks use the same 3-frame animation, because
  that's all the art she has. Everyone else with art has distinct Light/Heavy.
- Only Ragnarok and Seraphine have dedicated `hit` and `ko` frames; everyone
  else falls back to their idle pose when struck or knocked out — the single
  highest-value art gap on the project.

**Already done, not still "opportunities":**
- Sprite frames ship as **lossless WebP**, not PNG (~48% smaller than the
  original PNG payload for the same pixels, verified bit-exact wherever
  alpha>0).
- Sprite and stage textures use plain `LinearFilter` with mipmaps disabled —
  no more NPOT+mipmap WebGL1 compatibility risk.
- The dead `hdModels`/GLTFLoader/IndexedDB HD-import pipeline and the empty
  `SPRITE_ART` registry have been removed entirely.
- Texture instantiation (`getSpriteAnimTextures()`) already only ever runs for
  the two selected fighters, at match start — not eagerly for all 8 at page
  load. (The embedded base64 for all characters still has to be *downloaded*
  in one request, since that's inherent to a single-file build — but nothing
  gets decoded into a GPU texture until it's actually needed.)

---

## If you're picking this up in Claude Code

Good first tasks, roughly in order of value:

1. **Extract and wire in Pride and Sloth** — art exists, process is documented
   in `SPRITE-PIPELINE.md`. They replace the `ashborn` and `malphas` slots
   respectively, not new slots.
2. **Fill the `hit`/`ko` gap** — only Ragnarok and Seraphine have it; everyone
   else falling back to idle on a knockdown is the most visible remaining
   rough edge.
3. **Decide `grendel` / `inferna` / the Warden's role / Lumen Noctis** — see
   the open questions in `ROSTER.md`. Don't build any of these without a
   decision from the project owner first; there's history here of placeholder
   names getting mistaken for committed characters.

Before any large sprite operation, copy the HTML to a `.BACKUP.html` first.
Sprite bugs are easy to introduce and hard to spot in a still frame. Always
verify new frames on two different-coloured backgrounds before shipping (see
`SPRITE-PIPELINE.md`).

---

## Lore & planning docs

Background material from earlier planning, kept for reference:
[vision overview](https://github.com/user-attachments/files/31376063/00-vision-overview.md) ·
[world lore](https://github.com/user-attachments/files/31376065/01-world-lore.md) ·
[characters](https://github.com/user-attachments/files/31376066/02-characters.md) ·
[art style guide](https://github.com/user-attachments/files/31376067/03-art-style-guide.md) ·
[3D asset status](https://github.com/user-attachments/files/31376069/04-3d-asset-status.md) ·
[open questions](https://github.com/user-attachments/files/31376070/05-open-questions-gaps.md) ·
[CONTRIBUTING](https://github.com/user-attachments/files/31376074/CONTRIBUTING.md)

These predate the current `ROSTER.md`/`ARCHITECTURE.md` docs and haven't all
been reconciled with the decisions made since — `ROSTER.md` is the current
source of truth for roster questions.
