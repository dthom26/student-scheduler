import AvailabilityTypes from "../models/availabilityTypes.model.js";

// Hardcoded defaults — returned when no document exists in DB yet.
// Must mirror the original hardcoded cellTypes in the frontend.
export const DEFAULT_AVAILABILITY_TYPES = [
  { key: "available",    label: "Available",       color: "#a5d6a7", enabled: true, isDefault: true },
  { key: "notAvailable", label: "Not Available",   color: "#cccccc", enabled: true, isDefault: true },
  { key: "class",        label: "Class",           color: "#90caf9", enabled: true, isDefault: true },
  { key: "preferred",    label: "Preferred Shift", color: "#ffd54f", enabled: true, isDefault: true },
];

export const getAvailabilityTypes = async (req, res, next) => {
  try {
    const doc = await AvailabilityTypes.findOne({});
    res.status(200).json(doc ? doc.types : DEFAULT_AVAILABILITY_TYPES);
  } catch (error) {
    next(error);
  }
};

export const updateAvailabilityTypes = async (req, res, next) => {
  try {
    const { types } = req.body;

    if (!Array.isArray(types) || types.length === 0) {
      return res.status(400).json({ message: "types must be a non-empty array." });
    }

    // Validate each entry has required fields
    for (const t of types) {
      if (!t.key || typeof t.key !== "string" || !t.key.trim()) {
        return res.status(400).json({ message: "Each type must have a non-empty key." });
      }
      if (!t.label || typeof t.label !== "string" || !t.label.trim()) {
        return res.status(400).json({ message: "Each type must have a non-empty label." });
      }
      if (!t.color || typeof t.color !== "string" || !t.color.trim()) {
        return res.status(400).json({ message: "Each type must have a non-empty color." });
      }
    }

    // Ensure no duplicate keys
    const keys = types.map((t) => t.key.trim());
    if (new Set(keys).size !== keys.length) {
      return res.status(400).json({ message: "Type keys must be unique." });
    }

    const doc = await AvailabilityTypes.findOneAndUpdate(
      {},
      { types },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json(doc.types);
  } catch (error) {
    next(error);
  }
};
