"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { TeamMember } from "@/components/about/team-data";
import { Roller, ScrollDefs, SheetFrame, SheetShade } from "@/components/about/scroll-art";
import styles from "./ancestors.module.css";

/**
 * "Napkins ancestors" — everyone who ran the magazine before the current team,
 * kept off the page itself and opened from a quiet link underneath it.
 *
 * Native <dialog> + showModal() gives the focus trap, Escape and backdrop for
 * free, the same way src/components/drawer/PieceModal.tsx does it. The grid
 * inside scrolls; the scroll it sits on grows with it.
 */
export function Ancestors({ people }: { people: TeamMember[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDialogElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // lock the page behind the modal; scroll position is untouched on close
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button type="button" className={styles.openLink} onClick={() => setOpen(true)}>
        Napkins ancestors →
      </button>

      <dialog
        ref={ref}
        className={styles.modal}
        aria-label="Napkins ancestors"
        onCancel={(e) => {
          // Escape: route through state so the button and dialog stay in sync
          e.preventDefault();
          setOpen(false);
        }}
        onClick={(e) => {
          // Anywhere off the scroll closes it. The dialog covers the whole
          // screen for this reason: sized to the scroll it left a ~10px strip
          // to aim at, which is no use on a phone, where reaching the × in the
          // top corner one-handed is the awkward part.
          if (!scrollRef.current?.contains(e.target as Node)) setOpen(false);
        }}
      >
        {open && (
          <div className={styles.scroll} ref={scrollRef}>
            <ScrollDefs />

            <Roller />

            <div className={styles.sheet}>
              {/* the parchment itself: one shape, stretched to whatever height
                  the list needs, with its shading pinned at both rollers */}
              <SheetFrame />
              <div className={styles.shadeTop}>
                <SheetShade />
              </div>
              <div className={styles.shadeBottom}>
                <SheetShade flip />
              </div>

              <button
                type="button"
                className={styles.close}
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                ×
              </button>

              <div className={styles.sheetInner}>
                <h2 className={styles.title}>Napkins ancestors</h2>
                <p className={styles.subtitle}>(former Napkins staffers)</p>

                <div className={styles.grid}>
                  {people.map((member) => (
                    <div key={member.photo} className={styles.cell}>
                      <div className={styles.photo}>
                        <Image
                          src={member.photo}
                          alt={member.name}
                          fill
                          quality={75}
                          sizes="(max-width: 600px) 40vw, (max-width: 900px) 25vw, 15vw"
                        />
                      </div>
                      <div className={styles.name}>
                        {member.name}
                        {member.pronouns ? ` (${member.pronouns})` : ""}
                      </div>
                      <div className={styles.role}>{member.role}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Roller flip />
          </div>
        )}
      </dialog>
    </>
  );
}
