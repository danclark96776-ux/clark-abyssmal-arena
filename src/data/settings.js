// Persisted user-facing game settings: keybinds + UI scale.
// Everything here is auto-saved to localStorage on change ("on the fly"),
// there is no separate save step.
const STORAGE_KEY = 'abyssalArena.settings';

export const DEFAULT_SETTINGS = {
  uiScale: 1,
  keybinds: {
    p1: {
      left: 'KeyA',
      right: 'KeyD',
      jump: 'KeyW',
      block: 'KeyS',
      punch: 'KeyE',
      kick: 'KeyQ',
      special: 'KeyF'
    },
    p2: {
      left: 'ArrowLeft',
      right: 'ArrowRight',
      jump: 'ArrowUp',
      block: 'ArrowDown',
      punch: 'Slash',
      kick: 'Enter',
      special: 'ShiftRight'
    }
  }
};

function cloneDefaults() {
  return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
}

export function mergeSettings(base, override) {
  const merged = cloneDefaults();
  if (!override || typeof override !== 'object') return merged;
  if (typeof override.uiScale === 'number' && isFinite(override.uiScale)) {
    merged.uiScale = Math.min(1.5, Math.max(0.75, override.uiScale));
  }
  for (const who of ['p1', 'p2']) {
    const savedBinds = override.keybinds && override.keybinds[who];
    if (!savedBinds) continue;
    for (const action of Object.keys(merged.keybinds[who])) {
      if (typeof savedBinds[action] === 'string' && savedBinds[action]) {
        merged.keybinds[who][action] = savedBinds[action];
      }
    }
  }
  return merged;
}

function readStoredSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

// Live settings object — mutate its fields directly then call saveSettings().
export const SETTINGS = mergeSettings(DEFAULT_SETTINGS, readStoredSettings());

export function saveSettings() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SETTINGS));
  } catch (e) {
    // localStorage unavailable (private mode, quota, etc.) — settings still
    // work for the current session, they just won't persist across reloads.
  }
}

export function setKeybind(who, action, code) {
  if (!SETTINGS.keybinds[who] || !(action in SETTINGS.keybinds[who])) return;
  SETTINGS.keybinds[who][action] = code;
  saveSettings();
}

export function setUIScale(scale) {
  SETTINGS.uiScale = Math.min(1.5, Math.max(0.75, scale));
  saveSettings();
}

export function resetSettings() {
  const fresh = cloneDefaults();
  SETTINGS.uiScale = fresh.uiScale;
  SETTINGS.keybinds = fresh.keybinds;
  saveSettings();
}

const KEY_LABELS = {
  ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓',
  Slash: '/', Period: '.', Comma: ',', Space: 'Space',
  ShiftLeft: 'L-Shift', ShiftRight: 'R-Shift',
  ControlLeft: 'L-Ctrl', ControlRight: 'R-Ctrl',
  Enter: 'Enter'
};

export function keyLabel(code) {
  if (!code) return '—';
  if (KEY_LABELS[code]) return KEY_LABELS[code];
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  return code;
}
