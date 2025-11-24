type StudentStatus = "available" | "notAvailable" | "class" | "preferred";
type Day = "Mon" | "Tue" | "Wed" | "Thu" | "Fri";

import "./StudentSchedulesCalendar.css";

function formatTimeTo12Hour(time24: string): string {
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

function getTimeRangeForBlock(
  day: Day,
  startIdx: number,
  endIdx: number
): string {
  const dayTimes = getTimesForDay(day);
  const startTime = dayTimes[startIdx];
  const endTime = dayTimes[endIdx];
  
  // End time is 30 minutes after the end slot
  const [endHours, endMinutes] = endTime.split(':');
  const endDate = new Date();
  endDate.setHours(parseInt(endHours, 10), parseInt(endMinutes, 10));
  endDate.setMinutes(endDate.getMinutes() + 30);
  
  const startFormatted = formatTimeTo12Hour(startTime);
  const endFormatted = formatTimeTo12Hour(
    `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`
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
  location: string;
  availability: Record<string, Record<Day, (StudentStatus | null)[]>>;
  cellTypes: Record<string, CellType>;
}

function getTimesForDay(day: Day): string[] {
  // Full 30-minute increments for data mapping
  const times = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
    "16:00", "16:30", "17:00", "17:30", "18:00"
  ];
  return day === "Fri" ? times.slice(0, times.indexOf("17:00") + 1) : times;
}



export default function StudentSchedulesCalendar({
  days,
  students,
  selectedStudents,
  location,
  availability,
  cellTypes,
}: Props) {
  if (
    selectedStudents.filter((sid) => {
      const student = students.find((s) => s.id === sid);
      return student?.location === location;
    }).length === 0
  ) {
    return (
      <div className="empty-state">
        Select students to view their schedules
      </div>
    );
  }

  // Get list of students to display
  const displayStudents = selectedStudents
    .map((sid) => students.find((s) => s.id === sid))
    .filter(Boolean)
    .filter((s) => s!.location === location)
    .map((s) => s!);

  // Track which student blocks have been rendered to avoid duplicates
  // This must persist across ALL time rows
  const renderedBlocks = new Set<string>();

  // Pre-calculate all blocks that will be rendered
  const allBlocks: Array<{
    day: Day;
    slotIdx: number;
    studentId: string;
    student: typeof displayStudents[0];
    status: StudentStatus;
    startIdx: number;
    endIdx: number;
  }> = [];

  // Iterate through ALL time slots (not just hourly)
  days.forEach((day) => {
    displayStudents.forEach((student) => {
      const studentAvailability = (availability as Record<
        string,
        Record<Day, StudentStatus[]>
      >)[student.id];

      if (!studentAvailability || !studentAvailability[day]) return;

      const dayData = studentAvailability[day];

      // Go through each slot and detect block starts
      for (let slotIdx = 0; slotIdx < dayData.length; slotIdx++) {
        const blockKey = `${student.id}-${day}-${slotIdx}`;

        if (renderedBlocks.has(blockKey)) continue;

        const status = dayData[slotIdx];

        if (!status || status === "notAvailable") continue;

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

        allBlocks.push({
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

  // Debug logging (remove in production)
  if (import.meta.env.DEV) {
    console.log('All blocks detected:', allBlocks);
    console.log('Display students:', displayStudents);
    console.log('Availability:', availability);
  }

  // Assign each student a fixed column index
  const studentColumns = new Map<string, number>();
  displayStudents.forEach((student, index) => {
    studentColumns.set(student.id, index);
  });

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
        {getTimesForDay(days[0]).map((time, idx) => (
          <div key={`${time}-${idx}`} className="calendar-time-row">
            <div className="time-label">{formatTimeTo12Hour(time)}</div>

            {days.map((day) => {
              const dayTimes = getTimesForDay(day);

              // Skip if this time slot doesn't exist for this day
              if (idx >= dayTimes.length) {
                return (
                  <div key={day} className="calendar-day-cell day-cell-empty"></div>
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
                      // Calculate block height: each 30-min slot is 40px
                      const numSlots = endIdx - startIdx + 1;
                      const blockHeight = numSlots * 40;
                      const statusColor =
                        cellTypes[status]?.color || "#e2e8f0";
                      const timeRange = getTimeRangeForBlock(day, startIdx, endIdx);

                      // Get the fixed column index for this student
                      const columnIndex = studentColumns.get(studentId) || 0;
                      const columnWidth = totalColumns > 0 ? 100 / totalColumns : 100;
                      const leftPosition = columnIndex * columnWidth;

                      // Debug logging (remove in production)
                      if (import.meta.env.DEV) {
                        console.log(`Rendering block: ${day} ${time}, student ${student.name}, col ${columnIndex+1}/${totalColumns}, status ${status}, height ${blockHeight}px`);
                      }

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
                              {cellTypes[status]?.label} ({numSlots} slots)
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
}
