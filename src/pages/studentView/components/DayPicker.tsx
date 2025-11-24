type Day = "Mon" | "Tue" | "Wed" | "Thu" | "Fri";

interface Props {
  selectedDay: Day;
  setSelectedDay: (day: Day) => void;
}

export default function DayPicker({ selectedDay, setSelectedDay }: Props) {
  const days: Day[] = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  
  return (
    <div className="day-picker">
      <label>Select a day:</label>
      <div className="day-buttons">
        {days.map(day => (
          <button
            key={day}
            className={`day-button ${selectedDay === day ? 'active' : ''}`}
            onClick={() => setSelectedDay(day)}
          >
            {day}
          </button>
        ))}
      </div>
    </div>
  );
}
