// Makes a freshly published snapshot live immediately.
//
// The game pages are prerendered and revalidate on a timer (see
// SNAPSHOT_REVALIDATE), so without this endpoint a snapshot written at 02:00 is
// served somewhere in the following quarter of an hour. The sync calls this the
// moment a write succeeds and the wait becomes zero — the timer stays as the
// safety net for when nobody calls.
//
// Authenticated with `CRON_SECRET` rather than a name of our own: that is the
// variable Vercel Cron injects, and it sends `Authorization: Bearer $CRON_SECRET`
// on every scheduled invocation. One variable, and the scheduler needs no glue.

import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { SNAPSHOT_TAG } from "@/lib/data/cache";

// Never prerendered, never cached: the one route whose entire job is to
// invalidate a cache must not sit behind one.
export const dynamic = "force-dynamic";

// Constant-time compare, so the endpoint cannot be used to guess the secret one
// character at a time. `timingSafeEqual` throws on a length mismatch, hence the
// guard — the LENGTH does leak, which is not worth defending.
function memeSecret(fourni: string, attendu: string): boolean {
  const a = Buffer.from(fourni, "utf8");
  const b = Buffer.from(attendu, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

function porteur(request: Request): string {
  const brut = request.headers.get("authorization") ?? "";
  return brut.startsWith("Bearer ") ? brut.slice("Bearer ".length) : "";
}

async function handler(request: Request): Promise<Response> {
  const attendu = process.env.CRON_SECRET;

  // Refusing when unconfigured is the whole point: a missing secret must close
  // the endpoint, never open it. Anyone could otherwise force a re-render of
  // every page at will.
  if (!attendu) {
    return Response.json(
      { error: "CRON_SECRET is not set; refusing to revalidate" },
      { status: 503 },
    );
  }

  if (!memeSecret(porteur(request), attendu)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  // "max" expires the tag outright. The single-argument form is deprecated in
  // Next 16, and `updateTag` — the other suggestion — throws outside a Server
  // Action, which a route handler is not.
  revalidateTag(SNAPSHOT_TAG, "max");

  return Response.json({
    revalidated: true,
    tag: SNAPSHOT_TAG,
    at: new Date().toISOString(),
  });
}

// Vercel Cron issues GET; a human or a script calling it by hand should be able
// to POST, this being a write.
export const GET = handler;
export const POST = handler;
