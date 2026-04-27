"use client";

import { Modal } from "@/components/ui/Modal";
import { taskStatusLabel } from "@/lib/utils";
import type { Task, TaskUpdate } from "./types";
import { TASK_STATUSES, PRIORITIES, inputCls, selectCls, btnPrimary, btnGhost } from "./types";

interface EditTaskModalProps {
  editTask: Task | null;
  editTaskForm: { text: string; owner: string; due: string; status: string; priority: string };
  setEditTaskForm: (form: { text: string; owner: string; due: string; status: string; priority: string }) => void;
  newUpdateText: string;
  setNewUpdateText: (text: string) => void;
  pendingFiles: File[];
  setPendingFiles: (fn: (prev: File[]) => File[]) => void;
  submittingUpdate: boolean;
  displayName: string;
  editingUpdateId: string | null;
  editingUpdateText: string;
  setEditingUpdateText: (text: string) => void;
  onStartUpdateEdit: (update: TaskUpdate) => void;
  onCancelUpdateEdit: () => void;
  onSaveUpdateEdit: () => void;
  onClose: () => void;
  onSave: () => void;
  onAddUpdate: () => void;
}

export function EditTaskModal({
  editTask,
  editTaskForm,
  setEditTaskForm,
  newUpdateText,
  setNewUpdateText,
  pendingFiles,
  setPendingFiles,
  submittingUpdate,
  displayName,
  editingUpdateId,
  editingUpdateText,
  setEditingUpdateText,
  onStartUpdateEdit,
  onCancelUpdateEdit,
  onSaveUpdateEdit,
  onClose,
  onSave,
  onAddUpdate,
}: EditTaskModalProps) {
  return (
    <Modal
      open={!!editTask}
      onClose={onClose}
      title="Edit Task"
      footer={
        <>
          <button onClick={onClose} className={btnGhost}>
            Cancel
          </button>
          <button onClick={onSave} className={btnPrimary}>
            Save
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <label className="block text-[12px] font-medium text-text-2 mb-1">Description</label>
          <input
            value={editTaskForm.text}
            onChange={(e) => setEditTaskForm({ ...editTaskForm, text: e.target.value })}
            className={inputCls}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[12px] font-medium text-text-2 mb-1">Owner</label>
            <input
              value={editTaskForm.owner}
              onChange={(e) => setEditTaskForm({ ...editTaskForm, owner: e.target.value })}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-text-2 mb-1">Due Date</label>
            <input
              type="date"
              value={editTaskForm.due}
              onChange={(e) => setEditTaskForm({ ...editTaskForm, due: e.target.value })}
              className={inputCls}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[12px] font-medium text-text-2 mb-1">Status</label>
            <select
              value={editTaskForm.status}
              onChange={(e) => setEditTaskForm({ ...editTaskForm, status: e.target.value })}
              className={selectCls + " w-full"}
            >
              {TASK_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {taskStatusLabel(s)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[12px] font-medium text-text-2 mb-1">Priority</label>
            <select
              value={editTaskForm.priority}
              onChange={(e) => setEditTaskForm({ ...editTaskForm, priority: e.target.value })}
              className={selectCls + " w-full"}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="border-t border-border pt-4 mt-4">
          <h3 className="text-[13px] font-semibold text-text mb-3">Updates</h3>

          <div className="rounded border border-border bg-surface-2 p-3 space-y-2 mb-4">
            <textarea
              value={newUpdateText}
              onChange={(e) => setNewUpdateText(e.target.value)}
              placeholder="Add a progress note, comment, or status update..."
              rows={2}
              className={`${inputCls} resize-y`}
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 cursor-pointer text-[12px] text-text-2 hover:text-text transition-colors">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-text-3">
                    <path
                      d="M14 10V12.667A1.334 1.334 0 0112.667 14H3.333A1.334 1.334 0 012 12.667V10M11.333 5.333L8 2M8 2L4.667 5.333M8 2v8"
                      stroke="currentColor"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Attach files
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) {
                        setPendingFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
                      }
                      e.target.value = "";
                    }}
                  />
                </label>
                {pendingFiles.length > 0 && (
                  <span className="text-[11px] text-text-3">
                    {pendingFiles.length} file{pendingFiles.length !== 1 ? "s" : ""} selected
                  </span>
                )}
              </div>
              <button
                onClick={onAddUpdate}
                disabled={submittingUpdate || (!newUpdateText.trim() && pendingFiles.length === 0)}
                className={`${btnPrimary} disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {submittingUpdate ? "Posting..." : "Post Update"}
              </button>
            </div>
            {pendingFiles.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {pendingFiles.map((f, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded bg-surface px-2 py-0.5 text-[11px] text-text-2 border border-border"
                  >
                    {f.name}
                    <button
                      onClick={() => setPendingFiles((prev) => prev.filter((_, j) => j !== i))}
                      className="text-text-3 hover:text-red ml-0.5"
                    >
                      x
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {editTask && editTask.updates && editTask.updates.length > 0 ? (
            <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
              {editTask.updates.map((upd) => (
                <div key={upd.id} className="relative pl-5 border-l-2 border-border pb-1">
                  <div className="absolute left-[-5px] top-1 w-2 h-2 rounded-full bg-navy" />
                  <div className="flex items-baseline justify-between gap-2 mb-0.5">
                    <div className="flex items-baseline gap-2">
                      {upd.author && <span className="text-[12px] font-semibold text-text">{upd.author}</span>}
                      <span className="text-[11px] text-text-3">
                        {new Date(upd.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    {upd.author.trim().toLowerCase() === displayName.trim().toLowerCase() && (
                      <button
                        onClick={() => onStartUpdateEdit(upd)}
                        className="text-[11px] text-text-3 hover:text-text"
                        disabled={submittingUpdate}
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  {editingUpdateId === upd.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editingUpdateText}
                        onChange={(e) => setEditingUpdateText(e.target.value)}
                        rows={3}
                        className={`${inputCls} resize-y`}
                      />
                      <div className="flex gap-2">
                        <button onClick={onSaveUpdateEdit} className={btnPrimary} disabled={submittingUpdate}>
                          {submittingUpdate ? "Saving..." : "Save"}
                        </button>
                        <button onClick={onCancelUpdateEdit} className={btnGhost} disabled={submittingUpdate}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[13px] text-text leading-relaxed whitespace-pre-wrap">{upd.text}</p>
                  )}
                  {upd.attachments && upd.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {upd.attachments.map((att) => {
                        const isImage = att.mimeType.startsWith("image/");
                        return (
                          <a
                            key={att.id}
                            href={`/uploads/${att.storedName}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group/att flex items-center gap-1.5 rounded border border-border bg-surface px-2 py-1 text-[11px] text-text-2 hover:border-accent hover:text-accent transition-colors"
                          >
                            {isImage ? (
                              <img
                                src={`/uploads/${att.storedName}`}
                                alt={att.filename}
                                className="w-8 h-8 rounded object-cover"
                              />
                            ) : (
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 16 16"
                                fill="none"
                                className="text-text-3 group-hover/att:text-accent"
                              >
                                <path
                                  d="M9.333 1.333H4A1.333 1.333 0 002.667 2.667v10.666A1.333 1.333 0 004 14.667h8a1.333 1.333 0 001.333-1.334V5.333l-4-4z"
                                  stroke="currentColor"
                                  strokeWidth="1.2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <path
                                  d="M9.333 1.333v4h4"
                                  stroke="currentColor"
                                  strokeWidth="1.2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            )}
                            <span className="max-w-[120px] truncate">{att.filename}</span>
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[12px] text-text-3 italic">No updates yet. Add a note above to track progress.</p>
          )}
        </div>
      </div>
    </Modal>
  );
}
