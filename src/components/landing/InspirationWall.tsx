import Image from "next/image";
import type { CSSProperties } from "react";
import { WALL_ROWS } from "./collage-data";
import styles from "./landing.module.css";

export function InspirationWall() {
  return (
    <div className={styles.wall}>
      <div className={styles.wallTear} />
      <div className={styles.veil} />
      {WALL_ROWS.map((row, r) => (
        <div key={r} className={styles.wallRow}>
          {row.tiles.map((tile, i) => (
            // the band height rides a custom property so the narrow
            // breakpoints can rescale all three bands proportionally
            <div
              key={i}
              data-i={i}
              className={styles.tile}
              style={{ flex: `${tile.flex} 1 0%`, "--row-h": `${row.height}px` } as CSSProperties}
            >
              <Image
                src={tile.src}
                alt={tile.alt}
                fill
                sizes="(max-width: 700px) 34vw, (max-width: 880px) 17vw, 12vw"
                className={styles.tileImg}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
