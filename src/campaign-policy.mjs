// Campaign persistence and transfers are separate from driving and freight payouts.
// Unknown fields belong to their existing owners and pass through unchanged.
export const CAMPAIGN_STATE_CODES = Object.freeze("AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY".split(" "));
export const CAMPAIGN_FLEET_IDS = Object.freeze(["delivery", "box", "semi", "heavy"]);
export const CAMPAIGN_UPGRADE_IDS = Object.freeze(["engine", "brakes", "handling", "fuel", "efficiency", "transmission", "tires", "suspension", "armor", "boost"]);

export function freshCampaignSave() {
  return {
    location: "NJ", visited: ["NJ"], mastered: [], cash: 1800,
    truck: "delivery", ownedTrucks: ["delivery"],
    upgrades: Object.fromEntries(CAMPAIGN_UPGRADE_IDS.map(id => [id, 0])),
    deliveries: 0, careerMiles: 0, coast: false
  };
}

const has = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const isRecord = value => Boolean(value && typeof value === "object" && !Array.isArray(value));
function numberField(value, field, { integer = false, maximum = Infinity } = {}) {
  if ((typeof value !== "number" && typeof value !== "string") || (typeof value === "string" && !value.trim())) throw Error(`Invalid campaign ${field}.`);
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0 || number > maximum || (integer && !Number.isSafeInteger(number))) throw Error(`Invalid campaign ${field}.`);
  return number;
}
function stringList(value, field, allowed = null) {
  if (!Array.isArray(value) || value.some(item => typeof item !== "string" || !item || (allowed && !allowed.includes(item)))) throw Error(`Invalid campaign ${field}.`);
  return [...new Set(value)];
}

export function normalizeCampaignSave(source) {
  if (!isRecord(source)) throw Error("Invalid campaign save.");
  const base = freshCampaignSave(), result = { ...base, ...source };
  if (has(source, "location") && !CAMPAIGN_STATE_CODES.includes(source.location)) throw Error("Invalid campaign location.");
  if (has(source, "visited")) result.visited = stringList(source.visited, "visited", CAMPAIGN_STATE_CODES);
  if (!result.visited.includes(result.location)) result.visited.push(result.location);
  for (const field of ["mastered", "completedCampaignAttempts", "failedCampaignAttempts"]) {
    if (has(source, field)) result[field] = stringList(source[field], field);
  }
  for (const field of ["cash", "careerMiles", "deliveries"]) {
    if (has(source, field)) result[field] = numberField(source[field], field, { integer: field === "deliveries" || field === "cash" });
  }
  if (has(source, "coast") && typeof source.coast !== "boolean") throw Error("Invalid campaign coast milestone.");
  if (has(source, "truck") && !CAMPAIGN_FLEET_IDS.includes(source.truck)) throw Error("Invalid campaign truck.");
  if (has(source, "ownedTrucks")) result.ownedTrucks = stringList(source.ownedTrucks, "owned trucks", CAMPAIGN_FLEET_IDS);
  else if (!result.ownedTrucks.includes(result.truck)) result.ownedTrucks.push(result.truck); // Older saves predate fleet ownership.
  if (!result.ownedTrucks.includes("delivery")) result.ownedTrucks.unshift("delivery");
  if (!result.ownedTrucks.includes(result.truck)) throw Error("Selected campaign truck is not owned.");
  if (has(source, "upgrades") && !isRecord(source.upgrades)) throw Error("Invalid campaign upgrades.");
  result.upgrades = { ...base.upgrades, ...source.upgrades };
  for (const id of CAMPAIGN_UPGRADE_IDS) {
    if (source.upgrades && has(source.upgrades, id)) result.upgrades[id] = numberField(source.upgrades[id], `upgrade ${id}`, { integer: true, maximum: 5 });
  }
  return result;
}

export function readCampaignSave(raw) {
  try {
    return { readable: true, save: raw === null ? freshCampaignSave() : normalizeCampaignSave(JSON.parse(raw)), reason: "" };
  } catch (error) {
    return { readable: false, save: freshCampaignSave(), reason: error.message };
  }
}

export function campaignShipRoute(save, lookup) {
  const from = save.location;
  const to = from === "HI" ? "CA" : from === "CA" && (save.coast || save.deliveries >= 6) ? "HI" : null;
  if (!to) return null;
  return {
    id: `${from}-${to}`, from: { ...lookup(from) }, to: { ...lookup(to) },
    transport: "ship", fee: 0, mile: 0, duration: 0, reward: 0,
    challenge: to === "HI" ? "HAWAII · SHIP TRANSFER" : "CALIFORNIA · RETURN SHIP",
    index: from === "HI" ? 1 : 6
  };
}

export function campaignHawaiiHaul() {
  // A real road on one island; shipping never creates a road across the ocean.
  return {
    id: "HI-KAHULUI-KIHEI", transport: "road",
    from: { code: "HI", name: "Kahului, Maui", lat: 20.8893, lon: -156.4729 },
    to: { code: "HI", name: "Kihei, Maui", lat: 20.7644, lon: -156.4450 },
    mile: 18, duration: 85, reward: 2300, challenge: "MAUI COASTAL FREIGHT", index: 0
  };
}

export function applyCampaignShipTransfer(source, route) {
  const save = normalizeCampaignSave(source);
  const origin = route?.from?.code, destination = route?.to?.code;
  if (route?.transport !== "ship" || origin !== save.location || route.id !== `${origin}-${destination}` ||
      !((origin === "CA" && destination === "HI" && (save.coast || save.deliveries >= 6)) || (origin === "HI" && destination === "CA"))) {
    throw Error("This ship transfer is not available from the current dispatch.");
  }
  // No delivery receipt, cash, miles, or haul count changes: repeated transfers cannot farm rewards.
  return { ...save, location: destination, visited: [...new Set([...save.visited, destination])] };
}
