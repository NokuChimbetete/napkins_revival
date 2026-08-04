"use client";

import { useState } from "react";
import type { Block } from "@/lib/blocks/types";
import { PALETTE, makeBlock } from "./blockOps";
import styles from "./builder.module.css";
import ui from "../ui.module.css";

/** Adding a block. Named for what it does to the page, not for what it is
 *  called in the data model — "Side by side", not "row". */
export function BlockPalette({
  onAdd,
  compact,
}: {
  onAdd: (block: Block) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);

  if (compact) {
    return (
      <div className={styles.palette}>
        {open ? (
          <div className={styles.paletteGrid}>
            {PALETTE.filter((p) => p.kind !== "row").map((p) => (
              <button
                key={p.kind}
                type="button"
                className={styles.paletteBtn}
                onClick={() => {
                  onAdd(makeBlock(p.kind));
                  setOpen(false);
                }}
              >
                <span className={styles.paletteName}>{p.name}</span>
              </button>
            ))}
          </div>
        ) : (
          <button
            type="button"
            className={`${ui.btn} ${ui.btnSmall} ${ui.btnGhost}`}
            onClick={() => setOpen(true)}
          >
            + Add inside
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={styles.palette}>
      <div className={styles.sectionHead}>
        <p className={styles.sectionTitle}>Add</p>
        <span className={styles.sectionRule} />
      </div>
      <div className={styles.paletteGrid}>
        {PALETTE.map((p) => (
          <button
            key={p.kind}
            type="button"
            className={styles.paletteBtn}
            onClick={() => onAdd(makeBlock(p.kind))}
          >
            <span className={styles.paletteName}>{p.name}</span>
            <span className={styles.paletteWhat}>{p.what}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
