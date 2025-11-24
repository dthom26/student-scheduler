type CellType = "available" | "notAvailable" | "class" | "preferred" | null;
type Day = "Mon" | "Tue" | "Wed" | "Thu" | "Fri";

interface Props {
  day: Day;
  slots: (CellType)[];
  times: string[];
  onSlotClick: (idx: number) => void;
  cellTypes: Record<string, { label: string; color: string }>;
}

export default function SingleDayGrid({ day, slots, times, onSlotClick, cellTypes }: Props) {
  return (
    <div className="single-day-grid">
      <h4 style={{ marginTop: 0, marginBottom: 12 }}>{day}'s Schedule</h4>
      <div className="single-day-slots">
        {times.map((time, idx) => {
          if (idx >= slots.length) return null;
          const cellType = slots[idx];
          const color = cellType ? cellTypes[cellType as keyof typeof cellTypes].color : "#eee";
          const label = cellType ? cellTypes[cellType as keyof typeof cellTypes].label : "Unset";
          
          return (
            <div key={time} className="single-slot-row">
              <div className="slot-time">{time}</div>
              <button
                className="single-slot"
                onClick={() => onSlotClick(idx)}
                style={{ background: color }}
                title={label}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
