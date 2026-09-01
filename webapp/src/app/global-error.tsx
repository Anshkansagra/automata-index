"use client";

import { useEffect } from "react";

// Catches errors thrown by the root layout itself (rare — the layout has no
// dynamic data dependencies), which error.tsx can't catch since it's a
// sibling to layout, not a wrapper around it. Must render its own <html>/
// <body> since the real root layout is what failed.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", padding: "2rem", fontFamily: "sans-serif" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "0.5rem" }}>
            Something went wrong
          </h1>
          <p style={{ color: "#71717a", marginBottom: "1rem" }}>
            That&apos;s on us, not you. Please try again.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              borderRadius: "9999px",
              background: "#4f46e5",
              color: "white",
              padding: "0.5rem 1.25rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              border: "none",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
