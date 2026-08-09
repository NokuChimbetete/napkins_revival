"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import styles from "./reader.module.css";

type Props = {
  pages: string[];
  issueNumber: number;
  issueTitle: string;
  pdfHref: string | null;
  hasWeb: boolean;
};

/**
 * "Download PDF" points at the full-quality original, which for most issues is
 * hosted off-site — the files run to 298MB and the whole point of the page
 * images beside it is that nobody has to pay that to read.
 *
 * Two things follow from the link being cross-origin. The `download` attribute
 * is ignored by every browser unless the file is same-origin, so promising a
 * download and then navigating away is worse than not promising one. And
 * leaving the reader entirely to fetch a 300MB file loses their place, so an
 * off-site original opens in its own tab.
 */
function DownloadLink({ href }: { href: string }) {
  const offSite = /^https?:\/\//i.test(href) && !href.includes(".supabase.co/");

  if (offSite) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.barLink}
        title="The original, full quality — opens in a new tab"
      >
        Download PDF ↗
      </a>
    );
  }

  return (
    <a href={href} download className={styles.barLink}>
      Download PDF
    </a>
  );
}

export function PdfSpreadViewer({ pages, issueNumber, issueTitle, pdfHref, hasWeb }: Props) {
  const [singlePage, setSinglePage] = useState(false);
  const [spreadIndex, setSpreadIndex] = useState(0);
  const touchX = useRef<number | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 860px)");
    const apply = () => setSinglePage(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // cover alone, then pairs: [1] [2,3] [4,5] …  (indexes into pages[])
  const spreads = useMemo(() => {
    if (singlePage) return pages.map((_, i) => [i]);
    const out: number[][] = [[0]];
    for (let i = 1; i < pages.length; i += 2) {
      out.push(i + 1 < pages.length ? [i, i + 1] : [i]);
    }
    return out;
  }, [pages, singlePage]);

  const clamped = Math.min(spreadIndex, spreads.length - 1);
  const current = spreads[clamped];

  const go = useCallback(
    (dir: 1 | -1) => setSpreadIndex((i) => Math.max(0, Math.min(spreads.length - 1, i + dir))),
    [spreads.length]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  // preload the next spread
  useEffect(() => {
    const next = spreads[clamped + 1];
    next?.forEach((p) => {
      const img = new window.Image();
      img.src = pages[p];
    });
  }, [clamped, spreads, pages]);

  const counter =
    current.length === 2
      ? `${current[0] + 1}–${current[1] + 1} / ${pages.length}`
      : `${current[0] + 1} / ${pages.length}`;

  return (
    <div className={styles.pdfPage}>
      <div className={styles.pdfBar}>
        <Link href="/" className={styles.barLink}>
          ← SHELF
        </Link>
        <span className={styles.barTitle}>
          {issueTitle} — Napkins
        </span>
        <span className={styles.barActions}>
          {hasWeb && (
            <Link href={`/issues/${issueNumber}`} className={styles.pdfPill}>
              Read on the web
            </Link>
          )}
          {pdfHref && <DownloadLink href={pdfHref} />}
        </span>
      </div>

      <div
        className={styles.pdfStage}
        onTouchStart={(e) => {
          touchX.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 48) go(dx < 0 ? 1 : -1);
          touchX.current = null;
        }}
      >
        {current.map((p) => (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            key={pages[p]}
            src={pages[p]}
            alt={`${issueTitle} — page ${p + 1}`}
            className={`${styles.pdfImg}${current.length === 1 ? ` ${styles.pdfImgSingle}` : ""}`}
          />
        ))}
      </div>

      <div className={styles.pdfFooter}>
        <button
          type="button"
          className={styles.pdfNavBtn}
          onClick={() => go(-1)}
          disabled={clamped === 0}
          aria-label="Previous page"
        >
          ←
        </button>
        <span className={styles.pdfCounter}>{counter}</span>
        <button
          type="button"
          className={styles.pdfNavBtn}
          onClick={() => go(1)}
          disabled={clamped === spreads.length - 1}
          aria-label="Next page"
        >
          →
        </button>
      </div>
    </div>
  );
}
