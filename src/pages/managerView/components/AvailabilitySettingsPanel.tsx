import React, { useState, useEffect } from "react";
import { availabilityTypesRepository } from "../../../repositories/AvailabilityTypesRepository";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import type { AvailabilityType } from "../../../types/availabilityType";
import "./AvailabilitySettingsPanel.css";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialTypes: AvailabilityType[];
  onSaved: (types: AvailabilityType[]) => void;
}

const AvailabilitySettingsPanel: React.FC<Props> = ({
  isOpen,
  onClose,
  initialTypes,
  onSaved,
}) => {
  const { token } = useAuth();
  const toast = useToast();

  const [types, setTypes] = useState<AvailabilityType[]>(initialTypes);
  const [isSaving, setIsSaving] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newColor, setNewColor] = useState("#a0c4ff");

  useEffect(() => {
    if (isOpen) {
      setTypes(initialTypes);
      setNewLabel("");
      setNewColor("#a0c4ff");
    }
  }, [isOpen, initialTypes]);

  const update = (idx: number, patch: Partial<AvailabilityType>) =>
    setTypes((prev) => prev.map((t, i) => (i === idx ? { ...t, ...patch } : t)));

  const removeType = (idx: number) =>
    setTypes((prev) => prev.filter((_, i) => i !== idx));

  const addType = () => {
    const trimmed = newLabel.trim();
    if (!trimmed) return;
    const key = trimmed.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    if (!key) return;
    if (types.some((t) => t.key === key)) {
      toast.error(`A type with key "${key}" already exists.`);
      return;
    }
    setTypes((prev) => [
      ...prev,
      { key, label: trimmed, color: newColor, enabled: true, isDefault: false },
    ]);
    setNewLabel("");
    setNewColor("#a0c4ff");
  };

  const handleSave = async () => {
    if (!token) return;
    setIsSaving(true);
    try {
      const saved = await availabilityTypesRepository.updateTypes(token, types);
      toast.success("Availability types saved.");
      onSaved(saved);
      onClose();
    } catch {
      toast.error("Failed to save availability types.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="avail-panel-backdrop" onClick={onClose}>
      <div className="avail-panel" onClick={(e) => e.stopPropagation()}>
        <div className="avail-panel-header">
          <h3>Availability Types</h3>
          <button className="avail-panel-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="avail-panel-body">
          <table className="avail-types-table">
            <thead>
              <tr>
                <th>On</th>
                <th>Color</th>
                <th>Label</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {types.map((t, idx) => (
                <tr key={t.key} className={t.enabled ? "" : "avail-row-disabled"}>
                  <td>
                    <input
                      type="checkbox"
                      checked={t.enabled}
                      onChange={(e) => update(idx, { enabled: e.target.checked })}
                      title="Enable / disable this type"
                    />
                  </td>
                  <td>
                    <input
                      type="color"
                      value={t.color}
                      onChange={(e) => update(idx, { color: e.target.value })}
                      className="avail-color-input"
                      title="Choose color"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={t.label}
                      onChange={(e) => update(idx, { label: e.target.value })}
                      className="avail-label-input"
                      placeholder="Label"
                    />
                  </td>
                  <td>
                    {!t.isDefault && (
                      <button
                        className="avail-delete-btn"
                        onClick={() => removeType(idx)}
                        title="Delete this type"
                        aria-label={`Delete ${t.label}`}
                      >
                        ✕
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="avail-add-row">
            <input
              type="color"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="avail-color-input"
              title="Color for new type"
            />
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="avail-new-label-input"
              placeholder="New type label…"
              onKeyDown={(e) => {
                if (e.key === "Enter") addType();
              }}
            />
            <button
              className="avail-add-btn"
              onClick={addType}
              disabled={!newLabel.trim()}
            >
              + Add
            </button>
          </div>
        </div>

        <div className="avail-panel-footer">
          <button className="avail-cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="avail-save-btn"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvailabilitySettingsPanel;
