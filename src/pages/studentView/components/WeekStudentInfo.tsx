interface Props {
  studentId: string;
  setStudentId: (v: string) => void;
  studentName: string;
  setStudentName: (v: string) => void;
  location: string;
  setLocation: (v: string) => void;
}

export default function WeekStudentInfo({ studentId, setStudentId, studentName, setStudentName, location, setLocation }: Props) {
  return (
    <div className="student-info">
      <strong>Student Info:</strong>
      <div className="form-row">
        <input className="input input-small" placeholder="Student ID" value={studentId} onChange={e => setStudentId(e.target.value)} />
        <input className="input input-medium" placeholder="Name" value={studentName} onChange={e => setStudentName(e.target.value)} />
      </div>
      <div className="form-row">
        <strong>Location:</strong>
        <select className="select select-wide" value={location} onChange={e => setLocation(e.target.value)}>
          <option value="">Select Location</option>
          <option value="hsl">Health Sciences Library (HSL)</option>
          <option value="med">Medical Library (MED)</option>
        </select>
      </div>
    </div>
  );
}
