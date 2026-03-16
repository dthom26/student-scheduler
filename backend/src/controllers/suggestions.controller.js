import Submission from "../models/submission.model.js";
import ScheduleRules from "../models/rules.model.js";
import { generateSuggestion } from "../services/suggestion.service.js";

const DEFAULT_RULES = {
  blockDuringClass: true,
  bufferBeforeClass: 15,
  bufferAfterClass: 0,
  maxHoursPerWeek: 20,
  minShiftLength: 1,
  preferPreferredSlots: true,
  customNotes: "",
};

export const generateScheduleSuggestion = async (req, res, next) => {
  try {
    const { location } = req.body;

    if (!location || typeof location !== "string" || !location.trim()) {
      return res.status(400).json({ message: "location is required." });
    }

    const [submissions, rulesDoc] = await Promise.all([
      Submission.find({ location: location.trim() }).select(
        "studentName studentId notes schedule"
      ),
      ScheduleRules.findOne({}),
    ]);

    if (submissions.length === 0) {
      return res
        .status(404)
        .json({ message: "No submissions found for this location." });
    }

    const rules = rulesDoc ?? DEFAULT_RULES;
    const assignments = await generateSuggestion(submissions, rules);

    res.json({ assignments });
  } catch (error) {
    next(error);
  }
};
