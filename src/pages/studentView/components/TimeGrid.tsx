type Day = "Mon" | "Tue" | "Wed" | "Thu" | "Fri";
type StudentStatus = "available" | "notAvailable" | "class" | "preferred";

function formatTimeTo12Hour(time24: string): string {
  const [hours, minutes] = time24.split(":");
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

function getTimeRange(time: string): string {
  // End time is 30 minutes after the start time
  const [hours, minutes] = time.split(":");
  const endDate = new Date();
  endDate.setHours(parseInt(hours, 10), parseInt(minutes, 10));
  endDate.setMinutes(endDate.getMinutes() + 30);

  const startFormatted = formatTimeTo12Hour(time);
  const endFormatted = formatTimeTo12Hour(
    `${String(endDate.getHours()).padStart(2, "0")}:${String(endDate.getMinutes()).padStart(2, "0")}`
  );

  return `${startFormatted} - ${endFormatted}`;
}

interface Props {
  grid: Record<Day, (StudentStatus | null)[]>;
  times: string[];
  days: Day[];
  getTimesForDay: (d: Day) => string[];
  cellTypes: Record<string, { label: string; color: string }>;
  handleDragStart?: (day: Day, idx: number) => void;
  handleDragMove?: (day: Day, idx: number) => void;
  handleDragEnd?: () => void;
  isDragging?: boolean;
  isInDragRange?: (day: Day, idx: number) => boolean;
  currentMode?: string;
}

export default function TimeGrid({
  grid,
  times,
  days,
  getTimesForDay,
  cellTypes,
  handleDragStart,
  handleDragMove,
  handleDragEnd,
  isDragging,
  isInDragRange,
  currentMode,
}: Props) {
  return (
    <>
      <div className="weekgrid-times-row">
        <div className="time-col"></div>
        {days.map((day) => (
          <div key={day} className="day-header">
            {day}
          </div>
        ))}
      </div>
      {times.map((time, rowIdx) => (
        <div key={time} className="time-row">
          <div className="time-col">{time}</div>
          {days.map((day) => {
            const dayTimes = getTimesForDay(day);
            if (rowIdx >= dayTimes.length)
              return <div key={day} className="empty-slot" />;
            const cellType = grid[day][rowIdx];
            const color = cellType
              ? cellTypes[cellType as keyof typeof cellTypes].color
              : "#eee";

            // Determine visual state
            const inDragRange = isInDragRange?.(day, rowIdx) || false;
            const previewColor =
              inDragRange && currentMode && isDragging
                ? cellTypes[currentMode as keyof typeof cellTypes]?.color
                : color;
            return (
              <div
                key={day}
                className="slot"
                onMouseDown={(e) => {
                  e.preventDefault(); // Prevent text selection
                  handleDragStart?.(day, rowIdx);
                }}
                onMouseEnter={() => handleDragMove?.(day, rowIdx)}
                onMouseUp={handleDragEnd}
                title={`Set ${cellType ? cellTypes[cellType as keyof typeof cellTypes].label : "Unset"} for ${day} ${getTimeRange(time)}`}
                style={{
                  background: previewColor,
                }}
              />
            );
          })}
        </div>
      ))}
    </>
  );
}
