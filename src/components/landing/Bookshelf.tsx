import Image from "next/image";
import Link from "next/link";
import type { Issue } from "@/lib/types";
import styles from "./landing.module.css";

const SHELF_COLUMNS = 8;

function chunk<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) rows.push(items.slice(i, i + size));
  return rows;
}

export function Bookshelf({ issues }: { issues: Issue[] }) {
  // Newest issue sits in the leftmost slot, oldest at the far right
  const newestFirst = [...issues].sort((a, b) => b.issue_number - a.issue_number);
  const shelves = chunk(newestFirst, SHELF_COLUMNS);
  const newestNumber = newestFirst[0]?.issue_number;
  const singleShelf = shelves.length === 1;

  return (
    <div id="magazine" className={styles.shelfSection}>
      <div className={styles.annotation} style={{ left: 118, top: -36, transform: "rotate(-5deg)" }}>
        fresh off the press!
      </div>
      <svg className={styles.annotationArrow} style={{ left: 64, top: -24 }} width="52" height="48" viewBox="0 0 52 48" fill="none">
        <path d="M48 6 Q18 4 10 34" stroke="#b4470f" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M4 27 L10 36 L18 30" stroke="#b4470f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
      {singleShelf && (
        <>
          <div className={styles.annotation} style={{ right: 128, top: -32, transform: "rotate(3deg)" }}>
            our first ever!
          </div>
          <svg className={styles.annotationArrow} style={{ right: 76, top: -22 }} width="48" height="44" viewBox="0 0 48 44" fill="none">
            <path d="M4 6 Q34 4 40 30" stroke="#b4470f" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M33 25 L41 32 L45 22" stroke="#b4470f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </>
      )}

      {shelves.map((shelf, s) => (
        <div key={s} style={s > 0 ? { marginTop: 44 } : undefined}>
          <div className={styles.shelfGrid}>
            {shelf.map((issue) => {
              const isNewest = issue.issue_number === newestNumber;
              return (
                <Link
                  key={issue.id}
                  href={`/issues/${issue.issue_number}`}
                  title={`Issue ${issue.issue_number} · ${issue.title}`}
                  className={`${styles.cover}${isNewest ? ` ${styles.coverNewest}` : ""}`}
                >
                  <Image
                    src={issue.cover_url}
                    alt={`Napkins Issue ${issue.issue_number} — ${issue.title} cover`}
                    fill
                    sizes="(min-width: 1024px) 12vw, 25vw"
                    className={styles.coverImg}
                  />
                  {isNewest && <span className={styles.newSticker}>NEW!</span>}
                </Link>
              );
            })}
          </div>
          <div className={styles.ledge}>
            <div className={styles.ledgeBar} />
            <div className={styles.ledgeUnder}>
              <div className={styles.ledgeShadow} />
              <div className={styles.ledgeLabels}>
                {shelf.map((issue) => (
                  <div key={issue.id} className={styles.ledgeLabel}>
                    {issue.title}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
