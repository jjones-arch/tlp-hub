"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { inputCls, btnPrimary, btnGhost } from "./types";

interface AddDecisionModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { text: string; date: string }) => Promise<boolean>;
}

export function AddDecisionModal({ open, onClose, onSave }: AddDecisionModalProps) {
  const [text, setText] = useState("");
  const [date, setDate] = useState("");

  async function handleSave() {
    if (!text.trim()) return;
    const success = await onSave({ text, date });
    if (success) {
      setText("");
      setDate("");
      onClose();
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Decision"
      footer={
        <>
          <button onClick={onClose} className={btnGhost}>
            Cancel
          </button>
          <button onClick={handleSave} className={btnPrimary}>
            Save
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <label className="block text-[12px] font-medium text-text-2 mb-1">Decision</label>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            className={inputCls}
            placeholder="What was decided?"
          />
        </div>
        <div>
          <label className="block text-[12px] font-medium text-text-2 mb-1">Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
        </div>
      </div>
    </Modal>
  );
}
