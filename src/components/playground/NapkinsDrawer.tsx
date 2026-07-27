"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import type { NapkinMeta, PlaygroundPiece } from "@/lib/playground";
import { NAPKIN_FONTS } from "@/app/playground/fonts";
import { Napkin } from "./Napkin";
import { PieceModal } from "./PieceModal";
import styles from "./playground.module.css";

/**
 * The drawer is an infinite wooden table. The motion engine is a faithful
 * port of the Framer "Infinite Canvas" component running (at its default
 * props) on emmiwu.com/playground, extracted from its published source:
 *
 *   wheel:  target -= delta * 0.4 (both axes)
 *   drag:   target = dragStart + (pointer - pointerStart) * 0.5, no throw —
 *           the position lerp supplies the glide after release
 *   frame:  current += (target - current) * 0.067          (ease "Snappy" .3)
 *           smoothed velocity: deltaC += (delta - deltaC) * 0.04
 *           smoothed mouse:    mouseC += (mouse - mouseC) * 0.04
 *   item:   offset = 5 * deltaC * ease_i                    (velocity trail)
 *                  + (mouseC - 0.5) * itemSize * 0.6        (cursor parallax)
 *           with ease_i per item in 0.5–1.0 (hashed, not random, for
 *           stability), and the hovered napkin's inner face counter-shifted
 *           by (0.5 - mouseC) * ease_i * 20%
 *   wrap:   torus — every napkin re-enters on the far side, no edges
 *
 * Clicking still flies a fixed-position clone up to modal size while it
 * flips, then the modal appears instantly.
 */

const FLIGHT_MS = 420;
const SCROLL_SPEED = 0.4;
const DRAG_SPEED = 0.5;
const EASE = 0.067; // je(0.3) in the source: 0..1 mapped onto 0.01..0.2
const SMOOTH = 0.04;
const PARALLAX_GENERAL = 1;
const PARALLAX_CHILD = 1;
/** must equal the CSS background-size of .wood */
const WOOD_TILE = 512;

/** field dimensions must match the CSS spot percentages' frame of reference */
const FIELD = { desktop: { w: 5040, h: 4900 }, mobile: { w: 3480, h: 3450 } };

const urlFor = (slug?: string | null) =>
  slug ? `/playground?piece=${encodeURIComponent(slug)}` : "/playground";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const napkinNode = (slug: string) =>
  document.querySelector<HTMLElement>(`[data-napkin-slug="${CSS.escape(slug)}"]`);

const modalBox = () => {
  const w = Math.min(1020, window.innerWidth * 0.94);
  const h = Math.min(window.innerHeight * 0.86, 820);
  return { w, h, cx: window.innerWidth / 2, cy: window.innerHeight / 2 };
};

/** place v on the torus window centred on the viewport */
const wrapCoord = (v: number, size: number, view: number) =>
  v - size * Math.floor((v - (view / 2 - size / 2)) / size);

type ItemState = {
  el: HTMLElement;
  flipper: HTMLElement | null;
  baseX: number;
  baseY: number;
  w: number;
  h: number;
  ease: number;
};

export function NapkinsDrawer({
  napkins,
  initialPiece,
}: {
  napkins: NapkinMeta[];
  initialPiece: PlaygroundPiece | null;
}) {
  const [openPiece, setOpenPiece] = useState<PlaygroundPiece | null>(initialPiece);
  const [openSlug, setOpenSlug] = useState<string | null>(initialPiece?.entry.slug ?? null);
  const [hintGone, setHintGone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const viewportRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const woodRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  const cache = useRef<Map<string, PlaygroundPiece>>(
    new Map(initialPiece ? [[initialPiece.entry.slug, initialPiece]] : [])
  );
  // scroll state, exactly the reference component's shape
  const cur = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });
  const last = useRef({ x: 0, y: 0 });
  const deltaC = useRef({ x: 0, y: 0 });
  const mouseT = useRef({ x: 0.5, y: 0.5 });
  const mouseC = useRef({ x: 0.5, y: 0.5 });
  const items = useRef<ItemState[]>([]);
  const fieldSize = useRef(FIELD.desktop);
  const rafId = useRef(0);
  const drag = useRef<{
    id: number;
    startX: number;
    startY: number;
    scrollX: number;
    scrollY: number;
    moved: number;
    captured: boolean;
  } | null>(null);
  const hovered = useRef<ItemState | null>(null);
  const suppressClickUntil = useRef(0);
  const flightEl = useRef<HTMLDivElement | null>(null);
  const busy = useRef(false);
  const paused = useRef(false);

  const lookOf = useCallback(
    (slug: string) => napkins.find((n) => n.slug === slug) ?? null,
    [napkins]
  );

  // ---- item metrics ------------------------------------------------------

  const measure = useCallback(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    fieldSize.current = window.matchMedia("(max-width: 700px)").matches
      ? FIELD.mobile
      : FIELD.desktop;
    const list: ItemState[] = [];
    for (const n of napkins) {
      const el = napkinNode(n.slug);
      if (!el) continue;
      list.push({
        el,
        flipper: el.querySelector(`.${styles.flipper}`),
        baseX: (n.look.fx / 100) * fieldSize.current.w,
        baseY: (n.look.fy / 100) * fieldSize.current.h,
        w: el.offsetWidth,
        h: el.offsetHeight,
        ease: n.look.parallaxEase,
      });
    }
    items.current = list;
  }, [napkins]);

  // ---- the frame, ported verbatim ---------------------------------------

  const frame = useCallback(() => {
    const reduced = prefersReducedMotion();
    const k = reduced ? 1 : EASE;
    cur.current.x += (target.current.x - cur.current.x) * k;
    cur.current.y += (target.current.y - cur.current.y) * k;
    deltaC.current.x += (cur.current.x - last.current.x - deltaC.current.x) * SMOOTH;
    deltaC.current.y += (cur.current.y - last.current.y - deltaC.current.y) * SMOOTH;
    mouseC.current.x += (mouseT.current.x - mouseC.current.x) * SMOOTH;
    mouseC.current.y += (mouseT.current.y - mouseC.current.y) * SMOOTH;
    last.current.x = cur.current.x;
    last.current.y = cur.current.y;

    const { w: W, h: H } = fieldSize.current;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const general = reduced ? 0 : PARALLAX_GENERAL;

    /* eslint-disable react-hooks/immutability -- imperative rAF loop: writing
       DOM styles through ref-held elements is the mechanism, not a mutation of
       React state */
    for (const it of items.current) {
      const vx = 5 * deltaC.current.x * it.ease * general + (mouseC.current.x - 0.5) * it.w * 0.6 * general;
      const vy = 5 * deltaC.current.y * it.ease * general + (mouseC.current.y - 0.5) * it.h * 0.6 * general;
      const tx = wrapCoord(it.baseX + cur.current.x, W, vw) - it.baseX + vx;
      const ty = wrapCoord(it.baseY + cur.current.y, H, vh) - it.baseY + vy;
      it.el.style.transform = `translate(-50%, -50%) translate3d(${tx}px, ${ty}px, 0)`;
      if (it.flipper) {
        if (hovered.current === it && !reduced) {
          const sx = (0.5 - mouseC.current.x) * it.ease * 20 * PARALLAX_CHILD;
          const sy = (0.5 - mouseC.current.y) * it.ease * 20 * PARALLAX_CHILD;
          it.flipper.style.transform = `translate(${sx}%, ${sy}%)`;
        } else if (it.flipper.style.transform) {
          it.flipper.style.transform = "";
        }
      }
    }

    const wood = woodRef.current;
    if (wood) {
      const wx = ((cur.current.x % WOOD_TILE) + WOOD_TILE) % WOOD_TILE;
      const wy = ((cur.current.y % WOOD_TILE) + WOOD_TILE) % WOOD_TILE;
      wood.style.transform = `translate3d(${wx}px, ${wy}px, 0)`;
    }
    /* eslint-enable react-hooks/immutability */
  }, []);

  // the loop runs continuously, like the reference component — the work is
  // ~110 transform strings; it pauses only while the modal is open
  useEffect(() => {
    const loop = () => {
      if (!paused.current) frame();
      rafId.current = requestAnimationFrame(loop);
    };
    rafId.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId.current);
  }, [frame]);

  useLayoutEffect(() => {
    measure();
    if (initialPiece) {
      const meta = lookOf(initialPiece.entry.slug);
      if (meta) {
        target.current.x = window.innerWidth / 2 - (meta.look.fx / 100) * fieldSize.current.w;
        target.current.y = window.innerHeight / 2 - (meta.look.fy / 100) * fieldSize.current.h;
        cur.current.x = last.current.x = target.current.x;
        cur.current.y = last.current.y = target.current.y;
      }
    }
    frame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | null = null;
    const onResize = () => {
      if (t) clearTimeout(t);
      t = setTimeout(measure, 120);
    };
    window.addEventListener("resize", onResize);
    return () => {
      if (t) clearTimeout(t);
      window.removeEventListener("resize", onResize);
    };
  }, [measure]);

  // ---- input, mapped 1:1 to the reference -------------------------------

  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const onWheel = (e: WheelEvent) => {
      if (busy.current || openPiece) return;
      e.preventDefault();
      const scale = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? vp.clientHeight : 1;
      target.current.x -= e.deltaX * scale * SCROLL_SPEED;
      target.current.y -= e.deltaY * scale * SCROLL_SPEED;
      setHintGone(true);
    };
    vp.addEventListener("wheel", onWheel, { passive: false });
    return () => vp.removeEventListener("wheel", onWheel);
  }, [openPiece]);

  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;

    const onDown = (e: PointerEvent) => {
      if (busy.current || openPiece || !e.isPrimary) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      drag.current = {
        id: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        scrollX: target.current.x,
        scrollY: target.current.y,
        moved: 0,
        captured: false,
      };
    };
    const onMove = (e: PointerEvent) => {
      const d = drag.current;
      if (!d || e.pointerId !== d.id) return;
      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;
      d.moved = Math.max(d.moved, Math.hypot(dx, dy));
      // capture only once it's clearly a drag — capturing on pointerdown
      // would retarget pointerup to the viewport and swallow napkin clicks
      if (!d.captured && d.moved > 4) {
        d.captured = true;
        vp.setPointerCapture(d.id);
        vp.classList.add(styles.grabbing);
        setHintGone(true);
      }
      if (!d.captured) return;
      target.current.x = d.scrollX + dx * DRAG_SPEED;
      target.current.y = d.scrollY + dy * DRAG_SPEED;
    };
    const onUp = (e: PointerEvent) => {
      const d = drag.current;
      if (!d || e.pointerId !== d.id) return;
      if (d.moved > 8) suppressClickUntil.current = performance.now() + 300;
      drag.current = null;
      vp.classList.remove(styles.grabbing);
    };

    vp.addEventListener("pointerdown", onDown);
    vp.addEventListener("pointermove", onMove);
    vp.addEventListener("pointerup", onUp);
    vp.addEventListener("pointercancel", onUp);
    return () => {
      vp.removeEventListener("pointerdown", onDown);
      vp.removeEventListener("pointermove", onMove);
      vp.removeEventListener("pointerup", onUp);
      vp.removeEventListener("pointercancel", onUp);
    };
  }, [openPiece]);

  // dot cursor + the normalized mouse the parallax feeds on
  useEffect(() => {
    const vp = viewportRef.current;
    const dot = dotRef.current;
    if (!vp || !dot) return;
    const onMove = (e: PointerEvent) => {
      mouseT.current.x = e.clientX / window.innerWidth;
      mouseT.current.y = e.clientY / window.innerHeight;
      dot.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
      const t = e.target as HTMLElement;
      dot.style.opacity = vp.contains(t) ? "1" : "0";
      const spot = t.closest?.("[data-napkin-slug]") as HTMLElement | null;
      dot.classList.toggle(styles.dotBig, Boolean(spot));
      hovered.current = spot ? (items.current.find((i) => i.el === spot) ?? null) : null;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (openPiece || busy.current) return;
      const step = e.shiftKey ? 480 : 180;
      const map: Record<string, [number, number]> = {
        ArrowLeft: [step, 0],
        ArrowRight: [-step, 0],
        ArrowUp: [0, step],
        ArrowDown: [0, -step],
        PageUp: [0, window.innerHeight * 0.8],
        PageDown: [0, -window.innerHeight * 0.8],
      };
      const d = map[e.key];
      if (d) {
        e.preventDefault();
        setHintGone(true);
        target.current.x += d[0];
        target.current.y += d[1];
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openPiece]);

  const centerOn = useCallback(
    (slug: string) => {
      const meta = lookOf(slug);
      if (!meta) return;
      const { w: W, h: H } = fieldSize.current;
      let tx = window.innerWidth / 2 - (meta.look.fx / 100) * W;
      let ty = window.innerHeight / 2 - (meta.look.fy / 100) * H;
      // travel to the nearest wrap of the napkin, not across the whole table
      tx += W * Math.round((target.current.x - tx) / W);
      ty += H * Math.round((target.current.y - ty) / H);
      target.current.x = tx;
      target.current.y = ty;
    },
    [lookOf]
  );

  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const onFocus = (e: FocusEvent) => {
      const slug = (e.target as HTMLElement).closest?.("[data-napkin-slug]")?.getAttribute("data-napkin-slug");
      if (slug && !openPiece) centerOn(slug);
    };
    vp.addEventListener("focusin", onFocus);
    return () => vp.removeEventListener("focusin", onFocus);
  }, [centerOn, openPiece]);

  // ---- open / close with the flight ------------------------------------

  const fetchPiece = useCallback(async (slug: string): Promise<PlaygroundPiece> => {
    const cached = cache.current.get(slug);
    if (cached) return cached;
    const res = await fetch(`/playground/piece/${encodeURIComponent(slug)}`);
    if (!res.ok) throw new Error(`piece fetch failed: ${res.status}`);
    const piece = (await res.json()) as PlaygroundPiece;
    cache.current.set(slug, piece);
    return piece;
  }, []);

  /** fixed-position copy of the napkin that can fly above the panning field */
  const buildFlight = useCallback(
    (slug: string) => {
      const spot = napkinNode(slug);
      const inner = spot?.querySelector<HTMLElement>(`.${styles.napkin}`);
      const meta = lookOf(slug);
      if (!spot || !inner || !meta) return null;
      const r = inner.getBoundingClientRect();
      const w = inner.offsetWidth;
      const h = inner.offsetHeight;
      const holder = document.createElement("div");
      holder.className = styles.flight;
      // the safe-area and type-size rules key off these attributes
      holder.dataset.variant = String(meta.look.variant);
      holder.dataset.size = String(meta.look.size);
      holder.style.width = `${w}px`;
      holder.style.height = `${h}px`;
      holder.style.left = `${r.left + r.width / 2}px`;
      holder.style.top = `${r.top + r.height / 2}px`;
      const flipper = inner.querySelector(`.${styles.flipper}`)!.cloneNode(true) as HTMLElement;
      flipper.style.fontFamily = NAPKIN_FONTS[meta.look.fontPreset - 1].family;
      holder.appendChild(flipper);
      document.body.appendChild(holder);
      const box = modalBox();
      const scale = Math.min(box.w / w, box.h / h);
      return {
        holder,
        flipper,
        tilt: meta.look.tilt,
        dx: box.cx - (r.left + r.width / 2),
        dy: box.cy - (r.top + r.height / 2),
        scale,
        spot,
      };
    },
    [lookOf]
  );

  const openNapkin = useCallback(
    async (slug: string, { pushUrl = true } = {}) => {
      if (busy.current) return;
      if (performance.now() < suppressClickUntil.current) return;
      busy.current = true;
      paused.current = true; // freeze the table under the flight and modal
      setError(null);
      const skipFlight = prefersReducedMotion();
      let flight: ReturnType<typeof buildFlight> = null;
      if (!skipFlight) {
        flight = buildFlight(slug);
        if (flight) {
          flightEl.current = flight.holder;
          flight.spot.style.visibility = "hidden";
          const { holder, flipper, tilt, dx, dy, scale } = flight;
          holder.style.transform = `translate(-50%, -50%) rotate(${tilt}deg)`;
          flipper.style.transform = "rotateY(0deg)";
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          holder.offsetWidth; // commit start state
          holder.style.transition = `transform ${FLIGHT_MS}ms cubic-bezier(0.32, 0.72, 0.24, 1)`;
          flipper.style.transition = `transform ${FLIGHT_MS}ms cubic-bezier(0.32, 0.72, 0.24, 1)`;
          holder.style.transform = `translate(-50%, -50%) translate(${dx}px, ${dy}px) rotate(0deg) scale(${scale})`;
          flipper.style.transform = "rotateY(180deg)";
        }
      }
      try {
        // the modal opens on a timer beside the flight — NEVER on transitionend
        const [piece] = await Promise.all([
          fetchPiece(slug),
          flight ? new Promise((r) => setTimeout(r, FLIGHT_MS)) : null,
        ]);
        setOpenSlug(slug);
        setOpenPiece(piece); // dialog shows instantly, no fade
        if (pushUrl) window.history.pushState(null, "", urlFor(slug));
        setTimeout(() => {
          flightEl.current?.remove();
          flightEl.current = null;
        }, 80);
      } catch {
        flight?.holder.remove();
        flightEl.current = null;
        if (flight) flight.spot.style.visibility = "";
        paused.current = false;
        setError("Couldn’t open that napkin — give it another try.");
      } finally {
        busy.current = false;
      }
    },
    [fetchPiece, buildFlight]
  );

  const closeModal = useCallback(
    (pushUrl = true) => {
      const slug = openSlug;
      setOpenPiece(null); // dialog closes instantly; the napkin flies home under it
      setOpenSlug(null);
      if (pushUrl) window.history.pushState(null, "", urlFor(null));
      if (!slug) {
        paused.current = false;
        return;
      }
      const spot = napkinNode(slug);
      if (!spot) {
        paused.current = false;
        return;
      }
      if (prefersReducedMotion()) {
        spot.style.visibility = "";
        paused.current = false;
        return;
      }
      const flight = buildFlight(slug);
      if (!flight) {
        spot.style.visibility = "";
        paused.current = false;
        return;
      }
      const { holder, flipper, tilt, dx, dy, scale } = flight;
      // start where the modal was: centred, grown, flipped
      holder.style.transform = `translate(-50%, -50%) translate(${dx}px, ${dy}px) rotate(0deg) scale(${scale})`;
      flipper.style.transform = "rotateY(180deg)";
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      holder.offsetWidth;
      holder.style.transition = `transform ${FLIGHT_MS}ms cubic-bezier(0.32, 0.72, 0.24, 1)`;
      flipper.style.transition = `transform ${FLIGHT_MS}ms cubic-bezier(0.32, 0.72, 0.24, 1)`;
      holder.style.transform = `translate(-50%, -50%) rotate(${tilt}deg)`;
      flipper.style.transform = "rotateY(0deg)";
      setTimeout(() => {
        holder.remove();
        spot.style.visibility = "";
        paused.current = false;
      }, FLIGHT_MS + 40);
    },
    [openSlug, buildFlight]
  );

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

  // deep link: the napkin under the modal stays hidden until close
  useEffect(() => {
    if (initialPiece) {
      const spot = napkinNode(initialPiece.entry.slug);
      if (spot) spot.style.visibility = "hidden";
      paused.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className={styles.page}>
      <div ref={viewportRef} className={styles.viewport}>
        <div ref={woodRef} className={styles.wood} aria-hidden="true" />
        <div ref={fieldRef} className={styles.field}>
          {napkins.map((n) => (
            <Napkin
              key={n.slug}
              napkin={n}
              fontFamily={NAPKIN_FONTS[n.look.fontPreset - 1].family}
              onOpen={openNapkin}
            />
          ))}
        </div>
      </div>

      <header className={styles.overlay}>
        <Link href="/" className={styles.backLink}>
          ← shelf
        </Link>
        <span className={styles.overlayTitle}>The Napkins Drawer</span>
        <span className={styles.overlayCount}>{napkins.length} napkins</span>
      </header>

      <div className={`${styles.hint}${hintGone ? ` ${styles.hintGone}` : ""}`} aria-hidden="true">
        <span className={styles.hintGlyph}>✥</span> scroll / drag to move
      </div>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <div ref={dotRef} className={styles.dot} aria-hidden="true" />

      <PieceModal piece={openPiece} onClose={() => closeModal()} />
    </main>
  );
}
