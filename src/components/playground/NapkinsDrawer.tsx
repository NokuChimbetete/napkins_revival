"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { NapkinMeta, PlaygroundPiece } from "@/lib/playground";
import { NAPKIN_FONTS } from "@/app/playground/fonts";
import { Napkin } from "./Napkin";
import { PieceModal } from "./PieceModal";
import styles from "./playground.module.css";

const FLIP_MS = 300;

const urlFor = (slug?: string | null) =>
  slug ? `/playground?piece=${encodeURIComponent(slug)}` : "/playground";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function NapkinsDrawer({
  napkins,
  initialPiece,
}: {
  napkins: NapkinMeta[];
  initialPiece: PlaygroundPiece | null;
}) {
  const [openPiece, setOpenPiece] = useState<PlaygroundPiece | null>(initialPiece);
  const [flippedSlug, setFlippedSlug] = useState<string | null>(initialPiece?.entry.slug ?? null);
  const [error, setError] = useState<string | null>(null);
  const cache = useRef<Map<string, PlaygroundPiece>>(
    new Map(initialPiece ? [[initialPiece.entry.slug, initialPiece]] : [])
  );
  const opening = useRef(false);

  const fetchPiece = useCallback(async (slug: string): Promise<PlaygroundPiece> => {
    const cached = cache.current.get(slug);
    if (cached) return cached;
    const res = await fetch(`/playground/piece/${encodeURIComponent(slug)}`);
    if (!res.ok) throw new Error(`piece fetch failed: ${res.status}`);
    const piece = (await res.json()) as PlaygroundPiece;
    cache.current.set(slug, piece);
    return piece;
  }, []);

  const openNapkin = useCallback(
    async (slug: string, { pushUrl = true } = {}) => {
      if (opening.current) return;
      opening.current = true;
      setError(null);
      const skipFlip = prefersReducedMotion();
      if (!skipFlip) setFlippedSlug(slug);
      try {
        // modal opens on a timer alongside the flip — NEVER on transitionend,
        // which silently fails to fire if the flip is interrupted or offscreen
        const [piece] = await Promise.all([
          fetchPiece(slug),
          skipFlip ? null : new Promise((r) => setTimeout(r, FLIP_MS)),
        ]);
        setOpenPiece(piece);
        if (pushUrl) window.history.pushState(null, "", urlFor(slug));
      } catch {
        setFlippedSlug(null);
        setError("Couldn’t open that napkin — give it another try.");
      } finally {
        opening.current = false;
      }
    },
    [fetchPiece]
  );

  const closeModal = useCallback((pushUrl = true) => {
    // modal out first, then the napkin flips back underneath
    setOpenPiece(null);
    setFlippedSlug(null);
    if (pushUrl) window.history.pushState(null, "", urlFor(null));
  }, []);

  // browser back/forward: the URL is the source of truth
  useEffect(() => {
    const onPop = () => {
      const slug = new URL(window.location.href).searchParams.get("piece");
      if (slug) void openNapkin(slug, { pushUrl: false });
      else closeModal(false);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [openNapkin, closeModal]);

  // deep link: bring the (already flipped) napkin into view behind the modal
  useEffect(() => {
    if (!initialPiece) return;
    document
      .querySelector(`[data-napkin-slug="${CSS.escape(initialPiece.entry.slug)}"]`)
      ?.scrollIntoView({ block: "center" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className={styles.page}>
      <header className={styles.head}>
        <Link href="/" className={styles.backLink}>
          ← shelf
        </Link>
        <h1 className={styles.pageTitle}>The Napkins Drawer</h1>
        <p className={styles.subtitle}>
          every piece we&rsquo;ve ever published, scattered on the table — pick one up
        </p>
      </header>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <div className={styles.canvas}>
        {napkins.map((n) => (
          <div key={n.slug} data-napkin-slug={n.slug} className={styles.slot}>
            <Napkin
              napkin={n}
              fontFamily={NAPKIN_FONTS[n.look.fontPreset - 1].family}
              flipped={flippedSlug === n.slug}
              onOpen={openNapkin}
            />
          </div>
        ))}
      </div>

      <PieceModal piece={openPiece} onClose={() => closeModal()} />
    </main>
  );
}
