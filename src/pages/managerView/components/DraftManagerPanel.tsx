import React, { useEffect, useState } from "react";
import { draftRepository } from "../../../repositories/DraftRepository";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import ConfirmModal from "../../../components/ConfirmModal";
import type { DraftAssignment, DraftSummary } from "../../../types/draft";
import "./DraftManagerPanel.css";

const DRAFT_LIMIT = 10;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  location: string;
  currentAssignments: DraftAssignment[];
  activeDraftId: string | null;
  activeDraftName: string | null;
  onLoadDraft: (assignments: DraftAssignment[], draftId: string, draftName: string) => void;
  onDraftSaved: (draftId: string, name: string) => void;
}

const DraftManagerPanel: React.FC<Props> = ({
  isOpen,
  onClose,
  location,
  currentAssignments,
  activeDraftId,
  activeDraftName,
  onLoadDraft,
  onDraftSaved,
}) => {
  const { token } = useAuth();
  const toast = useToast();

  const [drafts, setDrafts] = useState<DraftSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [saveNameInput, setSaveNameInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [atLimit, setAtLimit] = useState(false);
  const [confirmLoadDraft, setConfirmLoadDraft] = useState<DraftSummary | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !token) return;
    setIsLoading(true);
    draftRepository
      .listDrafts(token, location)
      .then((data) => {
        setDrafts(data);
        setAtLimit(data.length >= DRAFT_LIMIT);
      })
      .catch(() => toast.error("Failed to load drafts."))
      .finally(() => setIsLoading(false));
  }, [isOpen, token, location, toast]);

  const handleSaveNew = async () => {
    if (!token || !saveNameInput.trim() || atLimit) return;
    setIsSaving(true);
    try {
      const draft = await draftRepository.createDraft(
        token,
        saveNameInput.trim(),
        location,
        currentAssignments
      );
      const updated = [draft, ...drafts];
      setDrafts(updated);
      setAtLimit(updated.length >= DRAFT_LIMIT);
      setSaveNameInput("");
      onDraftSaved(draft._id, draft.name);
      toast.success(`Draft "${draft.name}" saved.`);
    } catch {
      toast.error("Failed to save draft.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleOverwrite = async () => {
    if (!token || !activeDraftId) return;
    const currentName =
      drafts.find((d) => d._id === activeDraftId)?.name ?? activeDraftName ?? "Draft";
    setIsSaving(true);
    try {
      const draft = await draftRepository.updateDraft(
        token,
        activeDraftId,
        currentName,
        currentAssignments
      );
      setDrafts((prev) =>
        prev.map((d) => (d._id === activeDraftId ? { ...d, updatedAt: draft.updatedAt } : d))
      );
      toast.success(`Draft "${currentName}" updated.`);
    } catch {
      toast.error("Failed to overwrite draft.");
    } finally {
      setIsSaving(false);
    }
  };

  const loadDraft = async (draft: DraftSummary) => {
    if (!token) return;
    try {
      const full = await draftRepository.getDraft(token, draft._id);
      onLoadDraft(full.assignments, full._id, full.name);
      onClose();
    } catch {
      toast.error("Failed to load draft.");
    }
  };

  const handleLoadClick = (draft: DraftSummary) => {
    if (currentAssignments.length > 0) {
      setConfirmLoadDraft(draft);
    } else {
      loadDraft(draft);
    }
  };

  const handleDelete = async () => {
    if (!token || !confirmDeleteId) return;
    const draftName = drafts.find((d) => d._id === confirmDeleteId)?.name;
    try {
      await draftRepository.deleteDraft(token, confirmDeleteId);
      const updated = drafts.filter((d) => d._id !== confirmDeleteId);
      setDrafts(updated);
      setAtLimit(updated.length >= DRAFT_LIMIT);
      toast.success(`Draft "${draftName}" deleted.`);
    } catch {
      toast.error("Failed to delete draft.");
    } finally {
      setConfirmDeleteId(null);
    }
  };

  if (!isOpen) return null;

  const activeDraftInList = activeDraftId
    ? drafts.find((d) => d._id === activeDraftId)
    : null;

  return (
    <div
      className="draft-panel-backdrop"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="draft-panel">
        <div className="draft-panel-header">
          <h3>Drafts — {location.toUpperCase()}</h3>
          <button className="draft-panel-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="draft-panel-body">
          {/* Active draft status */}
          <div className="draft-panel-status">
            {activeDraftName ? (
              <span>
                Active draft: <strong>{activeDraftName}</strong>
              </span>
            ) : (
              <span className="draft-panel-unsaved">No draft loaded (unsaved)</span>
            )}
          </div>

          {/* Save controls */}
          <div className="draft-panel-save-row">
            <input
              className="draft-panel-name-input"
              type="text"
              placeholder="Draft name..."
              value={saveNameInput}
              onChange={(e) => setSaveNameInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveNew()}
              disabled={isSaving}
            />
            <button
              className="draft-panel-btn primary"
              onClick={handleSaveNew}
              disabled={!saveNameInput.trim() || isSaving || atLimit}
            >
              {isSaving ? "Saving..." : "Save as new"}
            </button>
            {activeDraftInList && (
              <button
                className="draft-panel-btn secondary"
                onClick={handleOverwrite}
                disabled={isSaving}
              >
                Overwrite
              </button>
            )}
          </div>

          {atLimit && (
            <p className="draft-panel-limit-warning">
              Draft limit ({DRAFT_LIMIT}) reached. Delete a draft before saving a new one.
            </p>
          )}

          {/* Draft list */}
          <div className="draft-panel-list">
            {isLoading && <p className="draft-panel-loading">Loading...</p>}
            {!isLoading && drafts.length === 0 && (
              <p className="draft-panel-empty">No drafts saved yet.</p>
            )}
            {drafts.map((draft) => (
              <div
                key={draft._id}
                className={`draft-panel-item${activeDraftId === draft._id ? " active" : ""}`}
              >
                <div className="draft-panel-item-info">
                  <span className="draft-panel-item-name">{draft.name}</span>
                  <span className="draft-panel-item-date">
                    {new Date(draft.updatedAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="draft-panel-item-actions">
                  <button
                    className="draft-panel-btn secondary small"
                    onClick={() => handleLoadClick(draft)}
                  >
                    Load
                  </button>
                  <button
                    className="draft-panel-btn danger small"
                    onClick={() => setConfirmDeleteId(draft._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmLoadDraft !== null}
        title="Load draft"
        message={`Loading "${confirmLoadDraft?.name}" will replace your current unsaved assignments. Continue?`}
        confirmLabel="Load"
        onConfirm={() => {
          const d = confirmLoadDraft!;
          setConfirmLoadDraft(null);
          loadDraft(d);
        }}
        onCancel={() => setConfirmLoadDraft(null)}
      />

      <ConfirmModal
        isOpen={confirmDeleteId !== null}
        title="Delete draft"
        message={`Delete "${drafts.find((d) => d._id === confirmDeleteId)?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
};

export default DraftManagerPanel;
