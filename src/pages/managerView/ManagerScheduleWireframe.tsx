import { useState, useEffect, useMemo } from "react";
import "./managerView.css";
import StudentFilter from "./components/StudentFilter";
import StudentSchedulesCalendar from "./components/StudentSchedulesCalendar";
import ScheduleBuilder from "./components/ScheduleBuilder";
import { submissionRepository } from "../../repositories/SubmissionRepository";
import { ERROR_MESSAGES } from "../../constants/errors";
import { useAuth } from "../../context/AuthContext";

type StudentStatus = "available" | "notAvailable" | "class" | "preferred";
type Day = "Mon" | "Tue" | "Wed" | "Thu" | "Fri";

interface Student {
  id: string;
  name: string;
  color: string;
  location: string;
}

interface CellType {
  label: string;
  color: string;
}

interface Assignment {
  day: Day;
  time: string;
  studentId: string;
}

interface Submission {
  studentId: string;
  studentName: string;
  location: string;
  notes?: string;
  schedule: Array<{ day: Day; time: string; type: StudentStatus }>;
}

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

const cellTypes: Record<string, CellType> = {
  available: { label: "Available", color: "#a5d6a7" },
  notAvailable: { label: "Not Available", color: "#cccccc" },
  class: { label: "Class", color: "#90caf9" },
  preferred: { label: "Preferred Shift", color: "#ffd54f" },
};

export default function ManagerScheduleWireframe() {
  const [location, setLocation] = useState<string>("hsl");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignmentStudent, setSelectedAssignmentStudent] =
    useState<string>("");
  const { token } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [selectedAvailabilityTypes, setSelectedAvailabilityTypes] = useState<
    string[]
  >(Object.keys(cellTypes));

  const onTypeFilterChange = (selectedTypes: string[]) => {
    setSelectedAvailabilityTypes(selectedTypes);
  };

  const handleStudentToggle = (id: string) => {
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const handleCellAssign = (day: Day, timeIdx: number) => {
    const times_arr = [
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
    const slotTime = times_arr[timeIdx];
    const assignedIdx = assignments.findIndex(
      (a) => a.day === day && a.time === slotTime
    );
    if (assignedIdx !== -1) {
      setAssignments((prev) => prev.filter((_, i) => i !== assignedIdx));
      return;
    }
    if (!selectedAssignmentStudent) return;
    setAssignments((prev) => [
      ...prev,
      {
        studentId: selectedAssignmentStudent,
        day,
        time: slotTime,
      },
    ]);
  };

  useEffect(() => {
    const loadSubmissions = async () => {
      if (!token) {
        setError(ERROR_MESSAGES.NO_AUTH_TOKEN);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Load all submissions at once, not filtered by location
        // This prevents multiple API calls when switching locations
        const data = await submissionRepository.getAllSubmissions(token);
        setSubmissions(data);
        setDataLoaded(true);
      } catch (err) {
        const errorMsg =
          err instanceof Error
            ? err.message
            : ERROR_MESSAGES.FETCHING_SUBMISSIONS_ERROR;
        setError(errorMsg);
      } finally {
        setIsLoading(false);
      }
    };

    // Only load data once when component mounts or token changes
    if (token && !dataLoaded) {
      loadSubmissions();
    }
  }, [token, dataLoaded]);

  // Handle location changes without clearing all data
  const handleLocationChange = (newLocation: string) => {
    setLocation(newLocation);
    // Reset only UI state, not the data
    setSelectedStudents([]);
    setAssignments([]);
    setSelectedAssignmentStudent("");
  };

  // Memoize the transformation functions for better performance
  const displayedStudents = useMemo(() => {
    return submissions
      .filter((sub) => sub.location === location) // Filter by current location
      .map((sub, idx) => ({
        id: sub.studentId,
        name: sub.studentName,
        color: `hsl(${idx * 60}, 70%, 60%)`,
        location: sub.location,
        notes: sub.notes || "",
      }));
  }, [submissions, location]);

  const displayedAvailability = useMemo(() => {
    const availability: Record<
      string,
      Record<Day, (StudentStatus | null)[]>
    > = {};
    const timeSlots = [
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

    submissions
      .filter((sub) => sub.location === location) // Only process submissions for current location
      .forEach((sub) => {
        availability[sub.studentId] = {
          Mon: [],
          Tue: [],
          Wed: [],
          Thu: [],
          Fri: [],
        };

        const daysList: Day[] = ["Mon", "Tue", "Wed", "Thu", "Fri"];
        daysList.forEach((day) => {
          // Friday: slots 0-17 (up to 17:00 for extended slots), Others: slots 0-20 (up to 18:00 for extended slots)
          const slotsForDay = day === "Fri" ? 18 : 21;
          const daySlots: (StudentStatus | null)[] = new Array(
            slotsForDay
          ).fill(null);

          sub.schedule.forEach(
            (slot: { day: Day; time: string; type: StudentStatus }) => {
              if (slot.day === day) {
                const timeIndex = timeSlots.indexOf(slot.time);
                if (timeIndex !== -1 && timeIndex < slotsForDay) {
                  daySlots[timeIndex] = slot.type;
                }
              }
            }
          );

          availability[sub.studentId][day] = daySlots;
        });
      });

    return availability;
  }, [submissions, location]);

  // Update selected students when displayed students change
  useEffect(() => {
    setSelectedStudents(displayedStudents.map((s: Student) => s.id));
  }, [displayedStudents]);

  // Add refresh functionality
  const handleRefreshData = async () => {
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await submissionRepository.getAllSubmissions(token, true); // Force refresh
      setSubmissions(data);
    } catch (err) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : ERROR_MESSAGES.REFRESHING_DATA_ERROR;
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="manager-root">
      {isLoading && !dataLoaded && (
        <div style={{ padding: "20px", textAlign: "center" }}>
          <div>Loading submissions...</div>
          <div style={{ fontSize: "14px", marginTop: "10px", color: "#666" }}>
            This may take a moment on first load
          </div>
        </div>
      )}

      {error && (
        <div style={{ padding: "20px", color: "red", textAlign: "center" }}>
          Error: {error}
          <button
            onClick={handleRefreshData}
            style={{ marginLeft: "10px", padding: "5px 10px" }}
          >
            Retry
          </button>
        </div>
      )}

      {!isLoading && !error && submissions.length === 0 && dataLoaded && (
        <div style={{ padding: "20px", textAlign: "center" }}>
          No submissions available yet.
        </div>
      )}

      {(dataLoaded || (!isLoading && submissions.length > 0)) && !error && (
        <>
          <header className="manager-header">
            <div className="manager-header-controls">
              <label className="location-label">
                Location:
                <select
                  value={location}
                  onChange={(e) => handleLocationChange(e.target.value)}
                  className="location-select"
                >
                  <option value="hsl">HSL</option>
                  <option value="med">Med</option>
                </select>
              </label>
              <button
                onClick={handleRefreshData}
                disabled={isLoading}
                style={{
                  marginLeft: "15px",
                  padding: "5px 10px",
                  opacity: isLoading ? 0.5 : 1,
                }}
              >
                {isLoading ? "Refreshing..." : "Refresh Data"}
              </button>
            </div>
          </header>

          <div className="manager-content">
            <StudentFilter
              location={location}
              selectedStudents={selectedStudents}
              onStudentToggle={handleStudentToggle}
              students={displayedStudents}
              cellTypes={cellTypes}
              onTypeFilterChange={onTypeFilterChange}
            />

            <div className="manager-main">
              <section className="manager-section">
                <h3>Student Schedules</h3>
                <StudentSchedulesCalendar
                  days={days}
                  students={displayedStudents}
                  selectedStudents={selectedStudents}
                  availability={displayedAvailability}
                  cellTypes={cellTypes}
                  selectedTypes={selectedAvailabilityTypes}
                />
              </section>

              <section className="manager-section">
                <ScheduleBuilder
                  days={days}
                  times={times}
                  students={displayedStudents}
                  location={location}
                  assignments={assignments}
                  selectedAssignmentStudent={selectedAssignmentStudent}
                  onAssignmentStudentChange={setSelectedAssignmentStudent}
                  onCellAssign={handleCellAssign}
                />
              </section>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
