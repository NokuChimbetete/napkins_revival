"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Issue } from "@/lib/types";
import type { IssueContent, Entry } from "@/lib/issue-content";
import { EntrySlideshow } from "./EntrySlideshow";
import styles from "./reader.module.css";

// *italic* / **bold** markers from the scraper → inline elements
function renderInline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*")) return <em key={i}>{part.slice(1, -1)}</em>;
    return part;
  });
}

function EntryBody({ body }: { body: string }) {
  const paragraphs = body.split(/\n{2,}/);
  return (
    <div className={styles.body}>
      {paragraphs.map((p, i) => (
        <p key={i}>{renderInline(p)}</p>
      ))}
    </div>
  );
}

/**
 * Design rule: images are stacked vertically in the position the author placed
 * them, so each caption stays attached to its own picture. The horizontal
 * carousel is only for a sequence the editors explicitly marked up as one
 * slideshow — and even then it renders *where it appears* in the piece, since
 * an entry can interleave several (Tattoo Diary has one per person).
 */
function EntryContent({ entry }: { entry: Entry }) {
  if (entry.body_html) {
    return (
      <div
        className={`${styles.body} ${styles.bodyHtml}`}
        dangerouslySetInnerHTML={{ __html: entry.body_html }}
      />
    );
  }
  return entry.body ? <EntryBody body={entry.body} /> : null;
}

function EntrySection({ entry }: { entry: Entry }) {
  const byline = entry.author_name
    ? `by ${entry.author_name}${entry.class_year ? ` (${entry.class_year})` : ""}`
    : null;
  // verse gets a wider column and no wrapping, so authored line breaks stand
  const isVerse = entry.verse || /poetry|poem|verse|song/i.test(entry.category ?? "");
  return (
    <section
      id={entry.slug}
      className={`${styles.entry}${isVerse ? ` ${styles.poetry}` : ""}`}
      data-entry-slug={entry.slug}
    >
      {entry.category && <p className={styles.eyebrow}>{entry.category}</p>}
      <h2 className={styles.entryTitle}>{entry.title}</h2>
      {byline && <p className={styles.byline}>{byline}</p>}
      <EntryContent entry={entry} />
    </section>
  );
}

export function IssueReader({ issue, content }: { issue: Issue; content: IssueContent }) {
  const [tocOpen, setTocOpen] = useState(false);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const hasPdf = content.page_images.length > 0;

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
        if (progressRef.current) progressRef.current.style.width = `${pct}%`;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    const sections = document.querySelectorAll("[data-entry-slug]");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActiveSlug(e.target.getAttribute("data-entry-slug"));
        }
      },
      { rootMargin: "-15% 0px -70% 0px" }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  const jumpTo = (slug: string) => {
    setTocOpen(false);
    // instant jump: smooth scrolling gets cancelled by lazy-image layout shifts
    // over multi-thousand-pixel distances, and is disorienting at this scale anyway
    document.getElementById(slug)?.scrollIntoView({ block: "start" });
  };

  return (
    <div className={styles.page}>
      <div className={styles.bar}>
        <div className={styles.progress}>
          <div ref={progressRef} className={styles.progressFill} />
        </div>
        <div className={styles.barRow}>
          <Link href="/" className={styles.barLink}>
            ← SHELF
          </Link>
          <span className={styles.barTitle}>
            {issue.title} — Napkins
          </span>
          <span className={styles.barActions}>
            <button type="button" className={styles.barButton} onClick={() => setTocOpen(true)}>
              Contents
            </button>
            {hasPdf && (
              <Link href={`/issues/${issue.issue_number}/pdf`} className={styles.pdfPill}>
                Read as PDF
              </Link>
            )}
          </span>
        </div>
      </div>

      {tocOpen && (
        <>
          <div className={styles.drawerBackdrop} onClick={() => setTocOpen(false)} />
          <nav className={styles.drawer} aria-label="Issue contents">
            <div className={styles.drawerHead}>
              <span className={styles.drawerTitle}>In this issue</span>
              <button type="button" className={styles.barButton} onClick={() => setTocOpen(false)}>
                Close
              </button>
            </div>
            {content.pieces.map((p) => (
              <button
                key={p.slug}
                type="button"
                className={`${styles.drawerItem}${p.slug === activeSlug ? ` ${styles.drawerItemActive}` : ""}`}
                onClick={() => jumpTo(p.slug)}
              >
                <span className={styles.drawerItemTitle}>{p.title}</span>
                <span className={styles.drawerItemMeta}>
                  {[p.author_name && `${p.author_name}${p.class_year ? ` (${p.class_year})` : ""}`, p.category]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </button>
            ))}
          </nav>
        </>
      )}

      <header className={styles.hero}>
        <p className={styles.heroIssueNo}>Napkins · Issue {issue.issue_number}</p>
        <Image
          src={issue.cover_url}
          alt={`Napkins Issue ${issue.issue_number} — ${issue.title} cover`}
          width={840}
          height={1160}
          priority
          className={styles.heroCover}
        />
        <h1 className={styles.heroLabel}>{issue.title}</h1>
        <span className={styles.scrollCue}>↓ scroll to read</span>
      </header>

      <main className={styles.entries}>
        {content.pieces.map((p, i) => (
          <div key={p.slug}>
            {i > 0 && (
              <div className={styles.divider} aria-hidden="true">
                <span className={styles.dividerLine} />
                <span className={styles.dividerSquare} />
                <span className={styles.dividerLine} />
              </div>
            )}
            <EntrySection entry={p} />
          </div>
        ))}

        {content.credits && (
          <>
            <div className={styles.divider} aria-hidden="true">
              <span className={styles.dividerLine} />
              <span className={styles.dividerSquare} />
              <span className={styles.dividerLine} />
            </div>
            <section className={styles.credits}>
              <h2 className={styles.creditsHead}>Credits</h2>
              <p className={styles.creditsBody}>{content.credits}</p>
            </section>
          </>
        )}
      </main>

      <footer className={styles.endCta}>
        <p className={styles.endCtaText}>That&rsquo;s the whole issue — thanks for reading!</p>
        <div className={styles.endCtaLinks}>
          <Link href="/Submit-to-the-Magazine" className={styles.endCtaLink}>
            Submit your work
          </Link>
          <Link href="/" className={styles.endCtaLink}>
            Back to the shelf
          </Link>
        </div>
      </footer>
    </div>
  );
}
