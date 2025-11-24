type Day = "Mon" | "Tue" | "Wed" | "Thu" | "Fri";

function formatTimeTo12Hour(time24: string): string {
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

interface Student {
  id: string;
  name: string;
  color: string;
  location: string;
}

interface Assignment {
  day: Day;
  time: string;
  studentId: string;
}

interface Props {
  days: Day[];
  times: string[];
  students: Student[];
  location: string;
  assignments: Assignment[];
  selectedAssignmentStudent: string;
  onAssignmentStudentChange: (studentId: string) => void;
  onCellAssign: (day: Day, timeIdx: number) => void;
}

function getTimesForDay(day: Day): string[] {
  const times = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
    "16:00", "16:30", "17:00", "17:30", "18:00"
  ];
  return day === "Fri" ? times.slice(0, times.indexOf("17:00") + 1) : times;
}

export default function ScheduleBuilder({
  days,
  times,
  students,
  location,
  assignments,
  selectedAssignmentStudent,
  onAssignmentStudentChange,
  onCellAssign,
}: Props) {
  return (
    <div className="schedule-builder">
      <h3>Assignment Grid</h3>
      <div className="assignment-selector">
        <label className="assignment-label">
          Assign student:
          <select
            className="assignment-select"
            value={selectedAssignmentStudent}
            onChange={(e) => onAssignmentStudentChange(e.target.value)}
          >
            <option value="" disabled>
              Select student
            </option>
            {students
              .filter((s) => s.location === location)
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
          </select>
        </label>
      </div>
      <div className="assignment-grid-header">
        <div className="assignment-time-header"></div>
        {days.map((day) => (
          <div key={day} className="assignment-day-header">
            {day}
          </div>
        ))}
      </div>
      {times.map((time, timeIdx) => (
        <div key={time} className="assignment-grid-row">
          <div className="assignment-time-cell">
            {formatTimeTo12Hour(time)}
          </div>
          {days.map((day) => {
            const dayTimes = getTimesForDay(day);
            if (timeIdx >= dayTimes.length)
              return <div key={day} className="assignment-cell empty"></div>;

            const assignment = assignments.find(
              (a) => a.day === day && a.time === time
            );
            const studentId = assignment ? assignment.studentId : null;
            const student = studentId
              ? students.find((s) => s.id === studentId)
              : null;
            const backgroundColor = student ? student.color : "#fff";
            const content = student ? student.name : null;

            return (
              <div
                key={day}
                onClick={() => onCellAssign(day, timeIdx)}
                className="assignment-cell"
                style={{ background: backgroundColor }}
              >
                {content}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
