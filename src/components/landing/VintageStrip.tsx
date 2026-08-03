import Image from "next/image";
import { STRIP_TILES } from "./collage-data";
import styles from "./landing.module.css";

export function VintageStrip() {
  return (
    <div className={styles.strip}>
      <div className={styles.stripTear} />
      <div className={styles.veil} />
      {STRIP_TILES.map((tile, i) => (
        // data-i lets the narrow breakpoints retire trailing tiles by index
        // rather than by :nth-child, which the tear and veil would throw off
        <div key={i} data-i={i} className={styles.tile} style={{ flex: `${tile.flex} 1 0%` }}>
          <Image
            src={tile.src}
            alt={tile.alt}
            fill
            sizes="(max-width: 700px) 15vw, (max-width: 880px) 11vw, 8vw"
            className={styles.tileImg}
          />
        </div>
      ))}
    </div>
  );
}
