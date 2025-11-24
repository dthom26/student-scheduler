// services/scheduleService.ts
import type { ScheduleSlot, ScheduleSubmission } from "../types/submission";

type Day = "Mon" | "Tue" | "Wed" | "Thu" | "Fri";
type CellTypeKey = "available" | "notAvailable" | "class" | "preferred";
type Grid = Record<Day, (CellTypeKey | null)[]>;

export function gridToScheduleSlots(
  grid: Grid,
  _cellTypes: Record<string, { label: string; color: string }>
): ScheduleSlot[] {
  const slots: ScheduleSlot[] = [];
  const times = ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00"]; 
  
  Object.entries(grid).forEach(([day, cells]) => {
    cells.forEach((cellType, idx) => {
      if (cellType !== null) {
        slots.push({
          day: day as Day,
          time: times[idx],
          type: cellType as ScheduleSlot["type"],
        });
      }
    });
  });
  
  return slots;
}

export function createSubmission(
  grid: Grid,
  studentId: string,
  studentName: string,
  location: string,
  notes: string,
  cellTypes: Record<string, { label: string; color: string }>
): ScheduleSubmission {
  return {
    student: { id: studentId, name: studentName, location },
    schedule: gridToScheduleSlots(grid, cellTypes),
    notes,
    submittedAt: new Date().toISOString(),
  };
}