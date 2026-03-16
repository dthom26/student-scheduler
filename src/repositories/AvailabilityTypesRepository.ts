import { http } from "../services/httpClient";
import type { AvailabilityType } from "../types/availabilityType";

const AVAILABILITY_TYPES_URL = "/api/v1/availability-types";

export class AvailabilityTypesRepository {
  async getTypes(): Promise<AvailabilityType[]> {
    return http<AvailabilityType[]>(AVAILABILITY_TYPES_URL, { method: "GET" });
  }

  async updateTypes(token: string, types: AvailabilityType[]): Promise<AvailabilityType[]> {
    return http<AvailabilityType[]>(AVAILABILITY_TYPES_URL, {
      method: "PUT",
      body: JSON.stringify({ types }),
      authToken: token,
    });
  }
}

export const availabilityTypesRepository = new AvailabilityTypesRepository();
