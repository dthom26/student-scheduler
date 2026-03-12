import React, { useEffect, useRef, useState } from "react";

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

interface DragState {
  active: boolean;
  day: Day;
  originIdx: number;
  currentIdx: number;
  dragStudentId: string | null;
  originWasAssigned: boolean;
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

function computeBlocks(
  assignments: Assignment[],
  day: Day,
  times: string[]
): Block[] {
  const dayAssignments = assignments
    .filter((a) => a.day === day)
    .map((a) => ({ ...a, idx: times.indexOf(a.time) }))
    .filter((a) => a.idx !== -1)
    .sort((a, b) => a.idx - b.idx);

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
  return blocks;
}

export default function ScheduleBuilder({
  days,
  times,
  students,
  location,
  assignments,
  selectedAssignmentStudent,
  onAssignmentStudentChange,
  onRangeAssign,
}: Props) {
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

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
          onRangeAssignRef.current(day, start, end, null);
        } else if (currentIdx > originIdx) {
          onRangeAssignRef.current(day, start, end, dragStudentId);
        } else {
          onRangeAssignRef.current(day, start, end, null);
        }
      } else {
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
  }, []); // attach once; all values accessed via refs

  const calculateHours = (studentId: string): number =>
    assignments.filter((a) => a.studentId === studentId).length * 0.5;

  const locationStudents = students.filter((s) => s.location === location);

  const handleSlotMouseDown = (e: React.MouseEvent, day: Day, timeIdx: number) => {
    e.preventDefault();
    const time = times[timeIdx];
    const existing = assignments.find((a) => a.day === day && a.time === time);
    if (existing) {
      setDragState({
        active: true, day, originIdx: timeIdx, currentIdx: timeIdx,
        dragStudentId: existing.studentId, originWasAssigned: true,
      });
    } else if (selectedAssignmentStudent) {
      setDragState({
        active: true, day, originIdx: timeIdx, currentIdx: timeIdx,
        dragStudentId: selectedAssignmentStudent, originWasAssigned: false,
      });
    }
  };

  const handleBlockMouseDown = (e: React.MouseEvent, day: Day, block: Block) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const relY = e.clientY - rect.top;
    const slotWithinBlock = Math.max(0, Math.min(block.numSlots - 1, Math.floor(relY / 40)));
    const timeIdx = block.startIdx + slotWithinBlock;
    setDragState({
      active: true, day, originIdx: timeIdx, currentIdx: timeIdx,
      dragStudentId: block.studentId, originWasAssigned: true,
    });
  };

  return (
    <div className="schedule-builder">
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
        </div>

        {/* Time grid â€” column-based, matching StudentSchedulesCalendar */}
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
              const blocks = computeBlocks(assignments, day, times);

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
                    {/* Invisible interaction slots â€” provide hit targets + border grid */}
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

                    {/* Committed assignment blocks */}
                    {blocks.map((block) => {
                      const student = students.find((s) => s.id === block.studentId);
                      if (!student) return null;
                      const hours = block.numSlots * 0.5;
                      const timeRange = getTimeRangeLabel(block.startIdx, block.endIdx, times);
                      const tooltip = `${student.name}\n${hours}h \u2022 ${block.numSlots} slots\n${timeRange}`;
                      return (
                        <div
                          key={`${block.studentId}-${block.startIdx}`}
                          className="assignment-block"
                          style={{
                            top: block.startIdx * 40,
                            height: block.numSlots * 40,
                            background: student.color,
                            borderLeftColor: student.color,
                          }}
                          onMouseEnter={(e) => setTooltip({ text: tooltip, x: e.clientX, y: e.clientY })}
                          onMouseMove={(e) => setTooltip((prev) => prev ? { ...prev, x: e.clientX, y: e.clientY } : null)}
                          onMouseLeave={() => setTooltip(null)}
                          onMouseDown={(e) => { setTooltip(null); handleBlockMouseDown(e, day, block); }}
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
    </div>
  );
}
