import { describe, expect, it } from "vitest";
import { manualAdapter } from "./manual";
import { validateSnapshot } from "../validate";

describe("manualAdapter", () => {
  it("builds a snapshot that passes the gate", async () => {
    // The committed JSON is the floor of the fallback chain. If it cannot pass
    // its own validation, nothing downstream can be trusted.
    const snap = await manualAdapter.build(100);
    expect(validateSnapshot(snap)).toEqual({ ok: true });
  });

  it("stamps the day it was asked for", async () => {
    const snap = await manualAdapter.build(4242);
    expect(snap.day).toBe(4242);
    expect(snap.source).toBe("manual");
  });

  it("canonicalises the pools it reads", async () => {
    const snap = await manualAdapter.build(1);
    const noms = snap.guessr.players.map((p) => p.name.toLowerCase());
    expect(noms).toEqual([...noms].sort());
  });
});
