type Day = "Mon" | "Tue" | "Wed" | "Thu" | "Fri";
type StudentStatus = "available" | "notAvailable" | "class" | "preferred";

interface Props {
  grid: Record<Day, (StudentStatus | null)[]>;
  handleCellClick: (day: Day, idx: number) => void;
  times: string[];
  days: Day[];
  getTimesForDay: (d: Day) => string[];
  cellTypes: Record<string, { label: string; color: string }>;
}

export default function TimeGrid({ grid, handleCellClick, times, days, getTimesForDay, cellTypes }: Props) {
  return (
    <>
      <div className="weekgrid-times-row">
        <div className="time-col"></div>
        {days.map(day => <div key={day} className="day-header">{day}</div>)}
      </div>
      {times.map((time, rowIdx) => (
        <div key={time} className="time-row">
          <div className="time-col">{time}</div>
          {days.map(day => {
            const dayTimes = getTimesForDay(day);
            if (rowIdx >= dayTimes.length) return <div key={day} className="empty-slot" />;
            const cellType = grid[day][rowIdx];
            const color = cellType ? cellTypes[cellType as keyof typeof cellTypes].color : "#eee";
            return (
              <div
                key={day}
                className="slot"
                onClick={() => handleCellClick(day, rowIdx)}
                title={`Set ${cellType ? cellTypes[cellType as keyof typeof cellTypes].label : "Unset"} for ${day} ${time}`}
                style={{ background: color }}
              />
            );
          })}
        </div>
      ))}
    </>
  );
}
