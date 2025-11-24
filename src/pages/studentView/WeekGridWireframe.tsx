import { useState } from "react";
import "./weekgrid.css";
import WeekStudentInfo from "./components/WeekStudentInfo";
import ModePicker from "./components/ModePicker";
import TimeGrid from "./components/TimeGrid";
import DayPicker from "./components/DayPicker";
import SingleDayGrid from "./components/SingleDayGrid";
import { gridToScheduleSlots, createSubmission } from "../../services/scheduleService";
import { submitSchedule } from "../../services/api";

type CellType = keyof typeof cellTypes | null;
type Day = "Mon" | "Tue" | "Wed" | "Thu" | "Fri";
type Grid = Record<Day, CellType[]>;

const days: Day[] = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const times = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00"
];

// Friday ends at 17:00
const getTimesForDay = (day: Day): string[] =>
  day === "Fri" ? times.slice(0, times.indexOf("17:00") + 1) : times;

const cellTypes = {
  available: { label: "Available", color: "#a5d6a7" },
  notAvailable: { label: "Not Available", color: "#cccccc" },
  class: { label: "Class", color: "#90caf9" },
  preferred: { label: "Preferred Shift", color: "#ffd54f" },
} as const;

const initialGrid: Grid = days.reduce((acc, day) => {
  acc[day] = getTimesForDay(day).map(() => null);
  return acc;
}, {} as Grid);

export default function WeekGridWireframe() {
  const [grid, setGrid] = useState<Grid>(initialGrid);
  const [mode, setMode] = useState<keyof typeof cellTypes>("available");
  const [studentId, setStudentId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [location, setLocation] = useState("");
  const [selectedDay, setSelectedDay] = useState<Day>("Mon");
  const [notes, setNotes] = useState(""); // Add state for notes

  const handleCellClick = (day: Day, idx: number) => {
    setGrid((prev) => ({
      ...prev,
      [day]: prev[day].map((val, i) => (i === idx ? (val === null ? mode : null) : val)),
    }));
  };

  const handleSingleDaySlotClick = (idx: number) => {
    handleCellClick(selectedDay, idx);
  };

  const handleSubmit = async () => {
    // Create the submission object
    const submission = createSubmission(
      grid,
      studentId,
      studentName,
      location,
      notes,
      cellTypes
    );
    try {
      // Mock backend submission (replace with real API call)
      const result = await submitSchedule(submission);
      console.log("Submission successful:", result);
      // Reset the form after successful submission
      setGrid(initialGrid);
      setStudentId("");
      setStudentName("");
      setLocation("");
      setNotes("");
      alert("Submission successful!");
    } catch (error) {
      console.error("Submission failed:", error);
      alert("Failed to submit. Please try again.");
    }
  };

  const canSubmit = studentId.trim() && studentName.trim() && location;

  return (
    <div className="weekgrid-root">
      <div className="weekgrid-left">
          <WeekStudentInfo studentId={studentId} setStudentId={setStudentId} studentName={studentName} setStudentName={setStudentName} location={location} setLocation={setLocation} />
          <ModePicker mode={mode} setMode={setMode} cellTypes={cellTypes} />
          <TimeGrid grid={grid} handleCellClick={handleCellClick} times={times} days={days} getTimesForDay={getTimesForDay} cellTypes={cellTypes} />
      </div>

      {/* Mobile-only controls (day picker, single-day grid, mode picker for 360px) */}
      <div className="mobile-controls">
        <div className="mobile-student-info">
          <WeekStudentInfo studentId={studentId} setStudentId={setStudentId} studentName={studentName} setStudentName={setStudentName} location={location} setLocation={setLocation} />
        </div>
        <div className="mobile-mode-picker">
          <ModePicker mode={mode} setMode={setMode} cellTypes={cellTypes} />
        </div>
        <DayPicker selectedDay={selectedDay} setSelectedDay={setSelectedDay} />
        <SingleDayGrid day={selectedDay} slots={grid[selectedDay]} times={getTimesForDay(selectedDay)} onSlotClick={handleSingleDaySlotClick} cellTypes={cellTypes} />
      </div>

      <div className="sidebar-right">
        <div>
          <button onClick={() => setGrid(initialGrid)}>Clear</button> <button disabled={!canSubmit} onClick={handleSubmit}>Submit</button>
          {!canSubmit && (
            <div className="warning">
              Please enter your Student ID, Name, and select a Location to submit.
            </div>
          )}
        </div>
        <div className="notes">
          <h3>Notes</h3>
          <textarea
            rows={4}
            placeholder="Add notes here..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          
        </div>
        
      </div>
    </div>
  );
}
