// Mendeley Data mints a distinct DOI per version by appending ".<digits>" to
// an otherwise-stable identifier — e.g. 10.17632/tfrr2pcmrk vs
// 10.17632/tfrr2pcmrk.1 for the same underlying deposit (the original bug
// this fixes: OpenAlex surfaced both as separate papers). This is scoped to
// that one confirmed prefix deliberately — stripping ".<digits>" from every
// DOI is NOT safe: arXiv's own scheme (10.48550/arXiv.<YYMM>.<NNNNN>) and
// Zenodo's (10.5281/zenodo.<id>) both end in ".<digits>" as part of the real
// identifier, not a version, and collapsing those would wrongly merge
// unrelated papers together (caught via testing before it caused damage —
// verified against the live corpus with no confirmed data loss, but the
// blind version of this function was a real latent bug).
const VERSIONED_DOI_PREFIXES = ["10.17632/"];

export function baseDoi(doi: string): string {
  const isVersioned = VERSIONED_DOI_PREFIXES.some((prefix) => doi.startsWith(prefix));
  return isVersioned ? doi.replace(/\.\d+$/, "") : doi;
}
