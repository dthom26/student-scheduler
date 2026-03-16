export interface ScheduleRules {
  blockDuringClass: boolean;
  bufferBeforeClass: number; // minutes
  bufferAfterClass: number; // minutes
  maxHoursPerWeek: number;
  minShiftLength: number; // hours
  preferPreferredSlots: boolean;
  customNotes: string;
}

export const DEFAULT_RULES: ScheduleRules = {
  blockDuringClass: true,
  bufferBeforeClass: 15,
  bufferAfterClass: 0,
  maxHoursPerWeek: 20,
  minShiftLength: 1,
  preferPreferredSlots: true,
  customNotes: "",
};
