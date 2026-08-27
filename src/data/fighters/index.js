import ragnarok from './ragnarok.js';
import velara from './velara.js';
import gorvath from './gorvath.js';
import morvane from './morvane.js';
import ashborn from './ashborn.js';
import voidfang from './voidfang.js';
import seraphine from './seraphine.js';
import malphas from './malphas.js';
import grendel from './grendel.js';
import frostqueen from './frostqueen.js';
import inferna from './inferna.js';
import paleking from './paleking.js';
import shitler from './shitler.js';

/* Each fighter's visuals, combat stats, and lore now live in their own file
   under src/data/fighters/ — this module just assembles the roster in the
   order it should appear in the UI. */
export const FIGHTERS = [
  ragnarok,
  velara,
  gorvath,
  morvane,
  ashborn,
  voidfang,
  seraphine,
  malphas,
  grendel,
  frostqueen,
  inferna,
  paleking,
  shitler
];
