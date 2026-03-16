import ScheduleDraft from "../models/draft.model.js";

const DRAFT_LIMIT = 10;

export const listDraftsByLocation = async (req, res, next) => {
  try {
    const { location } = req.query;

    if (!location) {
      return res.status(400).json({ message: "location query parameter is required." });
    }

    const drafts = await ScheduleDraft.find({ location })
      .select("name location createdAt updatedAt")
      .sort({ updatedAt: -1 });

    res.status(200).json(drafts);
  } catch (error) {
    next(error);
  }
};

export const getDraftById = async (req, res, next) => {
  try {
    const draft = await ScheduleDraft.findById(req.params.id);

    if (!draft) {
      return res.status(404).json({ message: "Draft not found." });
    }

    res.status(200).json(draft);
  } catch (error) {
    next(error);
  }
};

export const createDraft = async (req, res, next) => {
  try {
    const { name, location, assignments } = req.body;

    const count = await ScheduleDraft.countDocuments({ location });
    if (count >= DRAFT_LIMIT) {
      return res.status(400).json({
        message: "Draft limit reached. Delete a draft before saving a new one.",
      });
    }

    const draft = await ScheduleDraft.create({ name, location, assignments });
    res.status(201).json(draft);
  } catch (error) {
    next(error);
  }
};

export const updateDraft = async (req, res, next) => {
  try {
    const { name, assignments } = req.body;

    const draft = await ScheduleDraft.findByIdAndUpdate(
      req.params.id,
      { name, assignments },
      { new: true, runValidators: true }
    );

    if (!draft) {
      return res.status(404).json({ message: "Draft not found." });
    }

    res.status(200).json(draft);
  } catch (error) {
    next(error);
  }
};

export const deleteDraft = async (req, res, next) => {
  try {
    const draft = await ScheduleDraft.findByIdAndDelete(req.params.id);

    if (!draft) {
      return res.status(404).json({ message: "Draft not found." });
    }

    res.status(200).json({ message: "Draft deleted.", id: req.params.id });
  } catch (error) {
    next(error);
  }
};
