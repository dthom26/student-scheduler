import { useState, useEffect } from "react";
import "./weekgrid.css";
import WeekStudentInfo from "./components/WeekStudentInfo";
import ModePicker from "./components/ModePicker";
import TimeGrid from "./components/TimeGrid";
import DayPicker from "./components/DayPicker";
import SingleDayGrid from "./components/SingleDayGrid";
import { createSubmission } from "../../services/scheduleService";
import { submissionRepository } from "../../repositories/SubmissionRepository";
import { ERROR_MESSAGES } from "../../constants/errors";
import { useAuth } from "../../context/AuthContext";

type CellType = keyof typeof cellTypes | null;
type Day = "Mon" | "Tue" | "Wed" | "Thu" | "Fri";
type Grid = Record<Day, CellType[]>;

const days: Day[] = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const times = [
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

// Friday ends at 17:00, other days end at 18:00
const getTimesForDay = (day: Day): string[] =>
  day === "Fri"
    ? times.slice(0, times.indexOf("17:00"))
    : times.slice(0, times.indexOf("18:00"));

const cellTypes = {
  available: { label: "Available", color: "#a5d6a7" },
  notAvailable: { label: "Not Available", color: "#cccccc" },
  class: { label: "Class", color: "#90caf9" },
  preferred: { label: "Preferred Shift", color: "#ffd54f" },
} as const;

// Helper function to create a fresh empty grid
const createEmptyGrid = (): Grid => {
  return days.reduce((acc, day) => {
    acc[day] = getTimesForDay(day).map(() => null);
    return acc;
  }, {} as Grid);
};

export default function WeekGridWireframe() {
  const { studentData } = useAuth();
  
  console.log('🏗️ WeekGridWireframe RENDER with studentData:', studentData?.studentId);
  
  const [grid, setGrid] = useState<Grid>(createEmptyGrid);
  const [mode, setMode] = useState<keyof typeof cellTypes>("available");
  const [studentId, setStudentId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [location, setLocation] = useState("");
  const [selectedDay, setSelectedDay] = useState<Day>("Mon");
  const [notes, setNotes] = useState(""); // Add state for notes
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartCell, setDragStartCell] = useState<{
    day: Day;
    idx: number;
  } | null>(null);
  const [dragEnd, setDragEnd] = useState<{ day: Day; idx: number } | null>(
    null
  );
  const [dragTimer, setDragTimer] = useState<number | null>(null);
  const [isAdjustingRange, setIsAdjustingRange] = useState(false);
  const [adjustingRangeAnchor, setAdjustingRangeAnchor] = useState<{
    day: Day;
    idx: number;
  } | null>(null);
  const [isUpdate, setIsUpdate] = useState(false);
  const [isLoading] = useState(false);
  const [hasExistingSubmission, setHasExistingSubmission] = useState(false);

  // Initialize with authenticated student data
  useEffect(() => {
    console.log('🔍 WeekGridWireframe useEffect fired:', { 
      studentData, 
      hasStudentData: !!studentData,
      studentId: studentData?.studentId,
      hasExistingSubmission: !!studentData?.existingSubmission 
    });
    
    if (studentData) {
      setStudentId(studentData.studentId);
      setStudentName(studentData.studentName);
      setLocation(studentData.location);
      setIsUpdate(studentData.isReturning);
      setHasExistingSubmission(studentData.isReturning);

      if (studentData.existingSubmission) {
        setNotes(studentData.existingSubmission.notes || "");

        // Convert the schedule back to grid format
        const newGrid: Grid = createEmptyGrid();
        studentData.existingSubmission.schedule.forEach(
          (slot: { day: Day; time: string; type: string }) => {
            const dayTimes = getTimesForDay(slot.day);
            const timeIndex = dayTimes.indexOf(slot.time);
            if (timeIndex !== -1) {
              newGrid[slot.day][timeIndex] =
                slot.type as keyof typeof cellTypes;
            }
          }
        );
        setGrid(newGrid);
      } else {
        // New student - clear grid and notes
        setGrid(createEmptyGrid());
        setNotes("");
      }
    } else {
      // No student data - clear all state (when logged out or switching students)
      setStudentId("");
      setStudentName("");
      setLocation("");
      setGrid(createEmptyGrid());
      setNotes("");
      setIsUpdate(false);
      setHasExistingSubmission(false);
    }
  }, [studentData]);
  
  // Track mount/unmount
  useEffect(() => {
    console.log('✅ WeekGridWireframe MOUNTED for student:', studentData?.studentId);
    return () => {
      console.log('❌ WeekGridWireframe UNMOUNTING for student:', studentData?.studentId);
    };
  }, []);

  const handleDragStart = (day: Day, idx: number) => {
    // Clear any existing timer
    if (dragTimer) {
      clearTimeout(dragTimer);
    }

    // Check if we're clicking on a range boundary for adjustment
    const boundary = findRangeBoundary(day, idx);

    if (boundary && (boundary.isStart || boundary.isEnd)) {
      // Potential range adjustment, but use a timer to allow normal clicks
      setDragStartCell({ day, idx });

      const timer = setTimeout(() => {
        // Start range adjustment mode after delay
        setIsAdjustingRange(true);

        // Set the anchor point (the opposite end of the range)
        if (boundary.isStart) {
          setAdjustingRangeAnchor({ day, idx: boundary.rangeEnd! });
        } else {
          setAdjustingRangeAnchor({ day, idx: boundary.rangeStart! });
        }

        // Start adjusting
        setIsDragging(true);
        setDragEnd({ day, idx });
      }, 150); // Same delay as normal drag

      setDragTimer(timer);
    } else {
      // Normal drag mode
      setIsAdjustingRange(false);
      setAdjustingRangeAnchor(null);
      setDragStartCell({ day, idx });

      // Start drag after a short delay to distinguish from clicks
      const timer = setTimeout(() => {
        setIsDragging(true);
        setDragEnd({ day, idx });
      }, 150); // 150ms delay

      setDragTimer(timer);
    }
  };
  const handleDragMove = (day: Day, idx: number) => {
    if (dragStartCell && !isDragging) {
      // If we have a drag start but aren't dragging yet, and we moved to a different cell,
      // immediately start dragging (user is clearly dragging, not clicking)
      if (dragStartCell.day !== day || dragStartCell.idx !== idx) {
        if (dragTimer) {
          clearTimeout(dragTimer);
          setDragTimer(null);
        }
        setIsDragging(true);
        setDragEnd({ day, idx });
      }
    } else if (isDragging) {
      setDragEnd({ day, idx });
    }
  };
  const handleDragEnd = () => {
    // Clear timer if it's still running
    if (dragTimer) {
      clearTimeout(dragTimer);
      setDragTimer(null);
    }

    if (isDragging && dragStartCell && dragEnd) {
      // This was a drag operation
      const { day: startDay, idx: startIdx } = dragStartCell;
      const { day: endDay, idx: endIdx } = dragEnd;

      // Check if it's the same day
      if (startDay === endDay) {
        if (isAdjustingRange && adjustingRangeAnchor) {
          // Range adjustment mode: use anchor as one end, current position as other end
          const anchorIdx = adjustingRangeAnchor.idx;
          const newIndices = getRange(anchorIdx, endIdx);

          // Clear only the original range, not all cells of the same type
          const originalBoundary = findRangeBoundary(startDay, startIdx);
          if (originalBoundary) {
            const oldIndices = getRange(
              originalBoundary.rangeStart!,
              originalBoundary.rangeEnd!
            );

            // First clear the old range
            setGrid((prev) => ({
              ...prev,
              [startDay]: prev[startDay].map((val, i) =>
                oldIndices.includes(i) ? null : val
              ),
            }));

            // Then apply new range
            setTimeout(() => {
              setGrid((prev) => ({
                ...prev,
                [startDay]: prev[startDay].map((val, i) =>
                  newIndices.includes(i) ? mode : val
                ),
              }));
            }, 0);
          }
        } else {
          // Normal drag mode
          const indices = getRange(startIdx, endIdx);
          setGrid((prev) => ({
            ...prev,
            [startDay]: prev[startDay].map((val, i) =>
              indices.includes(i) ? mode : val
            ),
          }));
        }
      }
    } else if (dragStartCell && !isDragging) {
      // This was a click operation (timer didn't fire or range adjustment was started but not completed)
      const { day, idx } = dragStartCell;

      // Check if this was a click on a boundary that might have started range adjustment
      const boundary = findRangeBoundary(day, idx);

      // If it's a boundary but we haven't completed adjusting, treat as normal click
      if (boundary && !isAdjustingRange) {
        // This was a quick click on a boundary - just toggle the cell
        handleCellClick(day, idx);
      } else if (!boundary || !isAdjustingRange) {
        // Normal click on empty cell or middle of range, or adjustment wasn't completed
        handleCellClick(day, idx);
      }
      // If isAdjustingRange is true and we have a boundary, we don't do anything for quick clicks
    }

    // Reset all drag state
    setIsDragging(false);
    setDragStartCell(null);
    setDragEnd(null);
    setIsAdjustingRange(false);
    setAdjustingRangeAnchor(null);
  };

  function getRange(startIdx: number, endIdx: number): number[] {
    const [min, max] = [Math.min(startIdx, endIdx), Math.max(startIdx, endIdx)];
    return Array.from({ length: max - min + 1 }, (_, i) => min + i);
  }

  // Find if a cell is at the boundary of an existing range
  const findRangeBoundary = (
    day: Day,
    idx: number
  ): {
    isStart: boolean;
    isEnd: boolean;
    rangeStart?: number;
    rangeEnd?: number;
  } | null => {
    const dayGrid = grid[day];
    const cellType = dayGrid[idx];

    if (!cellType) return null; // Empty cell, not part of a range

    // Find the start and end of the current range
    let rangeStart = idx;
    let rangeEnd = idx;

    // Find start of range (go backwards while same type)
    while (rangeStart > 0 && dayGrid[rangeStart - 1] === cellType) {
      rangeStart--;
    }

    // Find end of range (go forwards while same type)
    while (
      rangeEnd < dayGrid.length - 1 &&
      dayGrid[rangeEnd + 1] === cellType
    ) {
      rangeEnd++;
    }

    // Only return boundary info if it's actually a range (more than 1 cell)
    if (rangeStart === rangeEnd) return null;

    // Check if clicked cell is at boundary (only first or last cell, not middle)
    const isStart = idx === rangeStart;
    const isEnd = idx === rangeEnd;

    // Only return if it's actually at the boundary
    if (!isStart && !isEnd) return null;

    return { isStart, isEnd, rangeStart, rangeEnd };
  };

  // Check if a cell is in the current drag range for visual feedback
  const isInDragRange = (day: Day, idx: number): boolean => {
    if (!isDragging || !dragStartCell || !dragEnd) return false;

    const { day: startDay, idx: startIdx } = dragStartCell;
    const { day: endDay, idx: endIdx } = dragEnd;

    // Only highlight if same day
    if (day !== startDay || startDay !== endDay) return false;

    if (isAdjustingRange && adjustingRangeAnchor) {
      // Range adjustment mode: highlight between anchor and current drag position
      const anchorIdx = adjustingRangeAnchor.idx;
      const indices = getRange(anchorIdx, endIdx);
      return indices.includes(idx);
    } else {
      // Normal drag mode
      const indices = getRange(startIdx, endIdx);
      return indices.includes(idx);
    }
  };

  const handleCellClick = (day: Day, idx: number) => {
    setGrid((prev) => ({
      ...prev,
      [day]: prev[day].map((val, i) =>
        i === idx ? (val === null ? mode : null) : val
      ),
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
      let result;
      if (isUpdate) {
        result = await submissionRepository.updateSubmission(studentId, submission);
        console.log("Update successful:", result);
        alert("Schedule updated successfully!");
      } else {
        result = await submissionRepository.submitSchedule(submission);
        console.log("Submission successful:", result);
        alert("Schedule submitted successfully!");
      }

      // Don't reset the form after successful update, but do after new submission
      if (!isUpdate) {
        setGrid(initialGrid);
        setStudentId("");
        setStudentName("");
        setLocation("");
        setNotes("");
      } else {
        // After update, we now have a submission
        setHasExistingSubmission(true);
      }
    } catch (error) {
      console.error(ERROR_MESSAGES.SUBMIT_FAILED, error);

      // Check if it's a duplicate submission error
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (
        errorMessage.includes("already exists") ||
        errorMessage.includes("409")
      ) {
        alert(ERROR_MESSAGES.NO_EXISTING_SUBMISSION);
      } else {
        alert(ERROR_MESSAGES.SUBMIT_FAILED);
      }
    }
  };

  const canSubmit = studentId.trim() && studentName.trim() && location;

  return (
    <div className="weekgrid-root">
      <div className="weekgrid-left">
        <div
          style={{
            marginBottom: "20px",
            padding: "15px",
            backgroundColor: "#f5f5f5",
            borderRadius: "5px",
          }}
        >
          <h3>Student Information</h3>
          <p>
            <strong>Student ID:</strong> {studentId}
          </p>
          <p>
            <strong>Name:</strong> {studentName}
          </p>
          <p>
            <strong>Location:</strong> {location}
          </p>
          {hasExistingSubmission && (
            <p style={{ color: "#4caf50" }}>✓ Editing existing submission</p>
          )}
        </div>
        <ModePicker mode={mode} setMode={setMode} cellTypes={cellTypes} />
        <TimeGrid
          grid={grid}
          times={times}
          days={days}
          getTimesForDay={getTimesForDay}
          cellTypes={cellTypes}
          handleDragStart={handleDragStart}
          handleDragMove={handleDragMove}
          handleDragEnd={handleDragEnd}
          isDragging={isDragging}
          isInDragRange={isInDragRange}
          currentMode={mode}
        />
      </div>

      {/* Mobile-only controls (day picker, single-day grid, mode picker for 360px) */}
      <div className="mobile-controls">
        <div className="mobile-student-info">
          <WeekStudentInfo
            studentId={studentId}
            setStudentId={setStudentId}
            studentName={studentName}
            setStudentName={setStudentName}
            location={location}
            setLocation={setLocation}
          />
        </div>
        <div className="mobile-mode-picker">
          <ModePicker mode={mode} setMode={setMode} cellTypes={cellTypes} />
        </div>
        <DayPicker selectedDay={selectedDay} setSelectedDay={setSelectedDay} />
        <SingleDayGrid
          day={selectedDay}
          slots={grid[selectedDay]}
          times={getTimesForDay(selectedDay)}
          onSlotClick={handleSingleDaySlotClick}
          cellTypes={cellTypes}
        />
      </div>

      <div className="sidebar-right">
        <div>
          <button onClick={() => setGrid(createEmptyGrid())}>Clear</button>{" "}
          <button disabled={!canSubmit || isLoading} onClick={handleSubmit}>
            {isLoading
              ? "Loading..."
              : isUpdate
                ? "Update Schedule"
                : "Submit Schedule"}
          </button>
          {!canSubmit && (
            <div className="warning">
              Please enter your Student ID, Name, and select a Location to
              submit.
            </div>
          )}
          {hasExistingSubmission && !isLoading && (
            <div
              style={{ marginTop: "10px", color: "#4caf50", fontSize: "14px" }}
            >
              ✓ Found existing submission - you can update your schedule
            </div>
          )}
          {isLoading && (
            <div style={{ marginTop: "10px", color: "#666", fontSize: "14px" }}>
              Checking for existing submission...
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
