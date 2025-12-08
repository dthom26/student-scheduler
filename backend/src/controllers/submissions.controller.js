import Submission from "../models/submission.model.js"; // Import the model
import { validationResult } from "express-validator"; // For validation errors

// Export both functions
export const createSubmission = async (req, res, next) => {
  try {
    const requestBody = req.body;

    // Check if submission with this studentId already exists
    const existingSubmission = await Submission.findOne({
      studentId: requestBody.studentId,
    });
    if (existingSubmission) {
      return res
        .status(409)
        .json({ message: "Submission for this student ID already exists." });
    }

    const submission = await Submission.create(requestBody);
    res.status(201).json(submission);
  } catch (error) {
    next(error);
  }
};

export const retrieveSubmissions = async (req, res, next) => {
  try {
    // Auth is already done by middleware; build query with optional location filter
    const query = {};
    if (req.query.location) {
      query.location = req.query.location;
    }

    const submissions = await Submission.find(query);
    res.status(200).json(submissions);
  } catch (error) {
    next(error);
  }
};

export const getSubmissionByStudentId = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    
    const submission = await Submission.findOne({ studentId });
    if (!submission) {
      return res.status(404).json({ message: "Submission not found for this student ID." });
    }
    
    res.status(200).json(submission);
  } catch (error) {
    next(error);
  }
};

export const updateSubmission = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const requestBody = req.body;

    const updatedSubmission = await Submission.findOneAndUpdate(
      { studentId },
      requestBody,
      { new: true, runValidators: true }
    );

    if (!updatedSubmission) {
      return res.status(404).json({ message: "Submission not found for this student ID." });
    }

    res.status(200).json(updatedSubmission);
  } catch (error) {
    next(error);
  }
};
