"use client";

import { useEffect, useRef, useState } from "react";
import ui from "./ui.module.css";

/**
 * Deleting is the one action here with no undo, and these are irreplaceable
 * student works — some of them are the only copy that still exists anywhere.
 *
 * So this is not an "Are you sure?". The editor has to type the title of the
 * thing they are deleting, which cannot be done by muscle memory, by a
 * mis-click, or by a keyboard shortcut fired at the wrong moment. The server
 * checks the typed string again before it deletes anything, so this is a real
 * gate rather than a UI one.
 */
type Props = {
  open: boolean;
  name: string;
  kind: string;
  detail?: string;
  busy?: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: (typed: string) => void;
};

/** The dialog only exists while it is open, so what the editor typed last time
 *  is gone by construction — no effect resetting state on the way in. */
export function ConfirmDelete(props: Props) {
  return props.open ? <Dialog {...props} /> : null;
}

function Dialog({ name, kind, detail, busy, error, onCancel, onConfirm }: Props) {
  const [typed, setTyped] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const matches = typed.trim() === name.trim();

  return (
    <div
      className={ui.scrim}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className={ui.modal} role="dialog" aria-modal="true" aria-label={`Delete ${name}`}>
        {/* the form spans scroll body and pinned footer, so the submit button
            stays inside it and Enter in the field still submits */}
        <form
          className={ui.modalForm}
          onSubmit={(e) => {
            e.preventDefault();
            if (matches && !busy) onConfirm(typed);
          }}
        >
          <div className={ui.modalScroll}>
            <h2 className={ui.modalTitle}>Delete “{name}”?</h2>
            <p className={ui.modalBody}>
              {detail ??
                `This ${kind} and everything in it will be gone for good. There is no undo.`}
            </p>

            <div className={ui.field}>
              <label className={ui.label} htmlFor="confirm-name">
                Type <strong>{name}</strong> to confirm
              </label>
              <input
                id="confirm-name"
                ref={inputRef}
                className={ui.input}
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                autoComplete="off"
                spellCheck={false}
              />
            </div>

            {error && (
              <p className={ui.error} style={{ margin: "12px 0 0" }}>
                {error}
              </p>
            )}
          </div>

          <div className={ui.modalActions}>
            <button type="button" className={ui.btn} onClick={onCancel} disabled={busy}>
              Keep it
            </button>
            <button
              type="submit"
              className={`${ui.btn} ${ui.btnDanger}`}
              disabled={!matches || busy}
            >
              {busy ? "Deleting…" : `Delete this ${kind}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
