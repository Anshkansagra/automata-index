"use client";

import { useEffect, useState } from "react";
import { PaperCard } from "@/components/PaperCard";
import type { Paper } from "@/lib/types";
import type { CitationStyle } from "@/lib/citation";

type Personalization = {
  isLoggedIn: boolean;
  citationStyle: CitationStyle | undefined;
  savedIds: Set<string>;
};

const ANONYMOUS: Personalization = { isLoggedIn: false, citationStyle: undefined, savedIds: new Set() };

// Renders the anonymous (default) version of each card immediately —
// matching the server-rendered/cached HTML exactly, avoiding a hydration
// mismatch — then fills in save-hearts and citation style for logged-in
// visitors once the personalization fetch resolves. See
// api/paper-personalization/route.ts for why this is fetched client-side
// instead of during SSR.
export function PersonalizedPaperList({ papers }: { papers: Paper[] }) {
  const [personalization, setPersonalization] = useState<Personalization>(ANONYMOUS);

  useEffect(() => {
    if (papers.length === 0) return;
    let cancelled = false;
    fetch("/api/paper-personalization", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paperIds: papers.map((p) => p.id) }),
    })
      .then((res) => res.json())
      .then((data: { isLoggedIn: boolean; citationStyle: CitationStyle | undefined; savedIds: string[] }) => {
        if (cancelled) return;
        setPersonalization({
          isLoggedIn: data.isLoggedIn,
          citationStyle: data.citationStyle,
          savedIds: new Set(data.savedIds),
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [papers]);

  return (
    <div className="papers-columns">
      {papers.map((paper) => (
        <PaperCard
          key={paper.id}
          paper={paper}
          isLoggedIn={personalization.isLoggedIn}
          isSaved={personalization.savedIds.has(paper.id)}
          citationStyle={personalization.citationStyle}
        />
      ))}
    </div>
  );
}
