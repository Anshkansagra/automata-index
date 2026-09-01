"use client";

import { useEffect, useState } from "react";
import { CiteButton } from "@/components/CiteButton";
import { SaveButton } from "@/components/SaveButton";
import type { Paper } from "@/lib/types";
import type { CitationStyle } from "@/lib/citation";

// Same client-side personalization pattern as PersonalizedPaperList, scoped
// to a single paper's Cite/Save action bar (the paper detail page's own
// buttons, separate from its related-papers list).
export function PersonalizedPaperActions({ paper }: { paper: Paper }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [citationStyle, setCitationStyle] = useState<CitationStyle | undefined>(undefined);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/paper-personalization", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paperIds: [paper.id] }),
    })
      .then((res) => res.json())
      .then((data: { isLoggedIn: boolean; citationStyle: CitationStyle | undefined; savedIds: string[] }) => {
        if (cancelled) return;
        setIsLoggedIn(data.isLoggedIn);
        setCitationStyle(data.citationStyle);
        setIsSaved(data.savedIds.includes(paper.id));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [paper.id]);

  return (
    <>
      <CiteButton paper={paper} defaultStyle={citationStyle} />
      {isLoggedIn && <SaveButton paperId={paper.id} initialSaved={isSaved} />}
    </>
  );
}
