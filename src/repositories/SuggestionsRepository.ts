import { http } from "../services/httpClient";
import { SUGGESTIONS_URL } from "../constants/api";
import type { DraftAssignment } from "../types/draft";

interface SuggestionResponse {
  assignments: DraftAssignment[];
}

export class SuggestionsRepository {
  async generate(token: string, location: string): Promise<DraftAssignment[]> {
    const res = await http<SuggestionResponse>(`${SUGGESTIONS_URL}/generate`, {
      method: "POST",
      body: JSON.stringify({ location }),
      authToken: token,
    });
    return res.assignments;
  }
}

export const suggestionsRepository = new SuggestionsRepository();
