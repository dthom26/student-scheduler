import Submission from '../models/submission.model.js';  // Import the model
import { validationResult } from 'express-validator';  // For validation errors

// Export both functions
export const createSubmission = async (req, res, next) => {
    try {
        const requestBody = req.body;
        
        // Check if submission with this studentId already exists
        const existingSubmission = await Submission.findOne({ studentId: requestBody.studentId });
        if (existingSubmission) {
            return res.status(409).json({ message: "Submission for this student ID already exists." });
        }
        
        const submission = await Submission.create(requestBody);
        res.status(201).json(submission);
    } catch (error) {
        next(error);
    }
};

export const retrieveSubmissions = async (req, res, next) => {
    try {
        // Auth is already done by middleware; just fetch
        const submissions = await Submission.find();
        res.status(200).json(submissions);
    } catch (error) {
        next(error);
    }
};