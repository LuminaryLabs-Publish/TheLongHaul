import assert from "node:assert/strict";
import { createArcadeScore } from "../src/game/arcade-score.mjs";

const pass = (id, overrides = {}) => ({ id, kind: "near-miss", speed: 18, clearance: 0.8, ...overrides });
const land = (id, overrides = {}) => ({ id, kind: "landing", speed: 18, airTime: 1.2, distance: 20, ...overrides });
function advance(score, seconds, options) {
  const receipts = [];
  for (let elapsed = 0; elapsed < seconds - 1e-9; elapsed += 0.05) {
    const receipt = score.tick(Math.min(0.05, seconds - elapsed), options);
    if (receipt) receipts.push(receipt);
  }
  return receipts;
}

// Physical evidence matters: time alone, low speed, reverse and overlaps earn nothing.
{
  const score = createArcadeScore();
  for (const input of [
    pass("stopped", { speed: 0 }), pass("slow", { speed: 11.99 }),
    pass("reverse", { forward: false }), pass("negative", { speed: -20 }),
    pass("contact", { clearance: 0.05 }), pass("overlap", { clearance: -1 }),
    pass("far", { clearance: 1.8001 }), pass("dirty", { clean: false }),
    land("hop", { airTime: 0.59 }), land("small", { distance: 7.99 }),
    land("crash", { clean: false }), land("slow-land", { speed: 9.99 }),
    { id: "prop-stopped", kind: "destruction", speed: 0 },
  ]) assert.equal(score.event(input).accepted, false, input.id);
  advance(score, 60);
  assert.equal(score.snapshot().banked, 0);
  assert.equal(score.snapshot().events, 0);
}

// IDs and evidence are bounded and type checked; callers cannot mutate snapshots.
{
  const score = createArcadeScore();
  for (const id of [null, undefined, {}, 1, NaN, "", "   ", "x".repeat(161), "bad\nID"]) {
    assert.equal(score.event(pass(id)).accepted, false);
  }
  for (const speed of [NaN, Infinity, -Infinity, "20", null, undefined]) {
    assert.equal(score.event(pass("bad-speed", { speed })).accepted, false);
  }
  for (const overrides of [{ clearance: NaN }, { distance: Infinity }, { airTime: NaN }, { forward: 1 }, { clean: 1 }, { kind: "constructor" }]) {
    assert.equal(score.event(pass("bad-data", overrides)).accepted, false);
  }
  assert.equal(score.event(null).accepted, false);
  assert.equal(score.event([]).accepted, false);
  const snapshot = score.snapshot();
  snapshot.pending = 1_000_000;
  assert.equal(score.snapshot().pending, 0);
}

// Each pair builds the visible multiplier; a short interval prevents same-frame spam.
{
  const score = createArcadeScore();
  assert.equal(score.event(pass("car-1")).points, 100);
  assert.equal(score.event(pass("car-2")).reason, "event-spacing");
  advance(score, 0.15);
  assert.equal(score.event(pass("car-2")).points, 200);
  for (let i = 3; i <= 12; i++) {
    advance(score, 0.15);
    score.event(pass(`car-${i}`));
  }
  assert.equal(score.snapshot().events, 12);
  assert.equal(score.snapshot().multiplier, 5);
  assert.equal(score.snapshot().bestMultiplier, 5);
  assert.equal(score.snapshot().remaining, 4);
  assert.equal(score.snapshot().lastEvent, "NEAR MISS");
}

// Pausing freezes both countdowns and reward admission; wall-clock stalls are capped.
{
  const score = createArcadeScore();
  score.event(pass("pause-first"));
  score.tick(0, { active: false });
  const paused = score.snapshot();
  score.tick(100, { active: false });
  assert.deepEqual(score.snapshot(), paused);
  assert.equal(score.event(pass("paused-pass")).reason, "inactive");
  score.tick(0, { active: true });
  assert.equal(score.event(pass("explicit-inactive", { active: false })).reason, "inactive");
  score.tick(100);
  assert.equal(score.snapshot().remaining, 3.75);
  for (const dt of [NaN, Infinity, -Infinity, -1, 0, "1"]) score.tick(dt);
  assert.equal(score.snapshot().remaining, 3.75);
  assert.equal(advance(score, 3.7).length, 0);
  const receipts = advance(score, 0.05);
  assert.equal(receipts.length, 1);
  assert.equal(receipts[0].points, 100);
  assert.equal(score.snapshot().multiplier, 1);
  assert.equal(score.snapshot().pending, 0);
  assert.equal(advance(score, 10).length, 0);
  assert.equal(score.bank("finish"), null);
}

// Cashout/crash never release IDs, crashes keep banked points, cooldown uses active time.
{
  const score = createArcadeScore();
  score.event(pass("paid"));
  assert.equal(score.bank("delivery").points, 100);
  assert.equal(score.bank("delivery"), null);
  advance(score, 0.15);
  assert.equal(score.event(pass(" paid ")).reason, "duplicate");
  const award = score.event(land("jump-1"));
  assert.equal(award.points, 180);
  const impact = score.crash("truck");
  assert.equal(impact.lost, 180);
  assert.equal(impact.banked, 100);
  assert.equal(score.snapshot().multiplier, 1);
  assert.equal(score.snapshot().pending, 0);
  assert.equal(score.event(land("jump-1")).reason, "duplicate");
  assert.equal(score.event(pass("after-crash")).reason, "crash-cooldown");
  advance(score, 10, { active: false });
  assert.equal(score.snapshot().cooldown, 1.2);
  advance(score, 1.15);
  assert.equal(score.event(pass("still-cooling")).reason, "crash-cooldown");
  advance(score, 0.05);
  assert.equal(score.event(pass("after-crash")).accepted, true);
  assert.equal(score.crash("again").lost, 100);
  assert.equal(score.crash("same-impact").lost, 0);
  assert.equal(score.snapshot().banked, 100);
  assert.equal(score.snapshot().lostTotal, 280);
}

// Landing bonuses have a ceiling, and low-value props cannot be farmed indefinitely.
{
  const score = createArcadeScore();
  assert.equal(score.event(land("huge-jump", { airTime: 1e9, distance: 1e9 })).points, 270);
  score.bank("test");
  for (let i = 0; i < 8; i++) {
    advance(score, 0.15);
    const result = score.event({ id: `prop-${i}`, kind: "destruction", speed: 10 });
    assert.equal(result.accepted, true);
    assert.equal(result.basePoints, 25);
  }
  advance(score, 0.15);
  assert.equal(score.event({ id: "prop-extra", kind: "destruction", speed: 20 }).reason, "destruction-capacity");
  assert.equal(score.snapshot().destructionEvents, 8);
}

// Session memory stays bounded without evicting IDs and admitting replays.
{
  const score = createArcadeScore();
  for (let i = 0; i < 4096; i++) {
    assert.equal(score.event(pass(`bounded-${i}`)).accepted, true);
    advance(score, 0.15);
  }
  assert.equal(score.snapshot().seenIds, 4096);
  assert.equal(score.event(pass("over-capacity")).reason, "session-capacity");
  assert.equal(score.event(pass("bounded-0")).reason, "duplicate");
  score.bank("finish");
  const fresh = score.reset();
  assert.equal(fresh.events, 0);
  assert.equal(fresh.banked, 0);
  assert.equal(fresh.bestMultiplier, 1);
  assert.equal(fresh.seenIds, 0);
  assert.equal(score.event(pass("bounded-0")).accepted, true);
}

console.log("arcade score regression: passed (evidence, deduplication, pause, crash, cashout, bounded memory)");
