"use client";

import { useState, useCallback } from "react";
import { Modal } from "@/components/ui/Modal";
import type { Objective } from "./types";
import { inputCls, btnPrimary, btnGhost } from "./types";

interface EditObjectiveModalProps {
  objective: Objective | null;
  onClose: () => void;
  onSave: (objectiveId: string, text: string, description: string) => Promise<boolean>;
}

export function EditObjectiveModal({ objective, onClose, onSave }: EditObjectiveModalProps) {
  if (!objective) {
    return <Modal open={false} onClose={onClose} title="" footer={null}><div /></Modal>;
  }

  return (
    <EditObjectiveModalInner
      key={objective.id}
      objective={objective}
      onClose={onClose}
      onSave={onSave}
    />
  );
}

function EditObjectiveModalInner({
  objective,
  onClose,
  onSave,
}: {
  objective: Objective;
  onClose: () => void;
  onSave: EditObjectiveModalProps["onSave"];
}) {
  const [text, setText] = useState(objective.text);
  const [description, setDescription] = useState(objective.description || "");

  const handleSave = useCallback(async () => {
    if (!text.trim()) return;
    const success = await onSave(objective.id, text, description);
    if (success) onClose();
  }, [text, description, objective.id, onSave, onClose]);

  return (
    <Modal
      open={true}
      onClose={onClose}
      title="Edit Objective"
      footer={
        <>
          <button onClick={onClose} className={btnGhost}>Cancel</button>
          <button onClick={handleSave} className={btnPrimary}>Save</button>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <label className="block text-[12px] font-medium text-text-2 mb-1">Objective</label>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            className={inputCls}
            placeholder="Objective title"
          />
        </div>
        <div>
          <label className="block text-[12px] font-medium text-text-2 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className={`${inputCls} resize-y`}
            placeholder="Add details, context, or success criteria..."
          />
        </div>
      </div>
    </Modal>
  );
}
