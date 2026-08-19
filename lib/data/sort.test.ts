import { describe, expect, it } from "vitest";
import { canonicalise } from "./sort";

describe("canonicalise", () => {
  it("orders by name, case-insensitively", () => {
    const out = canonicalise([
      { name: "zywoo" },
      { name: "Apex" },
      { name: "b1t" },
    ]);
    expect(out.map((p) => p.name)).toEqual(["Apex", "b1t", "zywoo"]);
  });

  it("is stable across input orders — the whole point", () => {
    // Two responses carrying the same players in different orders must produce
    // byte-identical arrays, or every daily answer moves for no reason.
    const a = canonicalise([{ name: "A" }, { name: "B" }, { name: "C" }]);
    const b = canonicalise([{ name: "C" }, { name: "A" }, { name: "B" }]);
    expect(a).toEqual(b);
  });

  it("does not mutate its input", () => {
    const input = [{ name: "B" }, { name: "A" }];
    canonicalise(input);
    expect(input.map((p) => p.name)).toEqual(["B", "A"]);
  });

  it("breaks ties deterministically rather than leaving them to sort", () => {
    const out = canonicalise([
      { name: "Dup", id: "2" },
      { name: "Dup", id: "1" },
    ]);
    expect(out.map((p) => p.id)).toEqual(["1", "2"]);
  });
});
