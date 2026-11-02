import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { createSkillProgression } from '../src/game/skill-progression.mjs';
import { createActiveAbilities } from '../src/game/active-abilities.mjs';
import { readCampaignSave, freshCampaignSave } from '../src/campaign-policy.mjs';

// Execute the actual host boundary, not a duplicate implementation. DOM/audio
// adapters are inert; the real progression and ability modules remain in use.
const source = await readFile(new URL('../src/app/app-chunk-21.js', import.meta.url), 'utf8');
const persistence = source.slice(source.indexOf('function skillStoredRevision('), source.indexOf('function ensureSkillRun('));
const purchase = source.slice(source.indexOf('function skillPurchase('), source.indexOf('function equipSkillAbility('));
assert.ok(persistence.includes('function refreshSkillSave(') && purchase.includes('persistSkills(candidate)'));
const key = 'longhaul-campaign-v1';
const event = id => ({ id, kind: 'near-miss', speed: 20, clearance: .8, clean: true, forward: true, active: true });

function storageHub(saved) {
  return {
    raw: JSON.stringify(saved), writes: 0, delivered: 0, queue: [], tabs: [],
    write(sender, raw) {
      if (raw === this.raw) return;
      this.raw = raw; this.writes++;
      for (const tab of this.tabs) if (tab !== sender) this.queue.push({ tab, raw });
    },
    pump(limit = 16) {
      let count = 0;
      while (this.queue.length) {
        assert.ok(count++ < limit, 'Storage callbacks must terminate without echo writes.');
        const { tab, raw } = this.queue.shift(); this.delivered++;
        tab.storageListener({ key, newValue: raw });
      }
      return count;
    },
  };
}

function activeTab(hub, runId) {
  const original = readCampaignSave(hub.raw).save;
  const model = createSkillProgression(original.skillProgression);
  const savedRevision = model.snapshot().revision;
  model.startRun(runId);
  const tab = { menuOpen: true, unreadable: false, unwritable: false, menuRenders: 0, storageListener: null };
  const storage = {
    getItem(name) { assert.equal(name, key); if (tab.unreadable) throw Error('Storage read denied'); return hub.raw; },
    setItem(name, raw) { assert.equal(name, key); if (tab.unwritable) throw Error('Storage full'); hub.write(tab, raw); },
  };
  const context = {
    SKILL_SAVE_KEY: key, skillProgression: model, skillSavedRevision: savedRevision,
    skillRunId: runId, skillPersistence: 'saved', skillTuningKey: 'previous', arcadeCachedSave: original, arcadeConfiguredRun: '',
    localStorage: storage, readCampaignSave, createSkillProgression,
    activeAbilities: createActiveAbilities({ slots: model.snapshot().slots, levels: model.snapshot().abilities }),
    arcadeUpgradeState: () => { try { return readCampaignSave(storage.getItem(key)).save; } catch { return freshCampaignSave(); } },
    arcadeSaveWritable: () => { try { return readCampaignSave(storage.getItem(key)).readable; } catch { return false; } },
    window: { addEventListener(type, callback) { assert.equal(type, 'storage'); tab.storageListener = callback; } },
    skillMenuOpen: () => tab.menuOpen,
    renderSkillMenu: () => { tab.menuRenders++; },
    closeSkillMenu: () => { tab.menuOpen = false; },
    arcadeApplyUpgrades() {}, updateSkillVehicleAppearance() {}, arcadeRecord() {}, toast() {}, audio: { good() {} },
  };
  tab.context = vm.createContext(context);
  vm.runInContext(persistence + '\n' + purchase, tab.context);
  hub.tabs.push(tab);
  return tab;
}

function savedCareer(runId = 'run:A') {
  const model = createSkillProgression({ totalXp: 1200 });
  model.startRun(runId); model.event(event('already-A'));
  return { ...freshCampaignSave(), cash: 4321, upgrades: { engine: 2 }, deliveries: 3, careerMiles: 147, skillProgression: model.serialize() };
}

{
  const hub = storageHub(savedCareer()), a = activeTab(hub, 'run:A'), b = activeTab(hub, 'run:B');
  b.context.skillProgression.event(event('already-B'));
  assert.equal(b.context.persistSkills(), true);
  assert.equal(hub.pump(), 1, 'The other open menu performs one read-only refresh.');
  assert.equal(hub.writes, 1, 'No callback echoes the originating mutation.');
  const afterA = a.context.skillProgression.snapshot(), afterB = b.context.skillProgression.snapshot();
  assert.equal(afterA.runId, 'run:A'); assert.equal(afterB.runId, 'run:B');
  assert.equal(afterA.totalXp, afterB.totalXp);
  assert.deepEqual(afterA.seenIds, ['already-A']);
  assert.deepEqual(afterB.seenIds, ['already-B']);
  assert.equal(a.context.skillProgression.event(event('already-A')).reason, 'duplicate');
  assert.equal(a.context.skillSavedRevision, JSON.parse(hub.raw).skillProgression.revision);
  const beforeUnrelated = JSON.stringify(a.context.skillProgression.snapshot());
  const cashOnly = JSON.parse(hub.raw); cashOnly.cash += 10; hub.write(null, JSON.stringify(cashOnly)); hub.pump();
  assert.equal(JSON.stringify(a.context.skillProgression.snapshot()), beforeUnrelated, 'Unrelated career writes do not revise or clear the local model.');
  assert.equal(a.context.arcadeCachedSave.cash, cashOnly.cash);
  assert.equal(hub.writes, 2);

  const pointsBefore = a.context.skillProgression.snapshot().points;
  const purchased = a.context.skillPurchase('engine');
  assert.equal(purchased.accepted, true);
  const committed = hub.raw, staleBefore = b.context.skillProgression.snapshot();
  const stale = b.context.skillPurchase('engine');
  assert.equal(stale.accepted, false); assert.equal(stale.reason, 'conflict');
  assert.equal(b.context.skillProgression.snapshot().points, staleBefore.points);
  assert.equal(hub.raw, committed, 'A stale second purchase does not overwrite the first purchase.');
  assert.equal(hub.pump(), 1);
  const current = b.context.skillProgression.snapshot();
  assert.equal(current.points, pointsBefore - 1);
  assert.equal(current.stats.engine, 1);
  assert.equal(current.runId, 'run:B');
  assert.deepEqual(current.seenIds, ['already-B']);
  assert.equal(hub.writes, 3, 'Only the intentional purchase added another write.');
  assert.equal(JSON.parse(hub.raw).cash, cashOnly.cash);
  assert.equal(JSON.parse(hub.raw).upgrades.engine, 2);
  assert.equal(JSON.parse(hub.raw).careerMiles, 147);
}

{
  const hub = storageHub(savedCareer('run:shared')), a = activeTab(hub, 'run:shared'), b = activeTab(hub, 'run:shared');
  // Receipts still held by this live tab survive importing a newer same-run save.
  a.context.skillProgression.event(event('local-receipt'));
  b.context.skillProgression.event(event('remote-receipt')); b.context.persistSkills(); hub.pump();
  assert.deepEqual(new Set(a.context.skillProgression.snapshot().seenIds), new Set(['already-A', 'local-receipt', 'remote-receipt']));
  assert.equal(a.context.skillProgression.event(event('local-receipt')).reason, 'duplicate');
  assert.equal(a.context.skillProgression.event(event('remote-receipt')).reason, 'duplicate');
  assert.equal(hub.writes, 1);
}

{
  const hub = storageHub(savedCareer()), tab = activeTab(hub, 'run:A');
  const before = JSON.stringify(tab.context.skillProgression.snapshot()), original = hub.raw;
  tab.unreadable = true;
  assert.equal(tab.context.refreshSkillSave(), false);
  assert.equal(tab.context.skillPersistence, 'unavailable');
  assert.equal(JSON.stringify(tab.context.skillProgression.snapshot()), before, 'A transient read failure cannot replace earned progression with fresh defaults.');
  assert.equal(hub.raw, original); assert.equal(hub.writes, 0);
  tab.unreadable = false; hub.raw = '{"cash":1234,';
  assert.equal(tab.context.refreshSkillSave(), false);
  assert.equal(JSON.stringify(tab.context.skillProgression.snapshot()), before);
  assert.equal(hub.raw, '{"cash":1234,'); assert.equal(hub.writes, 0);
  hub.raw = original; assert.equal(tab.context.refreshSkillSave(), true);
  tab.unwritable = true;
  const purchase = tab.context.skillPurchase('engine');
  assert.equal(purchase.accepted, false); assert.equal(purchase.reason, 'unavailable');
  assert.equal(JSON.stringify(tab.context.skillProgression.snapshot()), before, 'Failed writes leave the purchased candidate unassigned.');
  assert.equal(hub.raw, original); assert.equal(hub.writes, 0);
}

console.log('Skill storage boundary: passed (two active runs, no storage echo, scoped receipts, stale purchase, unrelated writes, unavailable/corrupt reads and write refusal).');
