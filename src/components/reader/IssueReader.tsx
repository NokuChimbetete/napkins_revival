"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Issue } from "@/lib/types";
import type { IssueContent } from "@/lib/issue-content";
import { EntrySection } from "./EntrySection";
import { IssueToc } from "./IssueToc";
import { flyTo } from "./fly-to";
import styles from "./reader.module.css";

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

  const cancelFlight = useRef<(() => void) | null>(null);

  /**
   * Fly to a piece. flyTo() re-measures the target every frame, which is what
   * makes a smooth scroll survive images loading in on the way past — the
   * reason this used to be an instant jump.
   *
   * On arrival the piece announces itself: a quick lift on the title and the
   * orange rule drawing itself underneath. It's a beat, not a wait.
   */
  const goToPiece = useCallback((slug: string) => {
    const target = document.getElementById(slug);
    if (!target) return;
    setTocOpen(false);
    cancelFlight.current?.();
    // claim the marker straight away: waiting for the scrollspy to catch up
    // mid-flight would leave the click feeling unacknowledged
    setActiveSlug(slug);

    // clear any previous flourish so re-picking the same piece replays it
    document
      .querySelectorAll("[data-landed]")
      .forEach((el) => el.removeAttribute("data-landed"));

    cancelFlight.current = flyTo(target, {
      onArrive: () => {
        target.setAttribute("data-landed", "");
        window.setTimeout(() => target.removeAttribute("data-landed"), 1200);
      },
    });
  }, []);

  useEffect(() => () => cancelFlight.current?.(), []);

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
            {/* the rail is permanent on wide screens; this opens it as a panel below that */}
            <button
              type="button"
              className={`${styles.barButton} ${styles.tocTrigger}`}
              onClick={() => setTocOpen(true)}
              aria-expanded={tocOpen}
            >
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

      <IssueToc
        items={content.pieces.map((p) => ({ slug: p.slug, title: p.title }))}
        activeSlug={activeSlug}
        open={tocOpen}
        onClose={() => setTocOpen(false)}
        onToggle={() => setTocOpen((v) => !v)}
        onNavigate={goToPiece}
      />

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
