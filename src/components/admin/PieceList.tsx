"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { AdminPiece } from "@/lib/admin/data";
import { reorderPieces, setPieceStatus } from "@/lib/admin/actions";
import ui from "./ui.module.css";
import styles from "./issues.module.css";

/**
 * Print order, by dragging.
 *
 * This is also the order napkins are seated on the playground table, so
 * reordering an issue moves its napkins — within that issue's own rows only,
 * because seating is by issue number first (see assignFieldPositions in
 * src/lib/playground.ts). Nothing from another issue shifts.
 *
 * The order is written optimistically and reconciled on the server response: a
 * list that snaps back to its old order for half a second while a round-trip
 * completes reads as a failed drag, and the editor drags again.
 */
export function PieceList({ issueId, pieces }: { issueId: string; pieces: AdminPiece[] }) {
  const router = useRouter();
  const [order, setOrder] = useState(pieces);
  const [serverOrder, setServerOrder] = useState(pieces);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Server data wins whenever it changes underneath us — a piece added,
  // deleted, or a router.refresh() landing. Adjusted during render rather than
  // in an effect: an effect would paint the stale order first and then correct
  // it, which reads as the list flickering back after a drag.
  if (pieces !== serverOrder) {
    setServerOrder(pieces);
    setOrder(pieces);
  }

  const sensors = useSensors(
    // a few pixels of travel before a drag starts, so clicking a link inside a
    // row still counts as a click
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const from = order.findIndex((p) => p.id === active.id);
    const to = order.findIndex((p) => p.id === over.id);
    if (from < 0 || to < 0) return;

    const next = arrayMove(order, from, to);
    setOrder(next);

    start(async () => {
      setError(null);
      const res = await reorderPieces(issueId, next.map((p) => p.id));
      if (!res.ok) {
        setError(res.error);
        setOrder(pieces);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <>
      {error && (
        <p className={ui.error} style={{ marginBottom: 12 }}>
          {error}
        </p>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        onDragEnd={onDragEnd}
      >
        <SortableContext items={order.map((p) => p.id)} strategy={verticalListSortingStrategy}>
          <ul className={styles.list} style={{ gap: 6 }}>
            {order.map((piece, i) => (
              <PieceRow
                key={piece.id}
                piece={piece}
                index={i}
                issueId={issueId}
                busy={pending}
                onError={setError}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      <p className={ui.hint} style={{ marginTop: 12 }}>
        Drag to reorder — this is the order they&rsquo;re read in. Keyboard: tab to a handle, then
        space and the arrow keys.
      </p>
    </>
  );
}

function PieceRow({
  piece,
  index,
  issueId,
  busy,
  onError,
}: {
  piece: AdminPiece;
  index: number;
  issueId: string;
  busy: boolean;
  onError: (m: string | null) => void;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: piece.id,
  });

  const toggle = () =>
    start(async () => {
      onError(null);
      const res = await setPieceStatus(piece.id, piece.status === "draft" ? "published" : "draft");
      if (!res.ok) onError(res.error);
      else router.refresh();
    });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`${styles.pieceRow} ${isDragging ? styles.pieceRowDragging : ""}`}
    >
      <button
        type="button"
        className={styles.grip}
        aria-label={`Reorder ${piece.title}`}
        {...attributes}
        {...listeners}
      >
        ⠿
      </button>
      <span className={styles.pieceIndex}>{index + 1}</span>

      <div className={styles.pieceMeta}>
        <Link href={`/admin/issues/${issueId}/pieces/${piece.id}`} className={styles.pieceTitle}>
          {piece.title}
        </Link>
        <p className={styles.pieceSub}>
          {piece.author_name || "no author"}
          {piece.class_year ? ` (${piece.class_year})` : ""}
          {" · "}
          <span className={styles.slug}>{piece.slug}</span>
        </p>
      </div>

      {piece.is_frontmatter && <span className={styles.tag}>front matter</span>}
      {piece.category && <span className={styles.tag}>{piece.category}</span>}
      <span className={`${ui.pill} ${piece.status === "published" ? ui.pillLive : ui.pillDraft}`}>
        {piece.status === "published" ? "live" : "draft"}
      </span>

      <button
        type="button"
        className={`${ui.btn} ${ui.btnSmall} ${ui.btnGhost}`}
        onClick={toggle}
        disabled={busy || pending}
      >
        {piece.status === "published" ? "Unpublish" : "Publish"}
      </button>
      <Link
        href={`/admin/issues/${issueId}/pieces/${piece.id}`}
        className={`${ui.btn} ${ui.btnSmall}`}
      >
        Edit
      </Link>
    </li>
  );
}
