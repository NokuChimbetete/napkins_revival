"use client";

import { useMemo } from "react";
import type { Doc } from "@/lib/blocks/types";
import type { Entry } from "@/lib/issue-content";
import { renderDoc } from "@/lib/blocks/render";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { EntrySection } from "@/components/reader/EntrySection";
import readerStyles from "@/components/reader/reader.module.css";

/**
 * The preview is the reader.
 *
 * `EntrySection` here is the very component that `/issues/[n]` and the napkin
 * modal render — not a copy of it — fed by the same `renderDoc()` that the save
 * path writes to `body_html`, through the same sanitizer every read path uses.
 * If the reader is restyled, this moves with it; there is no second
 * implementation that can quietly fall behind.
 *
 * The one thing missing versus production is `optimizeBodyImages()`, which
 * rewrites <img> to /_next/image. That changes how many bytes arrive, never how
 * anything looks, and skipping it means a just-uploaded image appears
 * immediately instead of waiting on the optimizer.
 */
export function PiecePreview({
  entry,
  doc,
}: {
  entry: Pick<
    Entry,
    "slug" | "title" | "author_name" | "class_year" | "category" | "verse" | "is_frontmatter"
  >;
  doc: Doc;
}) {
  const full: Entry = useMemo(
    () => ({
      ...entry,
      body: null,
      body_html: sanitizeHtml(renderDoc(doc)),
      galleries: [],
      images: [],
      sort_order: 0,
    }),
    [entry, doc]
  );

  const empty = !full.body_html;

  return (
    <div className={readerStyles.page}>
      <div className={readerStyles.entries}>
        {empty ? (
          <p
            style={{
              maxWidth: 680,
              margin: "40px auto",
              color: "#b9b2a4",
              fontFamily: "var(--font-lora), Georgia, serif",
              fontSize: 16,
              textAlign: "center",
            }}
          >
            Nothing to read yet — add a block on the left and it appears here.
          </p>
        ) : (
          <EntrySection entry={full} />
        )}
      </div>
    </div>
  );
}
