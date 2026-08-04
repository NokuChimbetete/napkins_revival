"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import styles from "./landing.module.css";

/**
 * The way in.
 *
 * `/admin` is deliberately unlinked — a visible "Admin" link on a student zine
 * is an invitation to rattle the handle, and the editors already know where
 * they're going. Nine clicks on the smiley is the doorbell.
 *
 * It is not a security measure and isn't pretending to be one: everything
 * behind it is gated on the magic link and on RLS. It exists so an editor on a
 * borrowed laptop can get to the admin without remembering a URL.
 *
 * The count resets after a couple of seconds of stillness, so a child hammering
 * the doodle for fun and an editor deliberately counting to nine are the same
 * gesture only if you meant it.
 */
const CLICKS_NEEDED = 9;
const FORGET_AFTER = 2000;

export function SecretDoor() {
  const router = useRouter();
  const [count, setCount] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function knock() {
    if (timer.current) clearTimeout(timer.current);

    const next = count + 1;
    if (next >= CLICKS_NEEDED) {
      setCount(0);
      router.push("/admin");
      return;
    }

    setCount(next);
    timer.current = setTimeout(() => setCount(0), FORGET_AFTER);
  }

  // The last three knocks tilt the doodle a little further each time, so
  // somebody who gets there by accident can tell something is happening and
  // somebody who meant it knows it's working.
  const near = Math.max(0, count - (CLICKS_NEEDED - 4));

  return (
    <button
      type="button"
      onClick={knock}
      className={styles.smileyButton}
      style={near ? { transform: `rotate(${7 + near * 5}deg) scale(${1 + near * 0.03})` } : undefined}
      aria-label="Napkins smiley"
      title="Napkins"
    >
      <Image
        src="/assets/smile-button.svg"
        alt="Hand-drawn smiley doodle"
        width={150}
        height={150}
        className={styles.smileyImg}
      />
    </button>
  );
}
