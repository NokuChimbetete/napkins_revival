"use client";

import { useRef, useState } from "react";
import { coverPath, uploadImage } from "@/lib/admin/upload";
import ui from "./ui.module.css";
import styles from "./issues.module.css";

/** Drag a file on, or click. Both, because half of people will try each. */
export function CoverDrop({
  issueNumber,
  value,
  onChange,
}: {
  issueNumber: number;
  value: string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function take(file: File | undefined) {
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const { url } = await uploadImage(file, "covers", coverPath(issueNumber));
      onChange(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div
        className={`${styles.coverDrop} ${over ? styles.coverDropOver : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          void take(e.dataTransfer.files[0]);
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
        aria-label="Issue cover"
      >
        {value ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- an
                arbitrary Storage URL in an admin-only preview */}
            <img src={value} alt="" className={styles.coverPreview} />
            <span className={styles.coverOverlay}>{busy ? "Uploading…" : "Replace cover"}</span>
          </>
        ) : busy ? (
          <span>Uploading…</span>
        ) : (
          <>
            <strong style={{ fontWeight: 500 }}>Drop the cover here</strong>
            <span style={{ fontSize: 12 }}>or click to choose · JPG, PNG or WebP</span>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          void take(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {error && (
        <p className={ui.error} style={{ marginTop: 10 }}>
          {error}
        </p>
      )}
    </div>
  );
}
