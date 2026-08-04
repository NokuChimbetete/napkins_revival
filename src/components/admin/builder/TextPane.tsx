"use client";

import { useRef } from "react";
import styles from "./builder.module.css";

/**
 * A textarea. Deliberately, and after looking at what is actually in the
 * archive.
 *
 * 46 of 117 pieces are poetry and there are 4,612 <br> tags across the archive.
 * A poet's line breaks are the form of the poem — an accidental reflow invents
 * a break they did not write. Every rich-text editor worth the name normalises
 * whitespace as part of its schema; a textarea cannot, because a newline in a
 * textarea is just a newline. That is the entire argument.
 *
 * Emphasis is stored as literal <em> / <strong> / <a> tags rather than markdown
 * markers, because the archive contains 39 asterisks and 39 square brackets in
 * prose — "***" as a scene divider, "[Baobab Boy]", "wh*re" — and any **bold**
 * convention would either corrupt those or need escaping the editors can see.
 * The toolbar inserts the tags so nobody has to type one.
 *
 * What makes this pleasant rather than raw is the preview beside it: the real
 * reader component, re-rendered on every keystroke.
 */

type Props = {
  value: string;
  onChange: (next: string) => void;
  verse?: boolean;
  placeholder?: string;
  rows?: number;
  ariaLabel?: string;
};

export function TextPane({ value, onChange, verse, placeholder, rows = 8, ariaLabel }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  /** Wrap the selection, or drop an empty pair where the caret is and put the
   *  caret between them — the two things people expect from a B button. */
  function surround(open: string, close: string) {
    const el = ref.current;
    if (!el) return;
    const { selectionStart: a, selectionEnd: b } = el;
    const next = value.slice(0, a) + open + value.slice(a, b) + close + value.slice(b);
    onChange(next);
    // restore the selection after React re-renders the value
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(a + open.length, b + open.length);
    });
  }

  function link() {
    const el = ref.current;
    if (!el) return;
    const { selectionStart: a, selectionEnd: b } = el;
    const url = window.prompt("Link to which address?", "https://");
    if (!url || !/^https?:\/\//i.test(url)) return;
    const text = value.slice(a, b) || "link";
    const tag = `<a href="${url.replace(/"/g, "&quot;")}" target="_blank" rel="noopener noreferrer">${text}</a>`;
    onChange(value.slice(0, a) + tag + value.slice(b));
    requestAnimationFrame(() => el.focus());
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!(e.metaKey || e.ctrlKey)) return;
    const k = e.key.toLowerCase();
    if (k === "b") {
      e.preventDefault();
      surround("<strong>", "</strong>");
    } else if (k === "i") {
      e.preventDefault();
      surround("<em>", "</em>");
    } else if (k === "k") {
      e.preventDefault();
      link();
    }
  }

  return (
    <div className={styles.textPane}>
      <div className={styles.toolbar}>
        <button
          type="button"
          className={styles.tool}
          onClick={() => surround("<strong>", "</strong>")}
          title="Bold (Ctrl+B)"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          className={styles.tool}
          onClick={() => surround("<em>", "</em>")}
          title="Italic (Ctrl+I)"
        >
          <em>I</em>
        </button>
        <button type="button" className={styles.tool} onClick={link} title="Link (Ctrl+K)">
          Link
        </button>
        <span className={styles.toolSpacer} />
        <span className={styles.toolNote}>
          {verse ? "every line stays exactly where you put it" : "one blank line = a new paragraph"}
        </span>
      </div>

      <textarea
        ref={ref}
        className={`${styles.textArea} ${verse ? styles.textAreaVerse : ""}`}
        value={value}
        rows={rows}
        placeholder={placeholder}
        aria-label={ariaLabel ?? "Text"}
        spellCheck
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
      />
    </div>
  );
}
