"use client";

import { useState, useTransition } from "react";
import { addCategory } from "@/lib/admin/actions";
import { looksLikeVerse } from "@/lib/categories";
import type { PieceMeta } from "@/lib/admin/actions";
import ui from "./ui.module.css";

/**
 * The metadata every piece starts with, before any content exists.
 *
 * Two fields carry more weight than they look like they do:
 *
 *  · Category drives verse layout. `EntrySection` gives a piece no-wrap,
 *    wider-measure treatment when the category matches /poetry|poem|verse|song/,
 *    so choosing "Poetry" is also a layout decision. The verse checkbox exists
 *    for the poem filed under "Nonfiction" — one archive piece is exactly that.
 *
 *  · Front matter keeps a foreword off the drawer. It is a real column, not
 *    a magic category string, so it survives an editor typing "Editor's Note".
 */
export function PieceMetaFields({
  value,
  categories,
  onChange,
}: {
  value: PieceMeta;
  categories: string[];
  onChange: (patch: Partial<PieceMeta>) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [fresh, setFresh] = useState("");
  const [added, setAdded] = useState<string[]>([]);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const all = [...categories, ...added.filter((c) => !categories.includes(c))];
  const categoryImpliesVerse = looksLikeVerse(value.category);

  function submitCategory() {
    const name = fresh.trim();
    if (!name) return;
    start(async () => {
      setError(null);
      const res = await addCategory(name);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setAdded((a) => [...a, name]);
      onChange({ category: name });
      setFresh("");
      setAdding(false);
    });
  }

  return (
    <div className={ui.stack}>
      <label className={ui.field}>
        <span className={ui.label}>Title</span>
        <input
          className={ui.input}
          value={value.title}
          autoFocus
          onChange={(e) => onChange({ title: e.target.value })}
        />
      </label>

      <div className={ui.grid2}>
        <label className={ui.field}>
          <span className={ui.label}>Author(s)</span>
          <input
            className={ui.input}
            value={value.author_name}
            placeholder="Ari Perez and Júlia Alkmin"
            onChange={(e) => onChange({ author_name: e.target.value })}
          />
          <span className={ui.hint}>Type them exactly as they should be printed.</span>
        </label>

        <label className={ui.field}>
          <span className={ui.label}>
            Class year <span className={ui.optional}>· optional</span>
          </span>
          <input
            className={ui.input}
            value={value.class_year}
            placeholder="M27"
            onChange={(e) => onChange({ class_year: e.target.value })}
          />
          <span className={ui.hint}>Leave blank for staff or guest contributors.</span>
        </label>
      </div>

      <div className={ui.field}>
        <span className={ui.label}>Category</span>
        {adding ? (
          <div className={ui.btnRow}>
            <input
              className={ui.input}
              style={{ flex: 1 }}
              value={fresh}
              autoFocus
              placeholder="New category name"
              onChange={(e) => setFresh(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submitCategory();
                }
                if (e.key === "Escape") setAdding(false);
              }}
            />
            <button
              type="button"
              className={`${ui.btn} ${ui.btnPrimary}`}
              onClick={submitCategory}
              disabled={pending}
            >
              Add
            </button>
            <button type="button" className={ui.btn} onClick={() => setAdding(false)}>
              Cancel
            </button>
          </div>
        ) : (
          <div className={ui.btnRow}>
            <select
              className={ui.select}
              style={{ flex: 1 }}
              value={value.category ?? ""}
              onChange={(e) => onChange({ category: e.target.value || null })}
            >
              <option value="">— none —</option>
              {all.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <button type="button" className={ui.btn} onClick={() => setAdding(true)}>
              + New
            </button>
          </div>
        )}
        <span className={ui.hint}>
          Pick from the list where you can. Every new one you add is offered to every editor after
          you — which is how “Nonfiction”, “Non-Fiction” and “Non-fiction” all ended up in here
          once already.
        </span>
        {error && <p className={ui.error}>{error}</p>}
      </div>

      <label className={ui.checkRow}>
        <input
          type="checkbox"
          checked={value.is_frontmatter}
          onChange={(e) => onChange({ is_frontmatter: e.target.checked })}
        />
        <span className={ui.checkText}>
          Front matter
          <br />
          <span className={ui.hint}>
            Forewords and editors&rsquo; notes. Read inside the issue, kept off the drawer.
          </span>
        </span>
      </label>

      <label className={ui.checkRow}>
        <input
          type="checkbox"
          checked={value.verse || categoryImpliesVerse}
          disabled={categoryImpliesVerse}
          onChange={(e) => onChange({ verse: e.target.checked })}
        />
        <span className={ui.checkText}>
          Poem — keep every line exactly where it is
          <br />
          <span className={ui.hint}>
            {categoryImpliesVerse
              ? `On automatically because the category is “${value.category}”.`
              : "Lines never wrap; a long one scrolls sideways instead of folding. Tick this for a poem filed under a prose category."}
          </span>
        </span>
      </label>
    </div>
  );
}
