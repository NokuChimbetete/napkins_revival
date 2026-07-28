"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import styles from "./reader.module.css";

export function EntrySlideshow({ images, title }: { images: string[]; title: string }) {
  const [emblaRef, embla] = useEmblaCarousel({ loop: false, align: "start" });
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!embla) return;
    const onSelect = () => setIndex(embla.selectedScrollSnap());
    embla.on("select", onSelect);
    return () => {
      embla.off("select", onSelect);
    };
  }, [embla]);

  const prev = useCallback(() => embla?.scrollPrev(), [embla]);
  const next = useCallback(() => embla?.scrollNext(), [embla]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") prev();
    if (e.key === "ArrowRight") next();
  };

  if (images.length === 1) {
    return (
      <div className={styles.slideshow}>
        <div className={styles.viewport}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={images[0]} alt={title} className={styles.slideImg} loading="lazy" />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.slideshow} tabIndex={0} onKeyDown={onKeyDown} aria-label={`${title} slideshow`}>
      <div className={styles.viewport} ref={emblaRef}>
        <div className={styles.slides}>
          {images.map((src, i) => (
            <div key={src} className={styles.slide}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`${title} — image ${i + 1} of ${images.length}`}
                className={styles.slideImg}
                loading={i < 2 ? "eager" : "lazy"}
              />
            </div>
          ))}
        </div>
        <button
          type="button"
          className={`${styles.navBtn} ${styles.navPrev}`}
          onClick={prev}
          disabled={index === 0}
          aria-label="Previous image"
        >
          ←
        </button>
        <button
          type="button"
          className={`${styles.navBtn} ${styles.navNext}`}
          onClick={next}
          disabled={index === images.length - 1}
          aria-label="Next image"
        >
          →
        </button>
        <span className={styles.counter}>
          {index + 1} / {images.length}
        </span>
      </div>
      <div className={styles.dots}>
        {images.map((_, i) => (
          <button
            key={i}
            type="button"
            className={`${styles.dot}${i === index ? ` ${styles.dotActive}` : ""}`}
            onClick={() => embla?.scrollTo(i)}
            aria-label={`Go to image ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
