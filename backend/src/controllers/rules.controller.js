import ScheduleRules from "../models/rules.model.js";

// Hardcoded defaults — returned when no document exists in DB yet.
// Must mirror the model schema defaults.
const DEFAULT_RULES = {
  blockDuringClass: true,
  bufferBeforeClass: 15,
  bufferAfterClass: 0,
  maxHoursPerWeek: 20,
  minShiftLength: 1,
  preferPreferredSlots: true,
  customNotes: "",
};

export const getRules = async (req, res, next) => {
  try {
    const rules = await ScheduleRules.findOne({});
    res.status(200).json(rules ?? DEFAULT_RULES);
  } catch (error) {
    next(error);
  }
};

export const updateRules = async (req, res, next) => {
  try {
    const { blockDuringClass, bufferBeforeClass, bufferAfterClass,
            maxHoursPerWeek, minShiftLength, preferPreferredSlots, customNotes } = req.body;

    const rules = await ScheduleRules.findOneAndUpdate(
      {},
      { blockDuringClass, bufferBeforeClass, bufferAfterClass,
        maxHoursPerWeek, minShiftLength, preferPreferredSlots, customNotes },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json(rules);
  } catch (error) {
    next(error);
  }
};
