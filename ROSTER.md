# Roster

Twelve slots, themed on the circles of Hell. Eight have real sprite art; four are
still procedural placeholders.

---

## Characters with art

| id | Name | Circle | Light/Heavy | Frames |
|---|---|---|---|---|
| `ragnarok` | Ragnarok, the Wrathful | Wrath | distinct (tiered) | idle 1, walk 6, full light+heavy tier sets, hit, ko |
| `velara` | Velara, the Crimson Temptress | Lust | **shared** | idle 1, walk 6, attack 3 |
| `gorvath` | Gorvath, the Maw | Gluttony | distinct | idle 1, walk 7, attack 3, attack2 3 |
| `morvane` | Morvane, the Masquerade | Fraud | distinct | idle 1, walk 6, attack 3, attack2 3 |
| `voidfang` | Voidfang (Varrak Bloodfang) | Violence | distinct | idle 1, walk 4, attack 4, attack2 4 |
| `seraphine` | Seraphine, the Fallen Seraph | Heresy | distinct | idle 1, walk 1, attack 1, attack2 1, hit, ko |
| `frostqueen` | Frostqueen | Treachery | distinct | idle 1, walk 1, attack 4, attack2 4 |
| `paleking` | The Pale King | Limbo | distinct | idle 1, walk 1, attack 3, attack2 3 |

**Ragnarok** is the only character on the tiered animation system and is the
reference implementation for it.

**Velara** is the only character whose Light and Heavy are the same animation —
she only has 3 attack frames, and splitting them 1+2 would be too thin to read as
motion. Needs new art, not a code fix.

**Only Ragnarok and Seraphine** have dedicated `hit` and `ko` frames. Everyone
else falls back to their idle pose when struck or knocked out — the single
highest-value art gap on the project.

---

## Placeholder slots (procedural rigs, no art)

| id | Current name | Status |
|---|---|---|
| `ashborn` | Ashborn, Blade of Cinders | **Being replaced by Pride.** Art exists but is not yet extracted or wired in. |
| `malphas` | Malphas, Judge of the Abyss | **Being replaced by Sloth.** Art exists but is not yet extracted or wired in. |
| `grendel` | Grendel, Bonecrusher | Keeping the slot for now; a new character name and art are planned. |
| `inferna` | Inferna, Crimson Wing | No decision yet. |

`ashborn`, `grendel` and `inferna` were originally invented as stand-ins to fill
circle slots before real art existed — Ashborn stood in for Wrath before Ragnarok
arrived, Grendel for Gluttony before Gorvath, Inferna for Lust before Velara.
They're placeholders, not established characters, so replacing or retiring them
is low-cost.

Replacing one means updating its entry in the `FIGHTERS` array (id, name,
tagline, primary/secondary/accent colours, feature, weapon, emblem) and adding a
`SPRITE_ANIM` entry.

**Note:** the two circles Pride and Sloth are filling currently have no dedicated
roster slot of their own — they're taking over placeholder slots rather than
expanding the roster past twelve.

---

## Lore constraints that affect art

**Ragnarok and The Warden are separate characters.** Ragnarok keeps his black
deformed arm. The **green gemstone belongs exclusively to the Warden** and must
not appear on Ragnarok.

This matters practically: source sheets keep reintroducing the gem, and it has
had to be manually stripped from Ragnarok's frames twice. If you regenerate him,
exclude the gem in the generation prompt.

The Warden's own role — playable fighter, or narrative-only — is undecided.

**A deferred candidate:** a green serpent/tempter character exists in the art
pile but was explicitly held back because it doesn't match "Grendel the
Bonecrusher" thematically. It may suit a different circle. Don't assign it to a
slot without checking the theme fits.
