"use client";

import { useState } from "react";
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
import type { Block } from "@/lib/blocks/types";
import { KIND_LABEL, cloneBlock, describeBlock } from "./blockOps";
import { BlockBody } from "./BlockBody";
import { BlockPalette } from "./BlockPalette";
import styles from "./builder.module.css";

/**
 * A container of blocks: the piece body, a group, or one column of a row.
 *
 * Each container owns its own DndContext, so a drag reorders within its own
 * list and cannot accidentally drop a paragraph into a column two levels down.
 * Nothing gets trapped, because a nested block can be lifted back out to its
 * parent with one button.
 */
export type ListProps = {
  blocks: Block[];
  onChange: (next: Block[]) => void;
  verse: boolean;
  issueNumber: number;
  slug: string;
  depth?: number;
  /** Present when this list is nested; pops a block up to the parent list. */
  onLift?: (block: Block) => void;
  compact?: boolean;
};

export function BlockList(props: ListProps) {
  const { blocks, onChange, depth = 0, compact } = props;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = blocks.findIndex((b) => b.id === active.id);
    const to = blocks.findIndex((b) => b.id === over.id);
    if (from < 0 || to < 0) return;
    onChange(arrayMove(blocks, from, to));
  }

  const replace = (i: number, next: Block) =>
    onChange(blocks.map((b, j) => (j === i ? next : b)));

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        onDragEnd={onDragEnd}
      >
        <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          <ul className={styles.blocks}>
            {blocks.map((block, i) => (
              <SortableBlock
                key={block.id}
                block={block}
                list={props}
                onReplace={(next) => replace(i, next)}
                onRemove={() => onChange(blocks.filter((_, j) => j !== i))}
                onDuplicate={() =>
                  onChange([...blocks.slice(0, i + 1), cloneBlock(block), ...blocks.slice(i + 1)])
                }
                onLift={
                  props.onLift &&
                  (() => {
                    onChange(blocks.filter((_, j) => j !== i));
                    props.onLift?.(block);
                  })
                }
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      <BlockPalette
        compact={compact || depth > 0}
        onAdd={(block) => onChange([...blocks, block])}
      />
    </>
  );
}

function SortableBlock({
  block,
  list,
  onReplace,
  onRemove,
  onDuplicate,
  onLift,
}: {
  block: Block;
  list: ListProps;
  onReplace: (b: Block) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onLift?: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`${styles.block} ${isDragging ? styles.blockDragging : ""}`}
    >
      <div className={styles.blockBar}>
        <button
          type="button"
          className={styles.blockGrip}
          aria-label={`Move ${KIND_LABEL[block.type]}`}
          {...attributes}
          {...listeners}
        >
          ⠿
        </button>
        <span className={styles.blockKind}>{KIND_LABEL[block.type]}</span>
        {collapsed && (
          <span className={styles.metaSummary} style={{ fontSize: 12 }}>
            {describeBlock(block)}
          </span>
        )}
        <span className={styles.blockSpacer} />

        {onLift && (
          <button
            type="button"
            className={styles.blockAct}
            onClick={onLift}
            title="Move this out of the column"
          >
            ⤴
          </button>
        )}
        <button
          type="button"
          className={styles.blockAct}
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? "▸" : "▾"}
        </button>
        <button type="button" className={styles.blockAct} onClick={onDuplicate} title="Duplicate">
          ⧉
        </button>
        <button
          type="button"
          className={`${styles.blockAct} ${styles.blockActDanger}`}
          onClick={onRemove}
          title="Remove this block"
        >
          ✕
        </button>
      </div>

      {!collapsed && (
        <div className={styles.blockBody}>
          <BlockBody block={block} list={list} onChange={onReplace} />
        </div>
      )}
    </li>
  );
}
