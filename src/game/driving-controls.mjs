// One mapping for Core input, keyboard, touch, help and the HUD.
export const LONG_HAUL_CONTROLS = Object.freeze({
  throttle: { keys: ['KeyW', 'ArrowUp'], label: 'Accelerate', short: 'GO', hint: 'W / ↑' },
  brake: { keys: ['KeyS', 'ArrowDown'], label: 'Brake / reverse', short: 'BRAKE', hint: 'S / ↓' },
  steerLeft: { keys: ['KeyA', 'ArrowLeft'], label: 'Steer left', short: '◀', hint: 'A / ←' },
  steerRight: { keys: ['KeyD', 'ArrowRight'], label: 'Steer right', short: '▶', hint: 'D / →' },
  drift: { keys: ['ShiftLeft', 'ShiftRight'], label: 'Drift', short: 'DRIFT', hint: 'SHIFT' },
  boost: { keys: ['Space'], label: 'Boost', short: 'BOOST', hint: 'SPACE / W ×2' },
  handbrake: { keys: ['KeyX'], label: 'Handbrake', short: 'STOP', hint: 'X' },
  abilityQ: { keys: ['KeyQ'], label: 'Ability Q', short: 'Q', hint: 'Q' },
  abilityE: { keys: ['KeyE'], label: 'Ability E', short: 'E', hint: 'E' },
  interact: { keys: ['KeyF'], label: 'Interact / recover', short: 'ACT', hint: 'F' },
  upgrades: { keys: ['KeyU'], label: 'Skills and abilities', short: 'SKILLS', hint: 'U' },
  camera: { keys: ['KeyC'], label: 'Camera', short: 'CAM', hint: 'C' },
  map: { keys: ['KeyM'], label: 'Map', short: 'MAP', hint: 'M' },
  pause: { keys: ['Escape'], label: 'Pause', short: 'Ⅱ', hint: 'ESC' },
  retry: { keys: ['KeyR'], label: 'Retry', short: 'RETRY', hint: 'R' },
});
export const LONG_HAUL_BINDINGS = Object.freeze(Object.fromEntries(
  Object.entries(LONG_HAUL_CONTROLS).map(([action, control]) => [action, Object.freeze(control.keys)])
));
export const LONG_HAUL_TOUCH_ACTIONS = Object.freeze([
  'steerLeft', 'steerRight', 'brake', 'throttle', 'drift', 'boost',
  'abilityQ', 'abilityE', 'interact', 'upgrades', 'map', 'pause',
]);
export const heldAction = (keys, action) => LONG_HAUL_BINDINGS[action]?.some(code => keys[code]) ?? false;
