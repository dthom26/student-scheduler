// Cache utility for submissions data
interface Submission {
  studentId: string;
  studentName: string;
  location: string;
  notes?: string;
  schedule: Array<{ day: string; time: string; type: string }>;
}

class SubmissionCache {
  private cache = new Map<string, { data: Submission[]; timestamp: number }>();
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 5 minutes

  set(key: string, data: Submission[]): void {
    this.cache.set(key, {
      data: JSON.parse(JSON.stringify(data)), // Deep clone to prevent mutations
      timestamp: Date.now(),
    });
  }

  get(key: string): Submission[] | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > this.CACHE_DURATION;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  invalidate(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  has(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;

    const isExpired = Date.now() - cached.timestamp > this.CACHE_DURATION;
    if (isExpired) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }
}

export const submissionCache = new SubmissionCache();
