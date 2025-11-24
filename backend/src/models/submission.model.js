import mongoose from "mongoose";

const scheduleSlotSchema = new mongoose.Schema({
    day: {
        type: String,
        enum: ["Mon", "Tue", "Wed", "Thu", "Fri"],
        required: true
    },
    time: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ["available", "notAvailable", "class", "preferred"],
        required: true
    }
});

const submissionSchema = new mongoose.Schema({
    studentName: {
        type: String,
        required: [true, 'Submission name is required'],
        trim: true
    },
    studentId: {
        type: String,
        required: [true, 'Student ID is required'],
        trim: true
    },
    location: {
        type: String,
        required: [true, 'Location is required'],
        trim: true
    },
    notes: {
        type: String,
        trim: true
    },
    schedule: [scheduleSlotSchema]  // Array of schedule slots  
}, { timestamps: true });



export default mongoose.model("Submission", submissionSchema);