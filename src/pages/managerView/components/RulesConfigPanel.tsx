import React, { useEffect, useState } from "react";
import { rulesRepository } from "../../../repositories/RulesRepository";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { DEFAULT_RULES } from "../../../types/rules";
import type { ScheduleRules } from "../../../types/rules";
import "./RulesConfigPanel.css";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const RulesConfigPanel: React.FC<Props> = ({ isOpen, onClose }) => {
  const { token } = useAuth();
  const toast = useToast();

  const [rules, setRules] = useState<ScheduleRules>(DEFAULT_RULES);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    rulesRepository
      .getRules()
      .then((saved) => setRules({ ...DEFAULT_RULES, ...saved }))
      .catch(() => toast.error("Failed to load rules."))
      .finally(() => setIsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const set = <K extends keyof ScheduleRules>(key: K, value: ScheduleRules[K]) =>
    setRules((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!token) return;
    setIsSaving(true);
    try {
      const saved = await rulesRepository.updateRules(token, rules);
      setRules({ ...DEFAULT_RULES, ...saved });
      toast.success("Rules saved.");
      onClose();
    } catch {
      toast.error("Failed to save rules.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="rules-panel-backdrop" onClick={onClose}>
      <div className="rules-panel" onClick={(e) => e.stopPropagation()}>
        <div className="rules-panel-header">
          <h3>Schedule Rules</h3>
          <button className="rules-panel-close" onClick={onClose}>✕</button>
        </div>

        <div className="rules-panel-body">
          {isLoading ? (
            <div style={{ textAlign: "center", color: "#718096", padding: "1rem" }}>
              Loading rules…
            </div>
          ) : (
            <>
              <div className="rules-field">
                <label>Buffer before class (minutes)</label>
                <p className="rules-field-hint">
                  How many minutes before a class starts a student cannot be scheduled.
                </p>
                <input
                  type="number"
                  min={0}
                  max={120}
                  value={rules.bufferBeforeClass}
                  onChange={(e) => set("bufferBeforeClass", Math.max(0, parseInt(e.target.value) || 0))}
                />
              </div>

              <div className="rules-field">
                <label>Buffer after class (minutes)</label>
                <p className="rules-field-hint">
                  How many minutes after a class ends a student cannot be scheduled.
                </p>
                <input
                  type="number"
                  min={0}
                  max={120}
                  value={rules.bufferAfterClass}
                  onChange={(e) => set("bufferAfterClass", Math.max(0, parseInt(e.target.value) || 0))}
                />
              </div>

              <div className="rules-field">
                <label>Max hours per week</label>
                <input
                  type="number"
                  min={1}
                  max={40}
                  value={rules.maxHoursPerWeek}
                  onChange={(e) => set("maxHoursPerWeek", Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>

              <div className="rules-field">
                <label>Minimum shift length (hours)</label>
                <p className="rules-field-hint">
                  Shifts shorter than this will be removed from the suggestion.
                </p>
                <input
                  type="number"
                  min={0.5}
                  max={8}
                  step={0.5}
                  value={rules.minShiftLength}
                  onChange={(e) => set("minShiftLength", Math.max(0.5, parseFloat(e.target.value) || 0.5))}
                />
              </div>

              <div className="rules-field">
                <div className="rules-checkbox-row">
                  <input
                    type="checkbox"
                    id="blockDuringClass"
                    checked={rules.blockDuringClass}
                    onChange={(e) => set("blockDuringClass", e.target.checked)}
                  />
                  <span>Block scheduling during class times</span>
                </div>
              </div>

              <div className="rules-field">
                <div className="rules-checkbox-row">
                  <input
                    type="checkbox"
                    id="preferPreferredSlots"
                    checked={rules.preferPreferredSlots}
                    onChange={(e) => set("preferPreferredSlots", e.target.checked)}
                  />
                  <span>Prioritize "Preferred" slots when suggesting</span>
                </div>
              </div>

              <div className="rules-field">
                <label>Min hours per week</label>
                <p className="rules-field-hint">
                  Each student will be prioritised until they reach this target. 0 = no minimum.
                </p>
                <input
                  type="number"
                  min={0}
                  max={40}
                  value={rules.minHoursPerWeek}
                  onChange={(e) => set("minHoursPerWeek", Math.max(0, parseInt(e.target.value) || 0))}
                />
              </div>

              <div className="rules-field">
                <label>Max days per week</label>
                <p className="rules-field-hint">
                  Students will not be scheduled on more than this many days per week.
                </p>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={rules.maxDaysPerWeek}
                  onChange={(e) => set("maxDaysPerWeek", Math.min(5, Math.max(1, parseInt(e.target.value) || 5)))}
                />
              </div>

              <div className="rules-field">
                <label>Max shift length (hours)</label>
                <p className="rules-field-hint">
                  Shifts will be capped at this length. 0 = no limit.
                </p>
                <input
                  type="number"
                  min={0}
                  max={12}
                  step={0.5}
                  value={rules.maxShiftLength}
                  onChange={(e) => set("maxShiftLength", Math.max(0, parseFloat(e.target.value) || 0))}
                />
              </div>

              <div className="rules-field">
                <div className="rules-checkbox-row">
                  <input
                    type="checkbox"
                    id="preferClosingShifts"
                    checked={rules.preferClosingShifts}
                    onChange={(e) => set("preferClosingShifts", e.target.checked)}
                  />
                  <span>Prefer closing shifts (from 16:00 onward)</span>
                </div>
              </div>

              <div className="rules-field rules-field-highlight">
                <div className="rules-checkbox-row">
                  <input
                    type="checkbox"
                    id="allowOverlappingSchedules"
                    checked={rules.allowOverlappingSchedules}
                    onChange={(e) => set("allowOverlappingSchedules", e.target.checked)}
                  />
                  <span>Allow overlapping schedules</span>
                </div>
                <p className="rules-field-hint">
                  When enabled, multiple students can be scheduled at the same time slot.
                </p>
              </div>

              {rules.allowOverlappingSchedules && (
                <div className="rules-field">
                  <label>Target coverage per slot</label>
                  <p className="rules-field-hint">
                    How many students the algorithm will try to assign per time slot.
                  </p>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={rules.targetCoveragePerSlot}
                    onChange={(e) => set("targetCoveragePerSlot", Math.max(1, parseInt(e.target.value) || 2))}
                  />
                </div>
              )}

              <div className="rules-field">
                <label>Custom notes for AI</label>
                <p className="rules-field-hint">
                  Additional instructions passed to the AI when generating suggestions (e.g. "Don't schedule John on Mondays").
                </p>
                <textarea
                  value={rules.customNotes}
                  onChange={(e) => set("customNotes", e.target.value)}
                  placeholder="Optional free-text instructions..."
                />
              </div>
            </>
          )}
        </div>

        <div className="rules-panel-footer">
          <button className="rules-btn secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="rules-btn primary"
            onClick={handleSave}
            disabled={isSaving || isLoading}
          >
            {isSaving ? "Saving…" : "Save Rules"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RulesConfigPanel;
