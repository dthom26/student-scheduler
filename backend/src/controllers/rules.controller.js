import ScheduleRules from "../models/rules.model.js";

// Hardcoded defaults — returned when no document exists in DB yet.
// Must mirror the model schema defaults.
const DEFAULT_RULES = {
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

export const getRules = async (req, res, next) => {
  try {
    const rules = await ScheduleRules.findOne({});
    // Merge with DEFAULT_RULES so fields not yet physically stored in the DB document
    // (added after the document was first created) still return with their defaults.
    const payload = rules ? { ...DEFAULT_RULES, ...rules.toObject() } : DEFAULT_RULES;
    res.status(200).json(payload);
  } catch (error) {
    next(error);
  }
};

export const updateRules = async (req, res, next) => {
  try {
    const {
      blockDuringClass, bufferBeforeClass, bufferAfterClass,
      maxHoursPerWeek, minHoursPerWeek, maxDaysPerWeek,
      minShiftLength, maxShiftLength, preferClosingShifts,
      preferPreferredSlots, customNotes,
      allowOverlappingSchedules, targetCoveragePerSlot,
    } = req.body;

    // Explicit $set ensures Mongoose 8 always does a partial update (not a document
    // replacement), guaranteeing new fields are written into the existing document.
    const rules = await ScheduleRules.findOneAndUpdate(
      {},
      {
        $set: {
          blockDuringClass, bufferBeforeClass, bufferAfterClass,
          maxHoursPerWeek, minHoursPerWeek, maxDaysPerWeek,
          minShiftLength, maxShiftLength, preferClosingShifts,
          preferPreferredSlots, customNotes,
          allowOverlappingSchedules, targetCoveragePerSlot,
        },
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({ ...DEFAULT_RULES, ...rules.toObject() });
  } catch (error) {
    next(error);
  }
};
