import { http } from "../services/httpClient";
import { RULES_URL } from "../constants/api";
import type { ScheduleRules } from "../types/rules";

export class RulesRepository {
  async getRules(): Promise<ScheduleRules> {
    return http<ScheduleRules>(RULES_URL, { method: "GET" });
  }

  async updateRules(token: string, rules: ScheduleRules): Promise<ScheduleRules> {
    return http<ScheduleRules>(RULES_URL, {
      method: "PUT",
      body: JSON.stringify(rules),
      authToken: token,
    });
  }
}

export const rulesRepository = new RulesRepository();
