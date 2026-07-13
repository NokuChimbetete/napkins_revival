import Link from "next/link";
import styles from "./landing.module.css";
import type { CSSProperties } from "react";

type NoteVars = CSSProperties & { "--rot": string; "--rot-hover": string };

export function StickyNotes() {
  return (
    <div className={styles.actions}>
      <a
        href="/Submit-to-the-Magazine"
        className={styles.sticky}
        style={{ marginBottom: 430, "--rot": "-4deg", "--rot-hover": "-1deg" } as NoteVars}
      >
        <span
          className={styles.stickyFace}
          style={{
            background: "#d9e6c3",
            clipPath:
              "polygon(2% 8%, 47% 3%, 98% 0%, 100% 46%, 97% 94%, 55% 100%, 4% 98%, 0% 52%)",
          }}
        >
          Submit
          <br />
          Your Artwork
        </span>
        <span className={styles.tape} style={{ top: -11, left: -26, width: 78, height: 24, transform: "rotate(-38deg)" }} />
        <span className={styles.tape} style={{ top: -9, right: -24, width: 78, height: 24, transform: "rotate(35deg)" }} />
      </a>

      <Link
        href="/playground"
        className={styles.sticky}
        style={{ left: -150, marginBottom: 235, "--rot": "2.5deg", "--rot-hover": "0.5deg" } as NoteVars}
      >
        <span
          className={styles.stickyFace}
          style={{
            background: "#cfe0e8",
            clipPath:
              "polygon(0% 4%, 52% 0%, 100% 6%, 98% 52%, 100% 95%, 48% 100%, 2% 96%, 1% 48%)",
          }}
        >
          Open Napkins
          <br />
          Drawer
        </span>
        <span className={styles.tape} style={{ top: -13, left: "50%", marginLeft: -48, width: 96, height: 26, transform: "rotate(-3deg)" }} />
      </Link>

      <a
        href="/Join-the-Team"
        className={styles.sticky}
        style={{ marginBottom: 36, "--rot": "-2.5deg", "--rot-hover": "1deg" } as NoteVars}
      >
        <span
          className={styles.stickyFace}
          style={{
            background: "#fdf6e8",
            clipPath:
              "polygon(3% 2%, 55% 0%, 100% 8%, 98% 50%, 100% 96%, 45% 98%, 0% 100%, 2% 46%)",
          }}
        >
          Join the
          <br />
          Team :)
        </span>
        <span className={styles.tape} style={{ top: -10, left: -25, width: 78, height: 24, transform: "rotate(-42deg)" }} />
        <span className={styles.tape} style={{ top: -8, right: -23, width: 78, height: 24, transform: "rotate(38deg)" }} />
      </a>
    </div>
  );
}
