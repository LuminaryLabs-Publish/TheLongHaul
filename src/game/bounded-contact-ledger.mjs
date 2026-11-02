// Gameplay contact history may retire during Endless travel. Durable freight
// payouts belong to the saved contract lifecycle and must never use this policy.
export function pruneLongHaulContactLedger(engine, runKey, { limit = 256, activeContacts = [] } = {}) {
  const ledger = engine?.n?.coreTransactionLedger;
  if (!ledger?.getState || !ledger?.update) return { pruned: 0, retained: 0 };
  const id = `long-haul:${String(runKey)}`;
  const state = ledger.getState(), record = state.ledgers?.[id];
  if (!record?.operations) return { pruned: 0, retained: 0 };
  const maximum = Math.max(32, Math.min(4096, Math.floor(Number(limit) || 256)));
  const entries = Object.entries(record.operations).sort((a, b) => Number(b[1].sequence) - Number(a[1].sequence));
  if (entries.length <= maximum) return { pruned: 0, retained: entries.length };
  const keep = new Set();
  if (Object.hasOwn(record.operations, 'truck-tip')) keep.add('truck-tip');
  const prefixes = [...new Set(Array.from(activeContacts, String))].slice(-Math.min(128, maximum - 1));
  const protectedPrefixes = new Set();
  // At most the latest operation for each current contact is needed. Impact
  // operations contain a monotonic serial and cannot replay an older impact.
  for (const [operationId] of entries) {
    const prefix = prefixes.find(value => !protectedPrefixes.has(value) && (operationId === value || operationId.startsWith(`${value}:`)));
    if (prefix !== undefined) { keep.add(operationId); protectedPrefixes.add(prefix); }
    if (protectedPrefixes.size === prefixes.length) break;
  }
  for (const [operationId] of entries) {
    if (keep.size >= maximum) break;
    keep.add(operationId);
  }
  const operations = Object.fromEntries(entries.filter(([operationId]) => keep.has(operationId)));
  ledger.update({ ledgers: { ...state.ledgers, [id]: { ...record, operations } } }, 'contactHistoryRetired');
  return { pruned: entries.length - keep.size, retained: keep.size };
}
