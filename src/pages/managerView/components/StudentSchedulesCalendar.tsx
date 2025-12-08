import { memo, useMemo } from "react";

type StudentStatus = "available" | "notAvailable" | "class" | "preferred";
type Day = "Mon" | "Tue" | "Wed" | "Thu" | "Fri";

import "./StudentSchedulesCalendar.css";

function formatTimeTo12Hour(time24: string): string {
  const [hours, minutes] = time24.split(":");
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

function getTimeRangeForBlock(
  day: Day,
  startIdx: number,
  endIdx: number
): string {
  // Use full times array to access extended slots
  const allTimes = [
    "08:00",
    "08:30",
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "12:00",
    "12:30",
    "13:00",
    "13:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30",
    "17:00",
    "17:30",
    "18:00",
  ];
  const startTime = allTimes[startIdx];
  const endTime = allTimes[endIdx];

  // End time is 30 minutes after the end slot
  const [endHours, endMinutes] = endTime.split(":");
  const endDate = new Date();
  endDate.setHours(parseInt(endHours, 10), parseInt(endMinutes, 10));
  endDate.setMinutes(endDate.getMinutes() + 30);

  // Cap end times at business closing hours
  if (day === "Fri" && endDate.getHours() >= 17) {
    // Friday: any slot that would end at or after 5:00 PM should cap at 5:00 PM
    endDate.setHours(17, 0);
  } else if (day !== "Fri" && endDate.getHours() >= 18) {
    // Other days: any slot that would end at or after 6:00 PM should cap at 6:00 PM
    endDate.setHours(18, 0);
  }

  const startFormatted = formatTimeTo12Hour(startTime);
  const endFormatted = formatTimeTo12Hour(
    `${String(endDate.getHours()).padStart(2, "0")}:${String(endDate.getMinutes()).padStart(2, "0")}`
  );

  return `${startFormatted} - ${endFormatted}`;
}

interface CellType {
  label: string;
  color: string;
}

interface Student {
  id: string;
  name: string;
  color: string;
  location: string;
}

interface Props {
  days: Day[];
  students: Student[];
  selectedStudents: string[];
  availability: Record<string, Record<Day, (StudentStatus | null)[]>>;
  cellTypes: Record<string, CellType>;
}

const StudentSchedulesCalendar = memo(function StudentSchedulesCalendar({
  days,
  students,
  selectedStudents,
  availability,
  cellTypes,
}: Props) {
  // Memoize expensive calculations (before any early returns)
  const displayStudents = useMemo(() => {
    return selectedStudents
      .map((sid) => students.find((s) => s.id === sid))
      .filter(Boolean)
      .map((s) => s!); // Remove location filter since data is pre-filtered
  }, [selectedStudents, students]);

  const allBlocks = useMemo(() => {
    const renderedBlocks = new Set<string>();
    const blocks: Array<{
      day: Day;
      slotIdx: number;
      studentId: string;
      student: (typeof displayStudents)[0];
      status: StudentStatus;
      startIdx: number;
      endIdx: number;
    }> = [];

    // Iterate through ALL time slots (not just hourly)
    days.forEach((day) => {
      displayStudents.forEach((student) => {
        const studentAvailability = (
          availability as Record<string, Record<Day, StudentStatus[]>>
        )[student.id];

        if (!studentAvailability || !studentAvailability[day]) return;

        const dayData = studentAvailability[day];

        // Go through each slot and detect block starts
        for (let slotIdx = 0; slotIdx < dayData.length; slotIdx++) {
          const blockKey = `${student.id}-${day}-${slotIdx}`;

          if (renderedBlocks.has(blockKey)) continue;

          const status = dayData[slotIdx];

          if (!status) continue;

          // Check if this is the start of a block
          const isPrevDifferent =
            slotIdx === 0 || dayData[slotIdx - 1] !== status;

          if (!isPrevDifferent) continue;

          // Calculate block end - count consecutive matching statuses
          let endIdx = slotIdx;
          while (
            endIdx + 1 < dayData.length &&
            dayData[endIdx + 1] === status
          ) {
            endIdx += 1;
          }

          blocks.push({
            day,
            slotIdx,
            studentId: student.id,
            student,
            status,
            startIdx: slotIdx,
            endIdx,
          });

          // Mark all slots in this block as rendered
          for (let i = slotIdx; i <= endIdx; i++) {
            renderedBlocks.add(`${student.id}-${day}-${i}`);
          }
        }
      });
    });

    return blocks;
  }, [days, displayStudents, availability]);

  // Memoize student columns mapping
  const studentColumns = useMemo(() => {
    const columns = new Map<string, number>();
    displayStudents.forEach((student, index) => {
      columns.set(student.id, index);
    });
    return columns;
  }, [displayStudents]);

  if (displayStudents.length === 0) {
    return (
      <div className="empty-state">Select students to view their schedules</div>
    );
  }

  return (
    <div className="calendar-container">
      {/* Calendar Header with Days */}
      <div className="calendar-header">
        <div className="time-col-header"></div>
        {days.map((day) => (
          <div key={day} className="day-col-header">
            <div className="day-name">{day}</div>
          </div>
        ))}
      </div>

      {/* Calendar Body */}
      <div className="calendar-body">
        {/* Use all possible time slots including extended ones */}
        {/* Render time rows but exclude the closing hour rows (17:00 for Fri, 18:00 for others) */}
        {[
          "08:00",
          "08:30",
          "09:00",
          "09:30",
          "10:00",
          "10:30",
          "11:00",
          "11:30",
          "12:00",
          "12:30",
          "13:00",
          "13:30",
          "14:00",
          "14:30",
          "15:00",
          "15:30",
          "16:00",
          "16:30",
          "17:00",
          "17:30",
        ].map((time, idx) => (
          <div key={`${time}-${idx}`} className="calendar-time-row">
            <div className="time-label">{formatTimeTo12Hour(time)}</div>

            {days.map((day) => {
              const allTimes = [
                "08:00",
                "08:30",
                "09:00",
                "09:30",
                "10:00",
                "10:30",
                "11:00",
                "11:30",
                "12:00",
                "12:30",
                "13:00",
                "13:30",
                "14:00",
                "14:30",
                "15:00",
                "15:30",
                "16:00",
                "16:30",
                "17:00",
                "17:30",
                "18:00",
              ];

              // Check if this time slot should be displayed for this day
              // Friday: show up to 16:30 (last selectable), Others: show up to 17:30 (last selectable)
              // Blocks can still extend into the closing hours for tooltips but rows aren't shown
              const maxTimeForDay = day === "Fri" ? "16:30" : "17:30";
              const maxIdx = allTimes.indexOf(maxTimeForDay);

              if (idx > maxIdx) {
                return (
                  <div
                    key={day}
                    className="calendar-day-cell day-cell-empty"
                  ></div>
                );
              }

              // Only render blocks that START at this index
              const blocksThatStartNow = allBlocks.filter(
                (b) => b.day === day && b.slotIdx === idx
              );

              const totalColumns = displayStudents.length;

              return (
                <div
                  key={day}
                  className="calendar-day-cell"
                  data-time={time}
                  data-day={day}
                >
                  {blocksThatStartNow.map(
                    ({ studentId, student, status, endIdx, startIdx }) => {
                      const allTimes = [
                        "08:00",
                        "08:30",
                        "09:00",
                        "09:30",
                        "10:00",
                        "10:30",
                        "11:00",
                        "11:30",
                        "12:00",
                        "12:30",
                        "13:00",
                        "13:30",
                        "14:00",
                        "14:30",
                        "15:00",
                        "15:30",
                        "16:00",
                        "16:30",
                        "17:00",
                        "17:30",
                        "18:00",
                      ];

                      // Calculate the maximum visible index for this day
                      const maxVisibleTime = day === "Fri" ? "16:30" : "17:30";
                      const maxVisibleIdx = allTimes.indexOf(maxVisibleTime);

                      // Constrain the block to not extend beyond visible area
                      const constrainedEndIdx = Math.min(endIdx, maxVisibleIdx);
                      const numSlots = constrainedEndIdx - startIdx + 1;
                      const blockHeight = numSlots * 40;

                      const statusColor = cellTypes[status]?.color || "#e2e8f0";
                      const timeRange = getTimeRangeForBlock(
                        day,
                        startIdx,
                        endIdx // Keep original end time for tooltip
                      );

                      // Get the fixed column index for this student
                      const columnIndex = studentColumns.get(studentId) || 0;
                      const columnWidth =
                        totalColumns > 0 ? 100 / totalColumns : 100;
                      const leftPosition = columnIndex * columnWidth;

                      return (
                        <div
                          key={studentId}
                          className="schedule-event"
                          title={`${student.name}\n${cellTypes[status]?.label}\n${timeRange}`}
                          data-tooltip={`${student.name}\n${cellTypes[status]?.label}\n${timeRange}`}
                          style={{
                            height: `${blockHeight}px`,
                            minHeight: `${blockHeight}px`,
                            maxHeight: `${blockHeight}px`,
                            width: `${columnWidth}%`,
                            left: `${leftPosition}%`,
                            top: `0px`,
                            background: statusColor,
                            borderLeftColor: student.color,
                            zIndex: 10,
                          }}
                          data-debug={`${day}-${time}-${student.name}-h${blockHeight}`}
                        >
                          <div className="event-content">
                            <div className="event-name">{student.name}</div>
                            <div className="event-status">
                              {cellTypes[status]?.label}
                              {constrainedEndIdx < endIdx
                                ? " (continues...)"
                                : ` (${numSlots} slots)`}
                            </div>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
});

export default StudentSchedulesCalendar;
