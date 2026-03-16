import { http } from "../services/httpClient";
import type { Draft, DraftAssignment, DraftSummary } from "../types/draft";
import { DRAFTS_URL } from "../constants/api";

export class DraftRepository {
  async listDrafts(token: string, location: string): Promise<DraftSummary[]> {
    return http<DraftSummary[]>(
      `${DRAFTS_URL}?location=${encodeURIComponent(location)}`,
      { method: "GET", authToken: token }
    );
  }

  async getDraft(token: string, id: string): Promise<Draft> {
    return http<Draft>(`${DRAFTS_URL}/${id}`, {
      method: "GET",
      authToken: token,
    });
  }

  async createDraft(
    token: string,
    name: string,
    location: string,
    assignments: DraftAssignment[]
  ): Promise<Draft> {
    return http<Draft>(DRAFTS_URL, {
      method: "POST",
      body: JSON.stringify({ name, location, assignments }),
      authToken: token,
    });
  }

  async updateDraft(
    token: string,
    id: string,
    name: string,
    assignments: DraftAssignment[]
  ): Promise<Draft> {
    return http<Draft>(`${DRAFTS_URL}/${id}`, {
      method: "PUT",
      body: JSON.stringify({ name, assignments }),
      authToken: token,
    });
  }

  async deleteDraft(token: string, id: string): Promise<void> {
    return http<void>(`${DRAFTS_URL}/${id}`, {
      method: "DELETE",
      authToken: token,
    });
  }
}

export const draftRepository = new DraftRepository();
