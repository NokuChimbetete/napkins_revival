"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import type { NapkinMeta, PlaygroundPiece } from "@/lib/playground";
import { NAPKIN_FONTS } from "@/app/playground/fonts";
import { Napkin } from "./Napkin";
import { PieceModal } from "./PieceModal";
import styles from "./playground.module.css";

/**
 * The drawer is a wooden table you pan across in any direction — wheel, drag,
 * arrows — modelled on emmiwu.com/playground: one rigid field moved by a
 * lerp-smoothed translate3d with a long inertial tail, a plain mouse wheel
 * travelling diagonally (measured there at ~1.4:1 x:y), drag with thrown
 * momentum, and a dot cursor. Clicking a napkin sends a fixed-position clone
 * flying to the middle — rising, straightening, growing to modal height while
 * it flips — and the modal appears the instant the flip lands.
 */

const FLIGHT_MS = 420;
/** lerp factor per 60fps frame; ~1.5s tail like the reference site */
const EASE = 0.085;
/** pure-vertical mouse wheels travel diagonally (emmiwu ratio 1.4:1) */
const WHEEL_DIAG_X = 0.82;
const WHEEL_DIAG_Y = 0.58;

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
  const dotRef = useRef<HTMLDivElement>(null);

  const cache = useRef<Map<string, PlaygroundPiece>>(
    new Map(initialPiece ? [[initialPiece.entry.slug, initialPiece]] : [])
  );
  const pos = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });
  const rafId = useRef(0);
  const drag = useRef<{
    id: number;
    lastX: number;
    lastY: number;
    lastT: number;
    vx: number;
    vy: number;
    moved: number;
    captured: boolean;
  } | null>(null);
  const suppressClickUntil = useRef(0);
  const trackpadUntil = useRef(0);
  const flightEl = useRef<HTMLDivElement | null>(null);
  const busy = useRef(false);

  const lookOf = useCallback(
    (slug: string) => napkins.find((n) => n.slug === slug) ?? null,
    [napkins]
  );

  // ---- pan engine -------------------------------------------------------

  const clampTarget = useCallback(() => {
    const vp = viewportRef.current;
    const field = fieldRef.current;
    if (!vp || !field) return;
    target.current.x = Math.min(Math.max(target.current.x, 0), Math.max(0, field.offsetWidth - vp.clientWidth));
    target.current.y = Math.min(Math.max(target.current.y, 0), Math.max(0, field.offsetHeight - vp.clientHeight));
  }, []);

  const apply = useCallback(() => {
    const field = fieldRef.current;
    if (field) {
      field.style.transform = `translate3d(${-pos.current.x}px, ${-pos.current.y}px, 0)`;
    }
  }, []);

  const tick = useCallback(
    function loop(last?: number) {
      rafId.current = requestAnimationFrame((now) => {
        const dt = last ? Math.min(now - last, 64) : 16.7;
        // frame-rate–independent exponential approach
        const k = 1 - Math.pow(1 - EASE, dt / 16.7);
        pos.current.x += (target.current.x - pos.current.x) * k;
        pos.current.y += (target.current.y - pos.current.y) * k;
        apply();
        const still =
          Math.abs(target.current.x - pos.current.x) < 0.08 &&
          Math.abs(target.current.y - pos.current.y) < 0.08 &&
          !drag.current;
        if (still) {
          pos.current.x = target.current.x;
          pos.current.y = target.current.y;
          apply();
          rafId.current = 0;
        } else {
          loop(now);
        }
      });
    },
    [apply]
  );

  const kick = useCallback(() => {
    if (!rafId.current) tick();
  }, [tick]);

  const panBy = useCallback(
    (dx: number, dy: number) => {
      target.current.x += dx;
      target.current.y += dy;
      clampTarget();
      kick();
    },
    [clampTarget, kick]
  );

  const centerOn = useCallback(
    (slug: string, instant = false) => {
      const vp = viewportRef.current;
      const field = fieldRef.current;
      const n = lookOf(slug);
      if (!vp || !field || !n) return;
      target.current.x = (n.look.fx / 100) * field.offsetWidth - vp.clientWidth / 2;
      target.current.y = (n.look.fy / 100) * field.offsetHeight - vp.clientHeight / 2;
      clampTarget();
      if (instant) {
        pos.current.x = target.current.x;
        pos.current.y = target.current.y;
        apply();
      } else {
        kick();
      }
    },
    [lookOf, clampTarget, apply, kick]
  );

  // initial position before first paint: deep-linked napkin or field centre
  useLayoutEffect(() => {
    const vp = viewportRef.current;
    const field = fieldRef.current;
    if (!vp || !field) return;
    if (initialPiece) {
      centerOn(initialPiece.entry.slug, true);
    } else {
      target.current.x = (field.offsetWidth - vp.clientWidth) / 2;
      target.current.y = (field.offsetHeight - vp.clientHeight) / 2;
      clampTarget();
      pos.current.x = target.current.x;
      pos.current.y = target.current.y;
      apply();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // wheel: trackpads pan 1:1 on both axes; a plain vertical mouse wheel is
  // sent along the reference site's diagonal so mice explore sideways too
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const onWheel = (e: WheelEvent) => {
      if (busy.current || openPiece) return;
      e.preventDefault();
      const scale = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? vp.clientHeight : 1;
      const dx = e.deltaX * scale;
      const dy = e.deltaY * scale;
      const now = performance.now();
      if (Math.abs(dx) > 0.5) trackpadUntil.current = now + 900;
      setHintGone(true);
      if (now < trackpadUntil.current) {
        panBy(dx, dy);
      } else {
        panBy(dy * WHEEL_DIAG_X, dy * WHEEL_DIAG_Y);
      }
    };
    vp.addEventListener("wheel", onWheel, { passive: false });
    return () => vp.removeEventListener("wheel", onWheel);
  }, [panBy, openPiece]);

  // drag to pan (mouse + touch), with thrown momentum on release
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;

    const onDown = (e: PointerEvent) => {
      if (busy.current || openPiece || !e.isPrimary) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      drag.current = { id: e.pointerId, lastX: e.clientX, lastY: e.clientY, lastT: performance.now(), vx: 0, vy: 0, moved: 0, captured: false };
      kick();
    };
    const onMove = (e: PointerEvent) => {
      const d = drag.current;
      if (!d || e.pointerId !== d.id) return;
      const now = performance.now();
      const dx = e.clientX - d.lastX;
      const dy = e.clientY - d.lastY;
      const dt = Math.max(now - d.lastT, 1);
      // smoothed velocity for the throw
      d.vx = 0.8 * d.vx + 0.2 * (dx / dt) * 1000;
      d.vy = 0.8 * d.vy + 0.2 * (dy / dt) * 1000;
      d.moved += Math.hypot(dx, dy);
      d.lastX = e.clientX;
      d.lastY = e.clientY;
      d.lastT = now;
      // capture only once it's clearly a drag — capturing on pointerdown
      // would retarget pointerup to the viewport and swallow napkin clicks
      if (!d.captured && d.moved > 4) {
        d.captured = true;
        vp.setPointerCapture(d.id);
        vp.classList.add(styles.grabbing);
        setHintGone(true);
      }
      if (!d.captured) return;
      // dragging pins the field to the pointer; lerp adds the cushion
      target.current.x -= dx;
      target.current.y -= dy;
      clampTarget();
      kick();
    };
    const onUp = (e: PointerEvent) => {
      const d = drag.current;
      if (!d || e.pointerId !== d.id) return;
      if (d.moved > 8) {
        suppressClickUntil.current = performance.now() + 300;
        // project the throw ~260ms ahead; the lerp eases it to rest
        target.current.x -= d.vx * 0.26;
        target.current.y -= d.vy * 0.26;
        clampTarget();
      }
      drag.current = null;
      vp.classList.remove(styles.grabbing);
      kick();
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
  }, [clampTarget, kick, openPiece]);

  // arrow keys pan; tabbing to a napkin brings it into view
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (openPiece || busy.current) return;
      const step = e.shiftKey ? 480 : 180;
      const map: Record<string, [number, number]> = {
        ArrowLeft: [-step, 0],
        ArrowRight: [step, 0],
        ArrowUp: [0, -step],
        ArrowDown: [0, step],
        PageUp: [0, -window.innerHeight * 0.8],
        PageDown: [0, window.innerHeight * 0.8],
      };
      const d = map[e.key];
      if (d) {
        e.preventDefault();
        setHintGone(true);
        panBy(d[0], d[1]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panBy, openPiece]);

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

  useEffect(() => {
    const onResize = () => {
      clampTarget();
      kick();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [clampTarget, kick]);

  // dot cursor: tracks at window level, grows over napkins, yields to the
  // real cursor over the fixed chrome (which isn't inside the viewport)
  useEffect(() => {
    const vp = viewportRef.current;
    const dot = dotRef.current;
    if (!vp || !dot) return;
    const onMove = (e: PointerEvent) => {
      dot.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
      const t = e.target as HTMLElement;
      dot.style.opacity = vp.contains(t) ? "1" : "0";
      dot.classList.toggle(styles.dotBig, Boolean(t.closest?.("[data-napkin-slug]")));
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

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
  const buildFlight = useCallback((slug: string) => {
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
  }, [lookOf]);

  const openNapkin = useCallback(
    async (slug: string, { pushUrl = true } = {}) => {
      if (busy.current) return;
      if (performance.now() < suppressClickUntil.current) return;
      busy.current = true;
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
      if (!slug) return;
      const spot = napkinNode(slug);
      if (!spot) return;
      if (prefersReducedMotion()) {
        spot.style.visibility = "";
        return;
      }
      const flight = buildFlight(slug);
      if (!flight) {
        spot.style.visibility = "";
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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className={styles.page}>
      <div ref={viewportRef} className={styles.viewport}>
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
