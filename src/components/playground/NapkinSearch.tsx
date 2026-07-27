"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { NapkinMeta } from "@/lib/playground";
import styles from "./playground.module.css";

const fold = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

/**
 * A deliberately inconspicuous search: a ghosted magnifier chip that expands
 * into a small typeahead. Enter opens the top (or arrow-selected) match —
 * the drawer opens it straight into the modal, no napkin flight.
 */
export function NapkinSearch({
  napkins,
  onPick,
}: {
  napkins: NapkinMeta[];
  onPick: (slug: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const q = fold(query.trim());
    if (!q) return [];
    const scored: { n: NapkinMeta; score: number }[] = [];
    for (const n of napkins) {
      const title = fold(n.title);
      const author = fold(n.author_name);
      const extra = fold(`${n.category ?? ""} ${n.season}`);
      let score: number | null = null;
      if (title.startsWith(q)) score = 0;
      else if (title.includes(q)) score = 1;
      else if (author.includes(q)) score = 2;
      else if (extra.includes(q)) score = 3;
      if (score !== null) scored.push({ n, score });
    }
    scored.sort((a, b) => a.score - b.score || a.n.title.localeCompare(b.n.title));
    return scored.slice(0, 6).map((s) => s.n);
  }, [napkins, query]);

  useEffect(() => setSelected(0), [query]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // "/" opens search from anywhere in the drawer (unless already typing)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || open) return;
      const t = e.target as HTMLElement;
      if (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable) return;
      if (document.querySelector("dialog[open]")) return;
      e.preventDefault();
      setOpen(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // click-away closes
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [open]);

  const close = () => {
    setOpen(false);
    setQuery("");
    buttonRef.current?.focus();
  };

  const pick = (slug: string) => {
    close();
    onPick(slug);
  };

  return (
    <div ref={rootRef} className={styles.search}>
      {!open && (
        <button
          ref={buttonRef}
          type="button"
          className={styles.searchButton}
          aria-label="Search the napkins"
          title="Search (/)"
          onClick={() => setOpen(true)}
        >
          ⌕
        </button>
      )}
      {open && (
        <div className={styles.searchBox} role="combobox" aria-expanded={results.length > 0}>
          <input
            ref={inputRef}
            className={styles.searchInput}
            type="text"
            value={query}
            placeholder="title, author…"
            spellCheck={false}
            autoComplete="off"
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              // keep keystrokes from panning the canvas underneath
              e.stopPropagation();
              if (e.key === "Escape") close();
              else if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelected((s) => Math.min(s + 1, results.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelected((s) => Math.max(s - 1, 0));
              } else if (e.key === "Enter" && results[selected]) {
                pick(results[selected].slug);
              }
            }}
          />
          {query.trim() && (
            <ul className={styles.searchResults} role="listbox">
              {results.length === 0 && <li className={styles.searchEmpty}>no napkins match</li>}
              {results.map((n, i) => (
                <li key={n.slug}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={i === selected}
                    className={`${styles.searchResult}${i === selected ? ` ${styles.searchResultActive}` : ""}`}
                    onPointerEnter={() => setSelected(i)}
                    onClick={() => pick(n.slug)}
                  >
                    <span className={styles.searchResultTitle}>{n.title}</span>
                    <span className={styles.searchResultMeta}>
                      {[n.author_name, n.season].filter(Boolean).join(" · ")}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
