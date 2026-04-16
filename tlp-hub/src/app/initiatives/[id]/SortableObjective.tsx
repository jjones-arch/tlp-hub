"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Objective } from "./types";

export function SortableObjective({
  obj,
  onToggle,
  onEdit,
  onDelete,
}: {
  obj: Objective;
  onToggle: (obj: Objective) => void;
  onEdit: (obj: Objective) => void;
  onDelete: (obj: Objective) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: obj.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.5 : undefined,
  };

  return (
    <li ref={setNodeRef} style={style} className="flex items-start gap-2.5 group">
      <button
        {...attributes}
        {...listeners}
        className="mt-0.5 flex-shrink-0 cursor-grab active:cursor-grabbing text-text-3 hover:text-text-2 focus:outline-none"
        aria-label="Drag to reorder"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="5.5" cy="3.5" r="1.2" />
          <circle cx="10.5" cy="3.5" r="1.2" />
          <circle cx="5.5" cy="8" r="1.2" />
          <circle cx="10.5" cy="8" r="1.2" />
          <circle cx="5.5" cy="12.5" r="1.2" />
          <circle cx="10.5" cy="12.5" r="1.2" />
        </svg>
      </button>
      <button
        onClick={() => onToggle(obj)}
        className={`mt-0.5 w-[18px] h-[18px] rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
          obj.complete ? "bg-green border-green text-white" : "border-border hover:border-text-3"
        }`}
      >
        {obj.complete && (
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <path
              d="M2.5 6.5L5 9L9.5 3.5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>
      <div className="flex-1 min-w-0">
        <span className={`text-[13.5px] leading-snug ${obj.complete ? "line-through text-text-3" : "text-text"}`}>
          {obj.text}
        </span>
        {obj.description && <p className="text-[12px] text-text-3 mt-0.5 leading-relaxed">{obj.description}</p>}
      </div>
      <div className="opacity-0 group-hover:opacity-100 flex gap-1 flex-shrink-0 transition-opacity">
        <button onClick={() => onEdit(obj)} className="text-text-3 hover:text-text text-[13px]" title="Edit objective">
          ✎
        </button>
        <button
          onClick={() => onDelete(obj)}
          className="text-text-3 hover:text-red text-[13px]"
          title="Delete objective"
        >
          ✕
        </button>
      </div>
    </li>
  );
}
