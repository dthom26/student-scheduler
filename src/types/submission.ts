export interface ScheduleSlot{
    day: "Mon" | "Tue" | "Wed" | "Thu" | "Fri";
    time: string
    type: "available" | "notAvailable" | "class" | "preferred";
}

export interface ScheduleSubmission {
    student: {
        id: string;
        name: string;
        location: string;
    };
    schedule: ScheduleSlot[];  
    notes: string;
    submittedAt: string;
}