// A burst and its recharge use simulation time: menus never refill a boost.
// The input host filters keyboard repeat; two different forward keys do not pair.
export function createForwardBoost() {
  const taps = new Map();
  const duration = 5, recharge = 3;
  let remaining = 0, cooldown = 0;
  return {
    tap(code, now) {
      if (!["KeyW", "ArrowUp"].includes(code) || !Number.isFinite(now)) return false;
      if (remaining > 0 || cooldown > 0) { taps.clear(); return false; }
      const previous = taps.get(code);
      if (previous !== undefined && now <= previous) return false;
      taps.set(code, now);
      if (previous === undefined || now - previous > 300) return false;
      taps.clear(); remaining = duration; return true;
    },
    advance(dt, { cancel = false } = {}) {
      let elapsed = Number.isFinite(dt) ? Math.max(0, dt) : 0;
      if (cancel) {
        if (remaining > 0) cooldown = Math.max(cooldown, recharge);
        remaining = 0; taps.clear();
      }
      if (remaining > 0) {
        const consumed = Math.min(remaining, elapsed);
        remaining = Math.max(0, remaining - consumed); elapsed -= consumed;
        if (remaining < 1e-9) { remaining = 0; cooldown = recharge; taps.clear(); }
      }
      if (remaining === 0) cooldown = Math.max(0, cooldown - elapsed);
      return remaining > 0;
    },
    // A fresh run clears both clocks. Pause, focus loss and recovery preserve
    // recharge, including the cost of cancelling an unfinished burst.
    reset({ preserveCooldown = false } = {}) {
      cooldown = preserveCooldown ? Math.max(cooldown, remaining > 0 ? recharge : 0) : 0;
      remaining = 0; taps.clear();
    },
    clearTaps() { taps.clear(); },
    get remaining() { return remaining; },
    get cooldown() { return cooldown; },
    get ready() { return remaining === 0 && cooldown === 0; },
    get duration() { return duration; },
    get recharge() { return recharge; },
    snapshot() { return { remaining, cooldown, ready: remaining === 0 && cooldown === 0 }; }
  };
}
