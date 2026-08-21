import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

// The whole safety story of this component is one line — `if (!DEV_TOOLS) return
// null` — and it is decided by build-time env, so it cannot be exercised by
// clicking. The gate is read at module scope, hence the reset + dynamic import:
// a plain top-level import would freeze DEV_TOOLS before the stub applies.
async function load() {
  vi.resetModules();
  return (await import("./DevReveal")).default;
}

const answers = [{ label: "Grid 1 (5)", value: "BROKY" }];

afterEach(() => vi.unstubAllEnvs());

describe("DevReveal", () => {
  it("renders nothing in a production build", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_DEV_TOOLS", "");
    const DevReveal = await load();
    const { container } = render(<DevReveal answers={answers} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders in a production build when the preview flag opts in", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_DEV_TOOLS", "1");
    const DevReveal = await load();
    render(<DevReveal answers={answers} />);
    expect(
      screen.getByRole("button", { name: "Reveal answer (dev)" }),
    ).toBeInTheDocument();
  });

  it("keeps the answer out of the DOM until it is asked for", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const DevReveal = await load();
    render(<DevReveal answers={answers} />);
    // Closed is the default, and it is what keeps this safe to mount during a
    // server render of a client component whose targets are drawn on the client.
    expect(screen.queryByText("BROKY")).not.toBeInTheDocument();
  });
});
