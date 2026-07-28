import type { ReactNode } from "react";
import type { Entry } from "@/lib/issue-content";
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
export function EntryContent({ entry }: { entry: Entry }) {
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

/** One piece, rendered under the Phase-2 design rules (verse no-wrap, wider
 *  measure, in-place galleries). Shared by the issue reader and the
 *  playground's napkin modal so the rules can't drift apart. */
export function EntrySection({ entry }: { entry: Entry }) {
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
