import mongoose from "mongoose";

const assignmentSlotSchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  studentId: {
    type: String,
    required: true,
  },
});

const draftSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Draft name is required"],
      trim: true,
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
      index: true,
    },
    assignments: [assignmentSlotSchema],
  },
  { timestamps: true }
);

// Efficient listing of drafts by location, ordered by most recently updated
draftSchema.index({ location: 1, createdAt: -1 });

export default mongoose.model("ScheduleDraft", draftSchema);
