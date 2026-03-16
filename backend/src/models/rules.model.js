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
    minShiftLength: {
      type: Number,
      default: 1, // hours
      min: 0.5,
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
  },
  { timestamps: true }
);

export default mongoose.model("ScheduleRules", rulesSchema);
