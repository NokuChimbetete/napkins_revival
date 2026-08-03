import Link from "next/link";
import styles from "./landing.module.css";
import type { CSSProperties } from "react";

/**
 * Three notes taped to the inspiration wall.
 *
 * Every measurement here is either a custom property or an em:
 *  - --lift / --shift carry the desktop stagger (how far up the wall a note
 *    sits, and how far it slides off the row). The phone breakpoint stops
 *    consuming them and stacks the notes instead. They have to be properties
 *    rather than inline margin/left, because an inline declaration would
 *    outrank the media query.
 *  - tape geometry is in em off .sticky's font-size, so changing that one
 *    number rescales the note, its tape and its shadow together, keeping the
 *    tuned proportions exactly. At the desktop's 30px these resolve to the
 *    original pixel values.
 */
type NoteVars = CSSProperties & {
  "--rot": string;
  "--rot-hover": string;
  "--lift"?: string;
  "--shift"?: string;
};

export function StickyNotes() {
  return (
    <div className={styles.actions}>
      <a
        href="/Submit-to-the-Magazine"
        className={styles.sticky}
        style={{ "--lift": "430px", "--rot": "-4deg", "--rot-hover": "-1deg" } as NoteVars}
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
        <span
          className={styles.tape}
          style={{ top: "-0.3667em", left: "-0.8667em", width: "2.6em", height: "0.8em", transform: "rotate(-38deg)" }}
        />
        <span
          className={styles.tape}
          style={{ top: "-0.3em", right: "-0.8em", width: "2.6em", height: "0.8em", transform: "rotate(35deg)" }}
        />
      </a>

      <Link
        href="/playground"
        className={styles.sticky}
        style={
          {
            "--shift": "-150px",
            "--lift": "235px",
            "--rot": "2.5deg",
            "--rot-hover": "0.5deg",
          } as NoteVars
        }
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
        <span
          className={styles.tape}
          style={{ top: "-0.4333em", left: "50%", marginLeft: "-1.6em", width: "3.2em", height: "0.8667em", transform: "rotate(-3deg)" }}
        />
      </Link>

      <a
        href="/Join-the-Team"
        className={styles.sticky}
        style={{ "--lift": "36px", "--rot": "-2.5deg", "--rot-hover": "1deg" } as NoteVars}
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
        <span
          className={styles.tape}
          style={{ top: "-0.3333em", left: "-0.8333em", width: "2.6em", height: "0.8em", transform: "rotate(-42deg)" }}
        />
        <span
          className={styles.tape}
          style={{ top: "-0.2667em", right: "-0.7667em", width: "2.6em", height: "0.8em", transform: "rotate(38deg)" }}
        />
      </a>
    </div>
  );
}
