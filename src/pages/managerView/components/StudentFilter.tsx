import { useState, useCallback } from "react";
import { useToast } from "../../../context/ToastContext";
import { useAuth } from "../../../context/AuthContext";
import ConfirmModal from "../../../components/ConfirmModal";

interface Student {
  id: string;
  name: string;
  color: string;
  location: string;
  notes?: string;
}

interface CellType {
  label: string;
  color: string;
}

interface Props {
  location: string;
  selectedStudents: string[];
  onStudentToggle: (id: string) => void;
  students: Student[];
  cellTypes: Record<string, CellType>;
  onTypeFilterChange?: (selectedTypes: string[]) => void;
  onClearScheduleOptimistic?: (studentId: string) => Promise<void>;
  onDeleteSubmissionOptimistic?: (studentId: string) => Promise<void>;
}

export default function StudentFilter({
  location,
  selectedStudents,
  onStudentToggle,
  students,
  cellTypes,
  onTypeFilterChange,
  onClearScheduleOptimistic,
  onDeleteSubmissionOptimistic,
}: Props) {
  console.log(students);
  const { role } = useAuth();
  const toast = useToast();
  // Prefer role from context when available; fallback handled by parent props
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(
    new Set()
  );
  const [selectedTypes, setSelectedTypes] = useState<string[]>(
    Object.keys(cellTypes)
  );

  const toggleExpansion = (studentId: string) => {
    setExpandedStudents((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  };

  const handleTypeToggle = (typeKey: string) => {
    setSelectedTypes((prev) => {
      const newTypes = prev.includes(typeKey)
        ? prev.filter((t) => t !== typeKey)
        : [...prev, typeKey];
      onTypeFilterChange?.(newTypes);
      return newTypes;
    });
  };
  
  // Confirm modal state for manager actions
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    | { type: "clear" | "delete"; studentId: string; studentName: string }
    | null
  >(null);

  const openConfirm = useCallback((type: "clear" | "delete", studentId: string, studentName: string) => {
    setPendingAction({ type, studentId, studentName });
    setConfirmOpen(true);
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmOpen(false);
    setPendingAction(null);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!pendingAction) return;

    try {
      if (pendingAction.type === "clear") {
        if (!onClearScheduleOptimistic) throw new Error("Clear handler not provided");
        await onClearScheduleOptimistic(pendingAction.studentId);
      } else {
        if (!onDeleteSubmissionOptimistic) throw new Error("Delete handler not provided");
        await onDeleteSubmissionOptimistic(pendingAction.studentId);
      }
      closeConfirm();
    } catch (err: any) {
      console.error(err);
      try {
        toast.error(err?.message || "Action failed");
      } catch {
        // eslint-disable-next-line no-alert
        alert(err?.message || "Action failed");
      }
      closeConfirm();
    }
  }, [pendingAction, closeConfirm, onClearScheduleOptimistic, onDeleteSubmissionOptimistic]);
  return (
    <aside className="manager-sidebar">
      <h3>Students</h3>
      <ul className="student-list">
        {students
          .filter((s) => s.location === location)
          .map((s) => (
            <li key={s.id} className="student-item">
              <div className="student-header">
                <label className="student-label">
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(s.id)}
                    onChange={() => onStudentToggle(s.id)}
                  />{" "}
                  {s.name} ({s.id})
                </label>
                {s.notes && (
                  <button
                    onClick={() => toggleExpansion(s.id)}
                    aria-expanded={expandedStudents.has(s.id)}
                    className="expand-toggle"
                  >
                    {expandedStudents.has(s.id) ? "▼" : "▶"}
                  </button>
                )}
                {role === "manager" && (
                  <div className="student-actions">
                    <button
                      className="icon-btn"
                      onClick={() => openConfirm("clear", s.id, s.name)}
                      aria-label={`Clear schedule for ${s.name}`}
                      title={`Clear schedule for ${s.name}`}
                    >
                      <svg
                        className="icon-svg"
                        aria-hidden="true"
                        focusable="false"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M3 16.5L8.5 22l10-10-5.5-5.5L3 16.5z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                        <path d="M14 6l4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M7 17l6-6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="icon-tooltip">Clear schedule</span>
                    </button>
                    <button
                      className="icon-btn danger"
                      onClick={() => openConfirm("delete", s.id, s.name)}
                      aria-label={`Delete ${s.name}`}
                      title={`Delete ${s.name}`}
                      style={{ marginLeft: 8 }}
                    >
                      <svg
                        className="icon-svg"
                        aria-hidden="true"
                        focusable="false"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M10 11v6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M14 11v6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="icon-tooltip">Delete student</span>
                    </button>
                  </div>
                )}
              </div>
              {expandedStudents.has(s.id) && s.notes && (
                <div className="student-notes">
                  <p>{s.notes}</p>
                </div>
              )}
            </li>
          ))}
      </ul>

      <ConfirmModal
        isOpen={confirmOpen}
        title={pendingAction?.type === "delete" ? "Delete student" : "Clear schedule"}
        message={
          pendingAction
            ? pendingAction.type === "delete"
              ? `Delete ${pendingAction.studentName} and their schedule? This cannot be undone.`
              : `Clear the schedule for ${pendingAction.studentName}? This will remove all time slots but keep the student.`
            : ""
        }
        danger={pendingAction?.type === "delete"}
        confirmLabel={pendingAction?.type === "delete" ? "Delete" : "Clear"}
        onCancel={closeConfirm}
        onConfirm={handleConfirm}
      />

      <div className="legend-section">
        <h4>Schedule Legend</h4>
        <div className="legend-items">
          {Object.entries(cellTypes).map(([key, type]) => (
            <div key={key} className="legend-item">
              <input
                type="checkbox"
                id={`type-filter-${key}`}
                checked={selectedTypes.includes(key)}
                onChange={() => handleTypeToggle(key)}
              />
              <div
                className="legend-color"
                style={{ backgroundColor: type.color }}
              ></div>
              <span className="legend-label">{type.label}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
