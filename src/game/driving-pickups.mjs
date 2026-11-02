// Run-local collectibles. Timers only consume active simulation time.
const bounded = (value, lo, hi) => Number.isFinite(value) ? Math.max(lo, Math.min(hi, value)) : lo;
export const PICKUP_DEFINITIONS = Object.freeze({
  repair: { label: 'STEERING REPAIRED · +12 HULL', color: 0x80efad, symbol: '+', duration: 0 },
  boost: { label: 'BOOST +25% · 12s', color: 0xffc477, symbol: '»', duration: 12 },
  ability: { label: 'ABILITY POWER +50% · 15s', color: 0x9c94ff, symbol: 'Q', duration: 15 },
  focus: { label: 'COMBO +25% · XP +35% · 15s', color: 0x71e9f4, symbol: '×', duration: 15 },
});
export function createDrivingPickups() {
  const seen = new Set();
  let retiredThrough = -1;
  let timers = { boost: 0, ability: 0, focus: 0 };
  const endlessIndex = id => /^pickup:endless:\d+$/.test(id) ? Number(id.split(':').at(-1)) : null;
  const has = id => seen.has(id) || (endlessIndex(id) !== null && endlessIndex(id) <= retiredThrough);
  const snapshot = () => ({ timers: { ...timers }, collected: seen.size, retiredThrough,
    boostMultiplier: timers.boost > 0 ? 1.25 : 1,
    abilityEnhancement: timers.ability > 0 ? .5 : 0,
    xpMultiplier: timers.focus > 0 ? 1.35 : 1,
    comboMultiplier: timers.focus > 0 ? 1.25 : 1 });
  return {
    reset() { seen.clear(); retiredThrough = -1; timers = { boost: 0, ability: 0, focus: 0 }; },
    has,
    retireThrough(index) {
      if (!Number.isSafeInteger(index) || index < retiredThrough) return;
      retiredThrough = index;
      for (const id of seen) if (endlessIndex(id) !== null && endlessIndex(id) <= index) seen.delete(id);
    },
    checkpoint() { return { version: 1, seenIds: [...seen], timers: { ...timers }, retiredThrough }; },
    restoreCheckpoint(value) {
      if (value?.version !== 1 || !Array.isArray(value.seenIds) || value.seenIds.length > 8192) return false;
      if (!value.seenIds.every(id => typeof id === 'string' && id.length > 0 && id.length <= 180)) return false;
      if (!Number.isSafeInteger(value.retiredThrough) || value.retiredThrough < -1) return false;
      if (!Object.keys(timers).every(key => Number.isFinite(value.timers?.[key]) && value.timers[key] >= 0 && value.timers[key] <= PICKUP_DEFINITIONS[key].duration)) return false;
      seen.clear(); for (const id of value.seenIds) seen.add(id);
      retiredThrough = value.retiredThrough;
      for (const key of Object.keys(timers)) timers[key] = value.timers[key];
      return true;
    },
    collect({ id, kind, active = true, distance, height = 0 } = {}) {
      if (!active || typeof id !== 'string' || !id || id.length > 180 || !Object.hasOwn(PICKUP_DEFINITIONS, kind) ||
        !Number.isFinite(distance) || distance > 3.3 || distance < 0 || !Number.isFinite(height) || Math.abs(height) > 3.5 || has(id) || seen.size >= 8192) return { accepted: false };
      seen.add(id);
      if (kind !== 'repair') timers[kind] = Math.max(timers[kind], PICKUP_DEFINITIONS[kind].duration);
      return { accepted: true, id, kind, label: PICKUP_DEFINITIONS[kind].label, repair: kind === 'repair' ? 12 : 0 };
    },
    tick(dt, { active = true } = {}) {
      if (!active || !Number.isFinite(dt) || dt <= 0) return snapshot();
      for (const key of Object.keys(timers)) timers[key] = Math.max(0, timers[key] - bounded(dt, 0, .25));
      return snapshot();
    },
    snapshot,
  };
}
