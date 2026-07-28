"use client";

import { useEffect, useRef } from "react";
import styles from "./reader.module.css";

export type TocItem = { slug: string; title: string };

/**
 * The issue's table of contents.
 *
 * At rest it is one word in the top-left gutter with a soft orange ember under
 * it — nothing more, because most of the time nobody is looking for the
 * contents, and a list that is permanently open is a list permanently in the
 * way. Hover the ember and the list unfurls *over* the page; it never displaces
 * the reading column. Below 1100px it's the same list as a slide-in panel.
 *
 * It lists whatever pieces it is handed, so an issue published next year gets
 * its contents for free — nothing here knows how many pieces exist.
 *
 * The marker to the left of the list is a single element that slides between
 * entries rather than one highlight per row, so following it down the page as
 * you read (or as a flight carries you) reads as one continuous movement.
 */
export function IssueToc({
  items,
  activeSlug,
  open,
  onClose,
  onToggle,
  onNavigate,
}: {
  items: TocItem[];
  activeSlug: string | null;
  /** pinned open: the bar button on narrow screens, the tab on wide ones */
  open: boolean;
  onClose: () => void;
  onToggle: () => void;
  onNavigate: (slug: string) => void;
}) {
  const listRef = useRef<HTMLUListElement>(null);
  const markerRef = useRef<HTMLSpanElement>(null);

  // Park the marker on the active entry. Transform only, so it glides on the
  // compositor and costs nothing while scrolling.
  useEffect(() => {
    const list = listRef.current;
    const marker = markerRef.current;
    if (!list || !marker) return;
    const active = activeSlug
      ? list.querySelector<HTMLElement>(`[data-toc-slug="${CSS.escape(activeSlug)}"]`)
      : null;
    if (!active) {
      marker.style.opacity = "0";
      return;
    }
    marker.style.opacity = "1";
    marker.style.transform = `translateY(${active.offsetTop}px)`;
    marker.style.height = `${active.offsetHeight}px`;

    // keep the active entry in view when the rail is longer than the screen
    const top = active.offsetTop;
    const bottom = top + active.offsetHeight;
    if (top < list.scrollTop || bottom > list.scrollTop + list.clientHeight) {
      list.scrollTo({ top: top - list.clientHeight / 2, behavior: "smooth" });
    }
  }, [activeSlug, items]);

  // Escape closes the narrow-screen panel
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      {open && <div className={styles.tocScrim} onClick={onClose} aria-hidden="true" />}
      <nav
        className={styles.toc}
        data-open={open || undefined}
        aria-label="Contents of this issue"
      >
        {/* All that sits on the page at rest: the word, and an ember under it.
            Hovering the ember unfurls the list; clicking pins it. */}
        <button
          type="button"
          className={styles.tocTab}
          onClick={onToggle}
          aria-expanded={open}
          aria-controls="issue-toc-panel"
        >
          <span className={styles.tocLabel}>Contents</span>
          <span className={styles.tocGlow} aria-hidden="true" />
        </button>

        <div className={styles.tocPanel} id="issue-toc-panel">
          <div className={styles.tocListWrap}>
            <span ref={markerRef} className={styles.tocMarker} aria-hidden="true" />
            <ul ref={listRef} className={styles.tocList}>
              {items.map((item) => {
                const isActive = item.slug === activeSlug;
                return (
                  <li key={item.slug}>
                    <button
                      type="button"
                      data-toc-slug={item.slug}
                      className={styles.tocItem}
                      data-active={isActive || undefined}
                      aria-current={isActive ? "true" : undefined}
                      onClick={() => onNavigate(item.slug)}
                    >
                      <span className={styles.tocItemText}>{item.title}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </nav>
    </>
  );
}
