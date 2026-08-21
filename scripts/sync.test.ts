import { execFile } from "node:child_process";
import { access, rm } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";

const run = promisify(execFile);

// The script is exercised as a PROCESS rather than as an imported function,
// because its contract with the future cron route is its exit code: a non-zero
// exit is what stops a broken pool from being published.
const TSX = join(process.cwd(), "node_modules", ".bin", "tsx");
const SCRIPT = join(process.cwd(), "scripts", "sync.ts");
const fichier = (day: number) =>
  join(process.cwd(), ".snapshots", `pool-${day}.json`);

// Far from any real day index, so a run here can never be mistaken for — or
// collide with — a snapshot the developer actually wants.
const JOUR_TEST = 424242;

async function existe(p: string) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

// Both files are cleared, not just the one a passing run writes: if the gate
// ever regresses and lets day -1 through, the stray file must not survive to
// make the NEXT run fail against a version that is fine.
afterEach(async () => {
  await rm(fichier(JOUR_TEST), { force: true });
  await rm(fichier(-1), { force: true });
});

describe("scripts/sync.ts", () => {
  it("writes the snapshot for the day it was given", async () => {
    const { stdout } = await run(TSX, [SCRIPT, String(JOUR_TEST)]);
    expect(stdout).toContain(`building day ${JOUR_TEST}`);
    expect(stdout).toContain(`wrote day ${JOUR_TEST}`);
    expect(await existe(fichier(JOUR_TEST))).toBe(true);
  }, 30_000);

  it("refuses a snapshot that fails the gate, and writes nothing", async () => {
    // The safety property the whole gate exists for: a bad build leaves the
    // previous snapshot live rather than replacing it with a broken one.
    const echec = await run(TSX, [SCRIPT, "-1"]).catch(
      (e: { code: number; stderr: string }) => e,
    );
    expect(echec).toMatchObject({ code: 1 });
    expect((echec as { stderr: string }).stderr).toContain("REFUSED");
    expect((echec as { stderr: string }).stderr).toContain("day invalide");
    expect((echec as { stderr: string }).stderr).toContain("nothing written");
    expect(await existe(fichier(-1))).toBe(false);
  }, 30_000);
});
