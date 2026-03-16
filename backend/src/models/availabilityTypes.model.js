import mongoose from "mongoose";

const availabilityTypeSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    color: {
      type: String,
      required: true,
      trim: true,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false } // subdocuments inside the types array
);

const availabilityTypesSchema = new mongoose.Schema(
  {
    types: [availabilityTypeSchema],
  },
  { timestamps: true }
);

export default mongoose.model("AvailabilityTypes", availabilityTypesSchema);
