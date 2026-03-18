import React, { useEffect, useRef, useState, useCallback } from "react";
import "./OverlapScheduleBuilder.css";

type Day = "Mon" | "Tue" | "Wed" | "Thu" | "Fri";

function formatTimeTo12Hour(time24: string): string {
  const [hours, minutes] = time24.split(":");
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

function getTimeRangeLabel(
  startIdx: number,
  endIdx: number,
  times: string[]
): string {
  const startTime = times[startIdx];
  const lastTime = times[endIdx];
  if (!startTime || !lastTime) return "";
  const start = formatTimeTo12Hour(startTime);
  const [h, m] = lastTime.split(":").map(Number);
  let endH = h;
  let endM = m + 30;
  if (endM >= 60) { endH++; endM -= 60; }
  const endTimeStr = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
  return `${start} \u2013 ${formatTimeTo12Hour(endTimeStr)}`;
}

interface Student {
  id: string;
  name: string;
  color: string;
  location: string;
}

interface Assignment {
  day: Day;
  time: string;
  studentId: string;
}

interface Block {
  studentId: string;
  startIdx: number;
  endIdx: number;
  numSlots: number;
}

interface OverlapBlock extends Block {
  colIndex: number;
  colTotal: number;
}

interface DragState {
  active: boolean;
  day: Day;
  originIdx: number;
  currentIdx: number;
  dragStudentId: string | null;
  originWasAssigned: boolean;
}

interface ContextMenu {
  x: number;
  y: number;
  day: Day;
  timeIdx: number;
  studentId: string;
  blockStartIdx: number;
  blockEndIdx: number;
}

interface Props {
  days: Day[];
  times: string[];
  students: Student[];
  location: string;
  assignments: Assignment[];
  selectedAssignmentStudent: string;
  onAssignmentStudentChange: (studentId: string) => void;
  onRangeAssign: (
    day: Day,
    startIdx: number,
    endIdx: number,
    studentId: string | null
  ) => void;
  activeDraftName?: string | null;
  onOpenDrafts?: () => void;
  onOpenRules?: () => void;
  onGenerateSuggestion?: () => Promise<void>;
  isGenerating?: boolean;
  onClearAll?: () => void;
}

function getTimesForDay(day: Day): string[] {
  const allTimes = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
    "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
    "17:00", "17:30", "18:00",
  ];
  return day === "Fri"
    ? allTimes.slice(0, allTimes.indexOf("17:00"))
    : allTimes.slice(0, allTimes.indexOf("18:00"));
}

/**
 * Compute blocks with fixed column positions per student for the entire day.
 * Matches StudentSchedulesCalendar layout: each student gets a consistent column.
 */
function computeOverlapBlocks(
  assignments: Assignment[],
  day: Day,
  times: string[],
  studentColumnMap: Map<string, number>,
  totalColumns: number
): OverlapBlock[] {
  // Step 1: Build basic blocks (consecutive assignments for same student)
  const dayAssignments = assignments
    .filter((a) => a.day === day)
    .map((a) => ({ ...a, idx: times.indexOf(a.time) }))
    .filter((a) => a.idx !== -1)
    .sort((a, b) => a.studentId.localeCompare(b.studentId) || a.idx - b.idx);

  if (dayAssignments.length === 0) return [];

  const blocks: Block[] = [];
  let current: Block | null = null;

  for (const a of dayAssignments) {
    if (
      current &&
      a.studentId === current.studentId &&
      a.idx === current.endIdx + 1
    ) {
      current.endIdx = a.idx;
      current.numSlots++;
    } else {
      if (current) blocks.push(current);
      current = { studentId: a.studentId, startIdx: a.idx, endIdx: a.idx, numSlots: 1 };
    }
  }
  if (current) blocks.push(current);

  // Step 2: Assign fixed column based on student's position in the day's roster
  return blocks.map((block) => ({
    ...block,
    colIndex: studentColumnMap.get(block.studentId) ?? 0,
    colTotal: totalColumns,
  }));
}

/**
 * Get the set of students who have assignments on a given day,
 * sorted consistently for stable column ordering.
 */
function getStudentsForDay(assignments: Assignment[], day: Day): string[] {
  const studentIds = new Set<string>();
  for (const a of assignments) {
    if (a.day === day) studentIds.add(a.studentId);
  }
  return Array.from(studentIds).sort();
}

export default function OverlapScheduleBuilder({
  days,
  times,
  students,
  location,
  assignments,
  selectedAssignmentStudent,
  onAssignmentStudentChange,
  onRangeAssign,
  activeDraftName,
  onOpenDrafts,
  onOpenRules,
  onGenerateSuggestion,
  isGenerating = false,
  onClearAll,
}: Props) {
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);

  // Refs so document-level handlers never go stale
  const dragStateRef = useRef<DragState | null>(null);
  useEffect(() => { dragStateRef.current = dragState; });
  const onRangeAssignRef = useRef(onRangeAssign);
  useEffect(() => { onRangeAssignRef.current = onRangeAssign; });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const ds = dragStateRef.current;
      if (!ds?.active) return;
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (!el) return;
      const slotEl = (el as Element).closest("[data-time-idx]") as HTMLElement | null;
      if (!slotEl) return;
      const slotDay = slotEl.getAttribute("data-day") as Day | null;
      if (!slotDay || slotDay !== ds.day) return;
      const timeIdx = parseInt(slotEl.getAttribute("data-time-idx") ?? "-1", 10);
      if (timeIdx < 0 || timeIdx === ds.currentIdx) return;
      setDragState((prev) => (prev ? { ...prev, currentIdx: timeIdx } : null));
    };

    const handleMouseUp = () => {
      const ds = dragStateRef.current;
      if (!ds?.active) return;
      const { day, originIdx, currentIdx, dragStudentId, originWasAssigned } = ds;
      const start = Math.min(originIdx, currentIdx);
      const end = Math.max(originIdx, currentIdx);
      if (originWasAssigned) {
        if (originIdx === currentIdx) {
          // Single click on assigned block = unassign just that student's slots
          // Pass studentId prefixed with "unassign:" so wireframe knows to remove
          onRangeAssignRef.current(day, start, end, `unassign:${dragStudentId}`);
        } else if (currentIdx > originIdx) {
          // Drag right from assigned = extend that student
          onRangeAssignRef.current(day, start, end, dragStudentId);
        } else {
          // Drag left from assigned = unassign that student from the range
          onRangeAssignRef.current(day, start, end, `unassign:${dragStudentId}`);
        }
      } else {
        // From empty slot = assign selected student
        onRangeAssignRef.current(day, start, end, dragStudentId);
      }
      setDragState(null);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const calculateHours = (studentId: string): number =>
    assignments.filter((a) => a.studentId === studentId).length * 0.5;

  const locationStudents = students.filter((s) => s.location === location);

  const handleSlotMouseDown = (e: React.MouseEvent, day: Day, timeIdx: number) => {
    e.preventDefault();
    const time = times[timeIdx];
    if (!selectedAssignmentStudent) return;

    // In overlap mode, clicking a slot instantly adds the selected student to that slot
    // (unless they're already there, in which case we start a drag to extend/shrink)
    const existingForSelected = assignments.find(
      (a) => a.day === day && a.time === time && a.studentId === selectedAssignmentStudent
    );
    if (existingForSelected) {
      // Already assigned here - start drag to modify
      setDragState({
        active: true, day, originIdx: timeIdx, currentIdx: timeIdx,
        dragStudentId: selectedAssignmentStudent, originWasAssigned: true,
      });
    } else {
      // Not assigned here - instantly add to this single slot, then allow drag to extend
      onRangeAssign(day, timeIdx, timeIdx, selectedAssignmentStudent);
      setDragState({
        active: true, day, originIdx: timeIdx, currentIdx: timeIdx,
        dragStudentId: selectedAssignmentStudent, originWasAssigned: false,
      });
    }
  };

  const handleBlockMouseDown = (e: React.MouseEvent, day: Day, block: OverlapBlock) => {
    if (e.button !== 0) return; // right-click handled by onContextMenu
    e.preventDefault();
    e.stopPropagation();
    setContextMenu(null);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const relY = e.clientY - rect.top;
    const slotWithinBlock = Math.max(0, Math.min(block.numSlots - 1, Math.floor(relY / 40)));
    const timeIdx = block.startIdx + slotWithinBlock;

    // Smart click-through: if a different student is selected, add them instead
    if (selectedAssignmentStudent && selectedAssignmentStudent !== block.studentId) {
      const time = times[timeIdx];
      const alreadyHere = assignments.find(
        (a) => a.day === day && a.time === time && a.studentId === selectedAssignmentStudent
      );
      if (!alreadyHere) {
        onRangeAssign(day, timeIdx, timeIdx, selectedAssignmentStudent);
      }
      // Start a drag so they can extend by dragging further
      setDragState({
        active: true, day, originIdx: timeIdx, currentIdx: timeIdx,
        dragStudentId: selectedAssignmentStudent, originWasAssigned: false,
      });
      return;
    }

    // Same student or none selected → existing behavior (drag to extend/shrink)
    setDragState({
      active: true, day, originIdx: timeIdx, currentIdx: timeIdx,
      dragStudentId: block.studentId, originWasAssigned: true,
    });
  };

  // Right-click context menu on blocks
  const handleBlockContextMenu = (e: React.MouseEvent, day: Day, block: OverlapBlock) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const relY = e.clientY - rect.top;
    const slotWithinBlock = Math.max(0, Math.min(block.numSlots - 1, Math.floor(relY / 40)));
    const timeIdx = block.startIdx + slotWithinBlock;
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      day,
      timeIdx,
      studentId: block.studentId,
      blockStartIdx: block.startIdx,
      blockEndIdx: block.endIdx,
    });
  };

  const handleContextMenuAction = useCallback((action: "remove-slot" | "remove-block" | "clear-slot") => {
    if (!contextMenu) return;
    const { day, timeIdx, studentId, blockStartIdx, blockEndIdx } = contextMenu;
    switch (action) {
      case "remove-slot":
        onRangeAssign(day, timeIdx, timeIdx, `unassign:${studentId}`);
        break;
      case "remove-block":
        onRangeAssign(day, blockStartIdx, blockEndIdx, `unassign:${studentId}`);
        break;
      case "clear-slot":
        // Remove all students at this slot
        assignments
          .filter((a) => a.day === day && a.time === times[timeIdx])
          .forEach((a) => onRangeAssign(day, timeIdx, timeIdx, `unassign:${a.studentId}`));
        break;
    }
    setContextMenu(null);
  }, [contextMenu, onRangeAssign, assignments, times]);

  // Close context menu on outside click or scroll
  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    document.addEventListener("mousedown", close);
    document.addEventListener("scroll", close, true);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("scroll", close, true);
    };
  }, [contextMenu]);

  return (
    <div className="schedule-builder overlap-schedule-builder">
      <div className="sb-draft-bar">
        <span className="sb-draft-status">
          {activeDraftName ? (
            <>
              Draft: <strong>{activeDraftName}</strong>
            </>
          ) : (
            <span className="sb-draft-unsaved">Unsaved</span>
          )}
          <span className="sb-overlap-badge">Overlap Mode</span>
        </span>
        <div className="sb-draft-actions">
          {onGenerateSuggestion && (
            <button
              className="sb-suggest-btn"
              onClick={onGenerateSuggestion}
              disabled={isGenerating}
            >
              {isGenerating ? "Generating…" : "✨ Suggest Schedule"}
            </button>
          )}
          {onOpenRules && (
            <button className="sb-draft-btn" onClick={onOpenRules}>
              Rules
            </button>
          )}
          {onOpenDrafts && (
            <button className="sb-draft-btn" onClick={onOpenDrafts}>
              Drafts
            </button>
          )}
        </div>
      </div>
      <div className="schedule-builder-layout">
        {/* Sidebar */}
        <div className="schedule-builder-sidebar">
          <h3 className="sb-sidebar-title">Assignment Grid</h3>

          <div className="sb-sidebar-section">
            <div className="sb-sidebar-label">Assign to:</div>
            <select
              className="assignment-select sb-select-full"
              value={selectedAssignmentStudent}
              onChange={(e) => onAssignmentStudentChange(e.target.value)}
            >
              <option value="" disabled>Select student</option>
              {locationStudents.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="sb-sidebar-section">
            <div className="sb-sidebar-label">Student (Hours)</div>
            {locationStudents.map((student) => (
              <div
                key={student.id}
                className={`sb-student-row${
                  student.id === selectedAssignmentStudent ? " sb-student-row--active" : ""
                }`}
                style={{ borderLeftColor: student.color }}
                onClick={() => onAssignmentStudentChange(student.id)}
              >
                <span className="sb-student-name">{student.name}</span>
                <span className="sb-student-hours">{calculateHours(student.id)}h</span>
              </div>
            ))}
          </div>

          {onClearAll && (
            <div className="sb-sidebar-section">
              <button className="sb-clear-all-btn" onClick={onClearAll}>
                Clear All
              </button>
            </div>
          )}
        </div>

        {/* Time grid — column-based with overlap support */}
        <div className={`assignment-grid-wrapper${dragState?.active ? " is-dragging" : ""}`}>
          <div className="assignment-grid">

            {/* Time label column */}
            <div className="assignment-time-col">
              <div className="assignment-time-header"></div>
              {times.map((time) => (
                <div key={time} className="assignment-time-cell">
                  {formatTimeTo12Hour(time)}
                </div>
              ))}
            </div>

            {/* One column per day */}
            {days.map((day) => {
              const dayTimes = getTimesForDay(day);
              // Build fixed column map: each student gets a consistent column for the entire day
              const studentsForDay = getStudentsForDay(assignments, day);
              const studentColumnMap = new Map<string, number>();
              studentsForDay.forEach((sid, idx) => studentColumnMap.set(sid, idx));
              const totalColumns = Math.max(1, studentsForDay.length);
              const blocks = computeOverlapBlocks(assignments, day, times, studentColumnMap, totalColumns);

              const isDragDay = !!(dragState?.active && dragState.day === day);
              const dragStart = isDragDay ? Math.min(dragState!.originIdx, dragState!.currentIdx) : -1;
              const dragEnd   = isDragDay ? Math.max(dragState!.originIdx, dragState!.currentIdx) : -1;
              const isTrimDrag = isDragDay && dragState!.originWasAssigned && dragState!.currentIdx < dragState!.originIdx;
              const previewStudent =
                isDragDay && !isTrimDrag && dragState!.dragStudentId
                  ? students.find((s) => s.id === dragState!.dragStudentId) ?? null
                  : null;

              return (
                <div key={day} className="assignment-day-col">
                  <div className="assignment-day-header">{day}</div>

                  <div className="assignment-day-body">
                    {/* Interaction slots with coverage badges */}
                    {times.map((time, timeIdx) => {
                      const isOutOfBounds = timeIdx >= dayTimes.length;
                      return (
                        <div
                          key={time}
                          data-day={day}
                          data-time-idx={timeIdx}
                          className={`assignment-slot${isOutOfBounds ? " empty" : ""}`}
                          onMouseDown={
                            isOutOfBounds ? undefined : (e) => handleSlotMouseDown(e, day, timeIdx)
                          }
                        />
                      );
                    })}

                    {/* Committed assignment blocks with overlap layout */}
                    {blocks.map((block) => {
                      const student = students.find((s) => s.id === block.studentId);
                      if (!student) return null;
                      const hours = block.numSlots * 0.5;
                      const timeRange = getTimeRangeLabel(block.startIdx, block.endIdx, times);
                      const tooltipText = `${student.name}\n${hours}h • ${block.numSlots} slots\n${timeRange}`;
                      
                      // Column layout: width and left position based on overlap
                      const colWidth = 100 / block.colTotal;
                      const colLeft = block.colIndex * colWidth;
                      
                      return (
                        <div
                          key={`${block.studentId}-${block.startIdx}`}
                          className="assignment-block overlap-block"
                          style={{
                            top: block.startIdx * 40,
                            height: block.numSlots * 40,
                            width: `${colWidth}%`,
                            left: `${colLeft}%`,
                            background: student.color,
                            borderLeftColor: student.color,
                          }}
                          onMouseEnter={(e) => setTooltip({ text: tooltipText, x: e.clientX, y: e.clientY })}
                          onMouseMove={(e) => setTooltip((prev) => prev ? { ...prev, x: e.clientX, y: e.clientY } : null)}
                          onMouseLeave={() => setTooltip(null)}
                          onMouseDown={(e) => { setTooltip(null); handleBlockMouseDown(e, day, block); }}
                          onContextMenu={(e) => handleBlockContextMenu(e, day, block)}
                        >
                          <span className="assignment-block-name">{student.name}</span>
                          <span className="assignment-block-info">{hours}h</span>
                        </div>
                      );
                    })}

                    {/* Drag preview overlay */}
                    {isDragDay && dragStart >= 0 && (
                      <div
                        className="assignment-block assignment-block-preview"
                        style={{
                          top: dragStart * 40,
                          height: (dragEnd - dragStart + 1) * 40,
                          background: isTrimDrag
                            ? "rgba(229,62,62,0.2)"
                            : previewStudent
                            ? previewStudent.color
                            : "rgba(66,153,225,0.3)",
                          borderLeftColor: isTrimDrag
                            ? "#e53e3e"
                            : (previewStudent?.color ?? "#4299e1"),
                          opacity: 0.75,
                          pointerEvents: "none",
                          zIndex: 5,
                        }}
                      >
                        {!isTrimDrag && previewStudent && (
                          <span className="assignment-block-name">{previewStudent.name}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {tooltip && (
        <div
          className="assignment-tooltip"
          style={{ left: tooltip.x + 14, top: tooltip.y + 14 }}
        >
          {tooltip.text}
        </div>
      )}

      {/* Right-click context menu */}
      {contextMenu && (
        <div
          className="overlap-context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            className="overlap-context-item"
            onClick={() => handleContextMenuAction("remove-slot")}
          >
            Remove {students.find((s) => s.id === contextMenu.studentId)?.name ?? "student"} (this slot)
          </button>
          <button
            className="overlap-context-item"
            onClick={() => handleContextMenuAction("remove-block")}
          >
            Remove {students.find((s) => s.id === contextMenu.studentId)?.name ?? "student"} (entire block)
          </button>
          <div className="overlap-context-divider" />
          <button
            className="overlap-context-item overlap-context-item--danger"
            onClick={() => handleContextMenuAction("clear-slot")}
          >
            Clear all from this slot
          </button>
        </div>
      )}
    </div>
  );
}
