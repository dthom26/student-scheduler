type CellType = "available" | "notAvailable" | "class" | "preferred" | null;
type Day = "Mon" | "Tue" | "Wed" | "Thu" | "Fri";

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
  day: Day;
  slots: CellType[];
  times: string[];
  onSlotClick: (idx: number) => void;
  cellTypes: Record<string, { label: string; color: string }>;
}

export default function SingleDayGrid({
  day,
  slots,
  times,
  onSlotClick,
  cellTypes,
}: Props) {
  return (
    <div className="single-day-grid">
      <h4 style={{ marginTop: 0, marginBottom: 12 }}>{day}'s Schedule</h4>
      <div className="single-day-slots">
        {times.map((time, idx) => {
          if (idx >= slots.length) return null;
          const cellType = slots[idx];
          const color = cellType
            ? cellTypes[cellType as keyof typeof cellTypes].color
            : "#eee";
          const label = cellType
            ? cellTypes[cellType as keyof typeof cellTypes].label
            : "Unset";
          const timeRange = getTimeRange(time);

          return (
            <div key={time} className="single-slot-row">
              <div className="slot-time">{time}</div>
              <button
                className="single-slot"
                onClick={() => onSlotClick(idx)}
                style={{ background: color }}
                title={`${label} - ${timeRange}`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
