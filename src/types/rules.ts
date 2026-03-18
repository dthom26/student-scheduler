export interface ScheduleRules {
  blockDuringClass: boolean;
  bufferBeforeClass: number; // minutes
  bufferAfterClass: number; // minutes
  maxHoursPerWeek: number;
  minHoursPerWeek: number;
  maxDaysPerWeek: number;
  minShiftLength: number; // hours
  maxShiftLength: number; // hours, 0 = no limit
  preferClosingShifts: boolean;
  preferPreferredSlots: boolean;
  customNotes: string;
  allowOverlappingSchedules: boolean;
  targetCoveragePerSlot: number; // how many students per slot when overlap is on
}

export const DEFAULT_RULES: ScheduleRules = {
  blockDuringClass: true,
  bufferBeforeClass: 15,
  bufferAfterClass: 0,
  maxHoursPerWeek: 20,
  minHoursPerWeek: 0,
  maxDaysPerWeek: 5,
  minShiftLength: 1,
  maxShiftLength: 0,
  preferClosingShifts: false,
  preferPreferredSlots: true,
  customNotes: "",
  allowOverlappingSchedules: false,
  targetCoveragePerSlot: 2,
};
