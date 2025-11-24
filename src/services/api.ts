import type { ScheduleSubmission } from "../types/submission";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://student-schedular-backend.onrender.com';

// Debug: Log the API URL being used
console.log('API_BASE_URL:', API_BASE_URL);
console.log('VITE_API_BASE_URL env var:', import.meta.env.VITE_API_BASE_URL);

export async function submitSchedule(payload: ScheduleSubmission): Promise<any> {
    // Validate input
    if (!payload.student?.id || !payload.student?.name || !payload.student?.location) {
        throw new Error('Missing required student information');
    }
    
    if (!payload.schedule || payload.schedule.length === 0) {
        throw new Error('Schedule cannot be empty');
    }

    // Make request
    const response = await fetch(`${API_BASE_URL}/api/v1/submissions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            studentId: payload.student.id,
            studentName: payload.student.name,
            location: payload.student.location,
            schedule: payload.schedule,
            notes: payload.notes || ''
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit schedule');
    }

    const data = await response.json();
    return data;
}

export async function fetchSubmissions(token: string) : Promise<any[]> {
    if(!token) {
        throw new Error('Auth token is required');
    }
    const response = await fetch(`${API_BASE_URL}/api/v1/submissions`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    if(!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch submissions');
    }
    const data = await response.json();
    return data;
}