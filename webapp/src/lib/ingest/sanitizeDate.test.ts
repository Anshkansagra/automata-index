import { describe, expect, it } from "vitest";
import { sanitizeDate } from "@/lib/ingest/sanitizeDate";

describe("sanitizeDate", () => {
  it("returns null for missing input", () => {
    expect(sanitizeDate(null)).toBeNull();
    expect(sanitizeDate(undefined)).toBeNull();
    expect(sanitizeDate("")).toBeNull();
  });

  it("returns null for unparsable strings", () => {
    expect(sanitizeDate("not a date")).toBeNull();
  });

  it("returns null for years before 1900", () => {
    expect(sanitizeDate("1850-01-01")).toBeNull();
  });

  it("returns null for dates too far in the future", () => {
    const farFuture = new Date();
    farFuture.setUTCFullYear(farFuture.getUTCFullYear() + 5);
    expect(sanitizeDate(farFuture.toISOString())).toBeNull();
  });

  it("normalizes a full ISO date to YYYY-MM-DD", () => {
    expect(sanitizeDate("2024-03-15T10:30:00Z")).toBe("2024-03-15");
  });

  it("normalizes a partial YYYY-MM date instead of rejecting it (regression: Zenodo ingestion)", () => {
    // Postgres's `date` column rejects "2024-01" outright even though
    // `new Date("2024-01")` parses fine in JS — this must come out as a
    // full, Postgres-valid date, not the original partial string.
    const result = sanitizeDate("2024-01");
    expect(result).toMatch(/^2024-01-\d{2}$/);
  });
});
