// Manual sync: adapter → gate → store. The cron route in the next plan calls the
// same three steps; this is the version you can run and read the output of.
//
// Prepares TOMORROW by default. The rotation is at 03:00 UTC and the snapshot is
// keyed by the day it serves, so writing tomorrow's is what lets a sync run at
// any hour without touching the day in progress.

import { manualAdapter } from "@/lib/data/adapters/manual";
import { fsStore } from "@/lib/data/stores/fs";
import { validateSnapshot } from "@/lib/data/validate";
import { dayIndex } from "@/lib/daily/clock";

async function main() {
  const cible = Number(process.argv[2] ?? dayIndex() + 1);
  const adapter = manualAdapter;

  console.log(`sync: building day ${cible} via "${adapter.name}"`);
  const snapshot = await adapter.build(cible);

  const verdict = validateSnapshot(snapshot);
  if (!verdict.ok) {
    console.error(`sync: REFUSED, ${verdict.errors.length} problem(s):`);
    for (const e of verdict.errors) console.error(`  - ${e}`);
    console.error("sync: nothing written; the previous snapshot stays live.");
    process.exit(1);
  }

  await fsStore().put(snapshot);
  console.log(
    `sync: wrote day ${cible} — ${snapshot.guessr.players.length} guessr, ` +
      `${snapshot.moreless.players.length} moreless`,
  );
}

main().catch((e) => {
  console.error("sync: failed", e);
  process.exit(1);
});
