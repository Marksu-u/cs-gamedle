import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SNAPSHOT_TAG } from "@/lib/data/cache";

// `revalidateTag` reaches into Next's request-scoped storage and throws outside
// a real request, so the assertion here is that the route CALLS it correctly —
// the purge itself is Next's contract, not this project's.
const revalidateTag = vi.hoisted(() => vi.fn());
vi.mock("next/cache", () => ({ revalidateTag }));

const { GET, POST } = await import("./route");

const SECRET = "un-secret-de-test";

function requete(auth?: string): Request {
  return new Request("https://strikedle.com/api/revalidate", {
    method: "POST",
    headers: auth ? { authorization: auth } : {},
  });
}

beforeEach(() => {
  vi.stubEnv("CRON_SECRET", SECRET);
  revalidateTag.mockClear();
});
afterEach(() => vi.unstubAllEnvs());

describe("POST /api/revalidate — authentication", () => {
  it("refuses a request with no Authorization header", async () => {
    const res = await POST(requete());
    expect(res.status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("refuses the wrong secret", async () => {
    const res = await POST(requete("Bearer pas-le-bon"));
    expect(res.status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("refuses a secret of the right length but wrong content", async () => {
    // The constant-time compare must still say no; a length match is not a
    // match.
    const res = await POST(requete(`Bearer ${"x".repeat(SECRET.length)}`));
    expect(res.status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("refuses the secret sent without the Bearer scheme", async () => {
    const res = await POST(requete(SECRET));
    expect(res.status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("closes the endpoint when CRON_SECRET is unset rather than opening it", async () => {
    // The failure that would matter: an unconfigured deploy letting anyone force
    // a re-render of every page.
    vi.stubEnv("CRON_SECRET", "");
    const res = await POST(requete("Bearer n-importe-quoi"));
    expect(res.status).toBe(503);
    expect(revalidateTag).not.toHaveBeenCalled();
  });
});

describe("POST /api/revalidate — success", () => {
  it("purges the snapshot tag and says so", async () => {
    const res = await POST(requete(`Bearer ${SECRET}`));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      revalidated: true,
      tag: SNAPSHOT_TAG,
    });
    expect(revalidateTag).toHaveBeenCalledExactlyOnceWith(SNAPSHOT_TAG, "max");
  });

  it("answers GET the same way, because that is what Vercel Cron sends", async () => {
    const res = await GET(
      new Request("https://strikedle.com/api/revalidate", {
        headers: { authorization: `Bearer ${SECRET}` },
      }),
    );
    expect(res.status).toBe(200);
    expect(revalidateTag).toHaveBeenCalledExactlyOnceWith(SNAPSHOT_TAG, "max");
  });

  it("never echoes the secret back", async () => {
    const res = await POST(requete(`Bearer ${SECRET}`));
    expect(JSON.stringify(await res.json())).not.toContain(SECRET);
  });
});
