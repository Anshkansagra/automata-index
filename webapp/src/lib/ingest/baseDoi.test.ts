import { describe, expect, it } from "vitest";
import { baseDoi } from "@/lib/ingest/baseDoi";

describe("baseDoi", () => {
  it("strips a Mendeley Data version suffix (the original confirmed bug)", () => {
    // OpenAlex had two records for the same Mendeley Data deposit under
    // 10.17632/tfrr2pcmrk and 10.17632/tfrr2pcmrk.1 — dedup needs to treat
    // these as the same paper.
    expect(baseDoi("10.17632/tfrr2pcmrk.1")).toBe("10.17632/tfrr2pcmrk");
  });

  it("does NOT strip arXiv's own identifier suffix (regression: false-positive found via this test)", () => {
    // arXiv DOIs are 10.48550/arXiv.<YYMM>.<NNNNN> — the trailing
    // ".<digits>" is part of the real identifier, not a version. The
    // original unscoped regex stripped it anyway, collapsing every arXiv
    // paper from the same month to the same "base DOI" and risking wrongly
    // merging unrelated papers together.
    expect(baseDoi("10.48550/arXiv.2401.00001")).toBe("10.48550/arXiv.2401.00001");
  });

  it("does NOT strip Zenodo's DOI (regression: false-positive found via this test)", () => {
    // Zenodo DOIs are 10.5281/zenodo.<sequential-id> — stripping the numeric
    // id would collapse EVERY Zenodo paper to the identical base DOI
    // "10.5281/zenodo", a much worse version of the same bug.
    expect(baseDoi("10.5281/zenodo.21411841")).toBe("10.5281/zenodo.21411841");
  });

  it("leaves an unversioned Mendeley Data DOI unchanged", () => {
    expect(baseDoi("10.17632/tfrr2pcmrk")).toBe("10.17632/tfrr2pcmrk");
  });
});
