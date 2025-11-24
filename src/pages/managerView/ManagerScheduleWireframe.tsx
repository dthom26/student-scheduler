import { useState, useEffect } from "react";
import "./managerView.css";
import StudentFilter from "./components/StudentFilter";
import StudentSchedulesCalendar from "./components/StudentSchedulesCalendar";
import ScheduleBuilder from "./components/ScheduleBuilder";
import { fetchSubmissions } from "../../services/api";
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
  schedule: Array<{ day: Day; time: string; type: StudentStatus }>;
}

const days: Day[] = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const times = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00"
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
  const [selectedAssignmentStudent, setSelectedAssignmentStudent] = useState<string>("");
  const { token } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayedStudents, setDisplayedStudents] = useState<Student[]>([]);
  const [displayedAvailability, setDisplayedAvailability] = useState<Record<string, Record<Day, (StudentStatus | null)[]>>>({});

  const handleStudentToggle = (id: string) => {
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const handleCellAssign = (day: Day, timeIdx: number) => {
    const times_arr = [
      "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00"
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
      if(!token) {
        setError('No auth token available');
        return;
      }

      // Transform functions defined inside useEffect
      const transformSubmissionsToStudents = (submissions: Submission[]) => {
        return submissions.map((sub, idx) => ({
          id: sub.studentId,
          name: sub.studentName,
          color: `hsl(${idx * 60}, 70%, 60%)`,
          location: sub.location
        }));
      };

      const transformSubmissionsToAvailability = (submissions: Submission[]) => {
        const availability: Record<string, Record<Day, (StudentStatus | null)[]>> = {};
        const timeSlots = [
          "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00"
        ];

        submissions.forEach((sub) => {
          availability[sub.studentId] = {
            Mon: [],
            Tue: [],
            Wed: [],
            Thu: [],
            Fri: []
          };

          const daysList: Day[] = ["Mon", "Tue", "Wed", "Thu", "Fri"];
          daysList.forEach((day) => {
            const slotsForDay = day === "Fri" ? 17 : 21;
            const daySlots: (StudentStatus | null)[] = new Array(slotsForDay).fill(null);

            sub.schedule.forEach((slot: { day: Day; time: string; type: StudentStatus }) => {
              if (slot.day === day) {
                const timeIndex = timeSlots.indexOf(slot.time);
                if (timeIndex !== -1 && timeIndex < slotsForDay) {
                  daySlots[timeIndex] = slot.type;
                }
              }
            });

            availability[sub.studentId][day] = daySlots;
          });
        });

        return availability;
      };

      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchSubmissions(token);
        // Debug logging (remove in production)
        if (import.meta.env.DEV) {
          console.log('Raw data from backend:', data);
        }
        setSubmissions(data);

        const transformedStudents = transformSubmissionsToStudents(data);
        const transformedAvailability = transformSubmissionsToAvailability(data);

        // Debug logging (remove in production)
        if (import.meta.env.DEV) {
          console.log('Transformed students:', transformedStudents);
          console.log('Transformed availability:', transformedAvailability);
        }

        setDisplayedStudents(transformedStudents);
        setDisplayedAvailability(transformedAvailability);
        setSelectedStudents(transformedStudents.map((s: Student) => s.id));
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'An error occurred while fetching submissions';
        setError(errorMsg);
      } finally {
        setIsLoading(false);
      }
    };
    loadSubmissions();
  }, [token]);

  return (
    <div className="manager-root">
      {isLoading && <div style={{padding: '20px', textAlign: 'center'}}>Loading submissions...</div>}
      {error && <div style={{padding: '20px', color: 'red', textAlign: 'center'}}>Error: {error}</div>}
      {!isLoading && !error && submissions.length === 0 && <div style={{padding: '20px', textAlign: 'center'}}>No submissions available yet.</div>}
      
      {!isLoading && !error && submissions.length > 0 && (
      <>
      <header className="manager-header">
        <h2>Manager Schedule</h2>
        <div className="manager-header-controls">
          <label className="location-label">
            Location:
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="location-select"
            >
              <option value="hsl">HSL</option>
              <option value="med">Med</option>
            </select>
          </label>
        </div>
      </header>

      <div className="manager-content">
        <StudentFilter
          location={location}
          selectedStudents={selectedStudents}
          onStudentToggle={handleStudentToggle}
          students={displayedStudents}
        />

        <div className="manager-main">
          <section className="manager-section">
            <h3>Student Schedules</h3>
            <StudentSchedulesCalendar
              days={days}
              students={displayedStudents}
              selectedStudents={selectedStudents}
              location={location}
              availability={displayedAvailability}
              cellTypes={cellTypes}
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
