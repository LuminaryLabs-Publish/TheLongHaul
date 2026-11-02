import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import {
  CAMPAIGN_STATE_CODES, freshCampaignSave, normalizeCampaignSave, readCampaignSave,
  campaignShipRoute, campaignHawaiiHaul, applyCampaignShipTransfer
} from "../src/campaign-policy.mjs";
import { routeToCourse } from "../src/game/geographic-route.mjs";

assert.equal(CAMPAIGN_STATE_CODES.length, 50);
const fresh = freshCampaignSave();
assert.deepEqual(readCampaignSave(null), { readable: true, save: fresh, reason: "" });
assert.deepEqual(normalizeCampaignSave({}), fresh, "missing fields in older saves receive defaults");
assert.equal(normalizeCampaignSave({ cash: "2450", upgrades: { engine: "2" } }).upgrades.engine, 2, "legacy numeric fields remain compatible");
assert.deepEqual(normalizeCampaignSave({ truck: "semi" }).ownedTrucks, ["delivery", "semi"], "legacy truck selection predates ownership arrays");
assert.notEqual(freshCampaignSave().upgrades, freshCampaignSave().upgrades);

const freightJourney = { schema: "long-haul.freight-checkpoint/1", revision: 14, journey: { sessionId: "continuous-ship-test", index: 23 }, future: { property: [2, 7] } };
const saved = {
  ...fresh, location: "CA", visited: ["NJ", "CA"], coast: true, cash: 6450, deliveries: 6, careerMiles: 3200,
  truck: "semi", ownedTrucks: ["delivery", "semi"], upgrades: { ...fresh.upgrades, armor: 3, futureUpgrade: { calibration: "unchanged" } },
  freightJourney, freightReceipts: ["haul:21", "haul:22"], futureField: { version: 5 },
  completedCampaignAttempts: ["attempt1"], failedCampaignAttempts: ["attempt2"]
};
const original = structuredClone(saved);
const normalized = normalizeCampaignSave(saved);
assert.deepEqual(normalized, saved, "valid progression and unknown owner fields pass through intact");
assert.deepEqual(readCampaignSave(JSON.stringify(saved)).save, saved);
normalized.visited.push("OR");
normalized.upgrades.armor = 4;
assert.deepEqual(saved, original, "normalization never mutates the source save");

const corrupt = [
  "{not-json", "null", "[]", "false", "123", '"save"',
  ...[
    { cash: -1 }, { cash: "not money" }, { cash: "" }, { cash: null }, { cash: false }, { cash: 2.5 }, { cash: Number.MAX_SAFE_INTEGER + 1 },
    { careerMiles: -5 }, { deliveries: 2.5 }, { deliveries: Number.MAX_SAFE_INTEGER + 1 },
    { location: "ZZ" }, { visited: ["NJ", "ZZ"] }, { visited: "NJ" },
    { coast: "false" }, { mastered: {} }, { mastered: [8] },
    { truck: "unknown" }, { truck: "heavy", ownedTrucks: ["delivery"] },
    { ownedTrucks: ["delivery", 2] }, { upgrades: [] }, { upgrades: null },
    { upgrades: { engine: 999 } }, { upgrades: { engine: -1 } }, { upgrades: { engine: 1.5 } },
    { upgrades: { engine: false } }, { completedCampaignAttempts: {} }, { failedCampaignAttempts: [null] }
  ].map(value => JSON.stringify({ ...fresh, ...value }))
];
for (const raw of corrupt) {
  const result = readCampaignSave(raw);
  assert.equal(result.readable, false, `invalid save is read-only: ${raw}`);
  assert.ok(result.reason);
  assert.deepEqual(result.save, fresh, "the UI has safe read-only defaults, without approving a write");
}

const states = new Map([
  ["CA", { code: "CA", name: "California", lat: 37.3, lon: -119.5 }],
  ["HI", { code: "HI", name: "Hawaii", lat: 20.8, lon: -156.4 }]
]);
const lookup = code => states.get(code);
assert.equal(campaignShipRoute(fresh, lookup), null);
assert.equal(campaignShipRoute({ ...fresh, location: "CA", deliveries: 5 }, lookup), null, "the expedition gate is retained");
assert.equal(campaignShipRoute({ ...fresh, location: "CA", deliveries: 6 }, lookup)?.to.code, "HI");
const outbound = campaignShipRoute(saved, lookup);
assert.equal(outbound.transport, "ship");
assert.equal(outbound.reward, 0);
assert.equal(outbound.fee, 0);
assert.equal(outbound.mile, 0);
const arrived = applyCampaignShipTransfer(saved, outbound);
assert.equal(arrived.location, "HI");
assert.deepEqual(arrived.visited, ["NJ", "CA", "HI"]);
for (const [key, value] of Object.entries(saved)) if (!["location", "visited"].includes(key)) assert.deepEqual(arrived[key], value, `${key} survives the transfer`);
assert.deepEqual(saved, original, "shipping cannot mutate the caller's save before persistence succeeds");
assert.throws(() => applyCampaignShipTransfer(arrived, outbound), /not available/, "a stale outbound transfer cannot be replayed from Hawaii");
assert.throws(() => applyCampaignShipTransfer({ ...fresh, location: "CA" }, outbound), /not available/, "a forged route cannot bypass the expedition gate");
assert.throws(() => applyCampaignShipTransfer(saved, { ...outbound, transport: "road" }), /not available/);
assert.throws(() => applyCampaignShipTransfer(saved, { ...outbound, to: { code: "AK" } }), /not available/);

let traveling = arrived;
for (let index = 0; index < 100; index++) traveling = applyCampaignShipTransfer(traveling, campaignShipRoute(traveling, lookup));
assert.equal(traveling.cash, saved.cash, "100 transfers award no farmable cash");
assert.equal(traveling.deliveries, saved.deliveries);
assert.equal(traveling.careerMiles, saved.careerMiles);
assert.deepEqual(traveling.freightJourney, freightJourney);
assert.deepEqual(traveling.freightReceipts, saved.freightReceipts);
assert.equal(traveling.visited.filter(code => code === "HI").length, 1);
const strandedLegacy = { ...fresh, location: "HI", visited: ["HI"] };
assert.equal(campaignShipRoute(strandedLegacy, lookup).to.code, "CA", "legacy Hawaii saves always have a mainland return");
assert.equal(applyCampaignShipTransfer(strandedLegacy, campaignShipRoute(strandedLegacy, lookup)).location, "CA");

const islandHaul = campaignHawaiiHaul();
assert.equal(islandHaul.transport, "road");
assert.equal(islandHaul.from.code, "HI");
assert.equal(islandHaul.to.code, "HI");
assert.notDeepEqual(islandHaul.from, islandHaul.to);
assert.equal(islandHaul.reward, 2300, "the previously advertised Hawaii freight reward remains available for driving");
// The adapter contract can be checked with two supplied endpoints; actual OSRM alignment is a separate browser/network gate.
const islandCourse = routeToCourse(islandHaul, [[islandHaul.from.lon, islandHaul.from.lat], [islandHaul.to.lon, islandHaul.to.lat]]);
assert.equal(islandCourse.geography.from, "HI");
assert.equal(islandCourse.geography.to, "HI");
assert.ok(islandCourse.edges.length >= 2);
assert.ok(islandCourse.depots.some(depot => depot.id === islandCourse.validDepotId));

const campaign = readFileSync(new URL("../campaign.html", import.meta.url), "utf8");
const source = campaign.match(/<script type="module">([\s\S]*?)<\/script>/)[1];
const parsed = spawnSync(process.execPath, ["--input-type=module", "--check"], { input: source, encoding: "utf8" });
assert.equal(parsed.status, 0, parsed.stderr);
console.log(`Campaign policy passed (${corrupt.length} corrupt-save cases, unknown freight preservation, expedition gates, 100 reward-free ship transfers, real-road adapter and module syntax).`);
