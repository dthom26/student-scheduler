export interface DraftAssignment {
  day: "Mon" | "Tue" | "Wed" | "Thu" | "Fri";
  time: string;
  studentId: string;
}

export interface DraftSummary {
  _id: string;
  name: string;
  location: string;
  createdAt: string;
  updatedAt: string;
}

export interface Draft extends DraftSummary {
  assignments: DraftAssignment[];
}
