import { useState } from "react";

interface Student {
  id: string;
  name: string;
  color: string;
  location: string;
  notes?: string;
}

interface CellType {
  label: string;
  color: string;
}

interface Props {
  location: string;
  selectedStudents: string[];
  onStudentToggle: (id: string) => void;
  students: Student[];
  cellTypes: Record<string, CellType>;
  onTypeFilterChange?: (selectedTypes: string[]) => void;
}

export default function StudentFilter({
  location,
  selectedStudents,
  onStudentToggle,
  students,
  cellTypes,
  onTypeFilterChange,
}: Props) {
  console.log(students);
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(
    new Set()
  );
  const [selectedTypes, setSelectedTypes] = useState<string[]>(
    Object.keys(cellTypes)
  );

  const toggleExpansion = (studentId: string) => {
    setExpandedStudents((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  };

  const handleTypeToggle = (typeKey: string) => {
    setSelectedTypes((prev) => {
      const newTypes = prev.includes(typeKey)
        ? prev.filter((t) => t !== typeKey)
        : [...prev, typeKey];
      onTypeFilterChange?.(newTypes);
      return newTypes;
    });
  };
  return (
    <aside className="manager-sidebar">
      <h3>Students</h3>
      <ul className="student-list">
        {students
          .filter((s) => s.location === location)
          .map((s) => (
            <li key={s.id} className="student-item">
              <div className="student-header">
                <label className="student-label">
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(s.id)}
                    onChange={() => onStudentToggle(s.id)}
                  />{" "}
                  {s.name} ({s.id})
                </label>
                {s.notes && (
                  <button
                    onClick={() => toggleExpansion(s.id)}
                    aria-expanded={expandedStudents.has(s.id)}
                    className="expand-toggle"
                  >
                    {expandedStudents.has(s.id) ? "▼" : "▶"}
                  </button>
                )}
              </div>
              {expandedStudents.has(s.id) && s.notes && (
                <div className="student-notes">
                  <p>{s.notes}</p>
                </div>
              )}
            </li>
          ))}
      </ul>

      <div className="legend-section">
        <h4>Schedule Legend</h4>
        <div className="legend-items">
          {Object.entries(cellTypes).map(([key, type]) => (
            <div key={key} className="legend-item">
              <input
                type="checkbox"
                id={`type-filter-${key}`}
                checked={selectedTypes.includes(key)}
                onChange={() => handleTypeToggle(key)}
              />
              <div
                className="legend-color"
                style={{ backgroundColor: type.color }}
              ></div>
              <span className="legend-label">{type.label}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
