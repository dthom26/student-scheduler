import mongoose from "mongoose";

const rulesSchema = new mongoose.Schema(
  {
    blockDuringClass: {
      type: Boolean,
      default: true,
    },
    bufferBeforeClass: {
      type: Number,
      default: 15, // minutes
      min: 0,
    },
    bufferAfterClass: {
      type: Number,
      default: 0, // minutes
      min: 0,
    },
    maxHoursPerWeek: {
      type: Number,
      default: 20,
      min: 1,
    },
    minHoursPerWeek: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxDaysPerWeek: {
      type: Number,
      default: 5,
      min: 1,
      max: 5,
    },
    minShiftLength: {
      type: Number,
      default: 1, // hours
      min: 0.5,
    },
    maxShiftLength: {
      type: Number,
      default: 0, // 0 = no limit
      min: 0,
    },
    preferClosingShifts: {
      type: Boolean,
      default: false,
    },
    preferPreferredSlots: {
      type: Boolean,
      default: true,
    },
    customNotes: {
      type: String,
      default: "",
      trim: true,
    },
    allowOverlappingSchedules: {
      type: Boolean,
      default: false,
    },
    targetCoveragePerSlot: {
      type: Number,
      default: 2,
      min: 1,
    },
  },
  { timestamps: true }
);

export default mongoose.model("ScheduleRules", rulesSchema);
