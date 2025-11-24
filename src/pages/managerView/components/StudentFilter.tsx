interface Student {
  id: string;
  name: string;
  color: string;
  location: string;
}

interface Props {
  location: string;
  selectedStudents: string[];
  onStudentToggle: (id: string) => void;
  students: Student[];
}

export default function StudentFilter({
  location,
  selectedStudents,
  onStudentToggle,
  students,
}: Props) {
  return (
    <aside className="manager-sidebar">
      <h3>Students</h3>
      <ul className="student-list">
        {students.filter((s) => s.location === location).map((s) => (
          <li key={s.id} className="student-item">
            <label className="student-label">
              <input
                type="checkbox"
                checked={selectedStudents.includes(s.id)}
                onChange={() => onStudentToggle(s.id)}
              />{" "}
              {s.name} ({s.id})
            </label>
          </li>
        ))}
      </ul>
    </aside>
  );
}
