import { fetchSubmissions } from "./api";

/**
 * Preload data for faster manager experience
 */
export class DataPreloader {
  private static instance: DataPreloader;

  static getInstance(): DataPreloader {
    if (!DataPreloader.instance) {
      DataPreloader.instance = new DataPreloader();
    }
    return DataPreloader.instance;
  }

  async preloadManagerData(token: string): Promise<void> {
    if (!token || token === "student-token") return;

    try {
      // Preload submissions in background after successful manager login
      await fetchSubmissions(token);
    } catch (error) {
      console.warn("Data preload failed:", error);
      // Don't throw error - this is just a performance optimization
    }
  }
}

export const dataPreloader = DataPreloader.getInstance();
