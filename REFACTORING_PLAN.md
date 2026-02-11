# 🚀 Student Scheduler - Refactoring & Optimization Plan

## 🎯 Current Progress: Phase 1 - 60% Complete

**Overall Status:** 🟡 In Progress

| Phase                            | Status         | Progress        | Est. Time Remaining |
| -------------------------------- | -------------- | --------------- | ------------------- |
| **Phase 1: Complete Repository** | 🟡 In Progress | 60% (4/7 tasks) | 30-45 min           |
| **Phase 2: Migrate Components**  | ⚪ Not Started | 0%              | 2-3 hours           |
| **Phase 3: Cleanup**             | ⚪ Not Started | 0%              | 1 hour              |
| **Phase 4: Optimize**            | ⚪ Not Started | 0%              | 4-6 hours           |
| **Phase 5: Backend Optimization**| ⚪ Not Started | 0%              | 3-4 hours           |

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Target Architecture](#target-architecture)
4. [Detailed Implementation Phases](#detailed-implementation-phases)
5. [File Change Matrix](#file-change-matrix)
6. [Testing Strategy](#testing-strategy)
7. [Rollback Plan](#rollback-plan)
8. [Success Metrics](#success-metrics)

---

## 📊 Executive Summary

**Objective:** Refactor the Student Scheduler application to implement the Repository Pattern, improve code organization, and optimize performance.

**Timeline:** 4 phases over 8-12 hours of development time

**Impact:**

- Improved maintainability and testability
- Better separation of concerns
- 30-50% reduction in code duplication
- 20-40% performance improvement through caching and optimization

---

## 🔍 Current State Analysis

### Architecture Overview

```
student-scheduler/
├── frontend/
│   ├── src/
│   │   ├── components/          # UI components
│   │   ├── pages/               # Page-level components
│   │   ├── context/             # React Context (AuthContext)
│   │   ├── services/            # Business logic & API calls
│   │   ├── constants/           # Centralized constants ✅
│   │   ├── types/               # TypeScript types ✅
│   │   └── repositories/        # Data access layer (NEW) 🚧
│   └── backend/
│       ├── src/
│       │   ├── controllers/     # Request handlers
│       │   ├── models/          # Database models
│       │   ├── routes/          # API routes
│       │   └── middleware/      # Auth & error handling
```

### Current Issues

| Issue                                    | Impact                       | Priority |
| ---------------------------------------- | ---------------------------- | -------- |
| Direct API calls in components           | Hard to test, tight coupling | HIGH     |
| Duplicate validation logic               | Maintenance burden           | HIGH     |
| No caching in repository layer           | Performance impact           | MEDIUM   |
| `api.ts` and repository coexist          | Confusion, code duplication  | HIGH     |
| Missing JSDoc documentation              | Poor discoverability         | MEDIUM   |
| Typo in filename (`SubmissonRepository`) | Unprofessional               | LOW      |

---

## 🎯 Target Architecture

### Architectural Layers

```
┌─────────────────────────────────────────┐
│         UI Layer (Components)           │
│  - WeekGridWireframe.tsx                │
│  - ManagerScheduleWireframe.tsx         │
│  - StudentAuth.tsx                      │
└─────────────┬───────────────────────────┘
              │ uses
┌─────────────▼───────────────────────────┐
│      Context Layer (State Mgmt)         │
│  - AuthContext (uses AuthRepository)    │
└─────────────┬───────────────────────────┘
              │ uses
┌─────────────▼───────────────────────────┐
│      Repository Layer (Data Access)     │
│  - AuthRepository                       │
│  - SubmissionRepository                 │
│    └─ Handles: validation, caching,     │
│       error handling, URL encoding      │
└─────────────┬───────────────────────────┘
              │ uses
┌─────────────▼───────────────────────────┐
│     HTTP Client (Network Layer)         │
│  - httpClient.ts                        │
│    └─ Handles: fetch, auth headers,     │
│       response parsing, status checks   │
└─────────────┬───────────────────────────┘
              │ calls
┌─────────────▼───────────────────────────┐
│         Backend API                     │
│  - /api/v1/auth/*                       │
│  - /api/v1/submissions/*                │
└─────────────────────────────────────────┘
```

### Design Principles Applied

1. **Single Responsibility Principle (SRP)**
   - Each layer has one reason to change
   - Repository = data access only
   - Components = UI rendering only

2. **Dependency Inversion Principle (DIP)**
   - High-level components depend on abstractions (repositories)
   - Not on concrete implementations (fetch calls)

3. **Open/Closed Principle**
   - Easy to extend (add new methods)
   - Closed for modification (existing code stable)

4. **Don't Repeat Yourself (DRY)**
   - Single source of truth for validation
   - Reusable singleton instances

---

## 🏗️ Detailed Implementation Phases

---

## **PHASE 1: Complete Repository Layer** ⏱️ 1-2 hours | 🟡 60% Complete

**Goal:** Finish SubmissionRepository to be production-ready

**Completed Tasks:**

- ✅ Created `SubmissionRepository` class
- ✅ Implemented `submitSchedule` method (needs validation added)
- ✅ Implemented `fetchSubmissionById` with 404 handling
- ✅ Implemented `getSubmissionsByLocation` with token validation & URL encoding
- ✅ Implemented `updateSubmission` with full validation

**Remaining Tasks:**

- ❌ Add `getAllSubmissions` method
- ❌ Add input validation to `submitSchedule`
- ❌ Implement caching infrastructure
- ❌ Add JSDoc documentation to all methods
- ❌ Export singleton instance
- ❌ Rename file (fix typo)
- ✅ Delete empty `repositories/types.ts`

---

### Step 1.1: Add Missing getAllSubmissions Method ❌ NOT STARTED

**Time:** 10 minutes

**File:** `src/repositories/SubmissonRepository.ts` → `src/repositories/SubmissionRepository.ts`

**Action:** ADD

```typescript
/**
 * Fetches all submissions (manager-only)
 *
 * @param token - Manager authentication token
 * @param forceRefresh - Skip cache and fetch fresh data
 * @returns Array of all submissions
 * @throws {Error} If token is missing or invalid
 */
async getAllSubmissions(
  token: string,
  forceRefresh = false
): Promise<SubmissionResponse[]> {
  if (!token) {
    throw new Error(ERROR_MESSAGES.AUTH_TOKEN_REQUIRED);
  }

  const cacheKey = `submissions_${token}_all`;

  // Check cache first
  if (!forceRefresh) {
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;
  }

  const data = await http<SubmissionResponse[]>("/api/v1/submissions", {
    method: "GET",
    authToken: token,
  });

  // Cache the result
  this.setCache(cacheKey, data);

  return data;
}
```

---

### Step 1.2: Add Input Validation to submitSchedule ❌ NOT STARTED

**Time:** 10 minutes

**File:** `src/repositories/SubmissionRepository.ts`

**Action:** UPDATE

```typescript
async submitSchedule(
  submissionData: ScheduleSubmission
): Promise<SubmissionResponse> {
  // ADD VALIDATION (matching updateSubmission pattern)
  if (
    !submissionData.student?.id ||
    !submissionData.student?.name ||
    !submissionData.student?.location
  ) {
    throw new Error(ERROR_MESSAGES.MISSING_STUDENT_INFO);
  }

  if (!submissionData.schedule || submissionData.schedule.length === 0) {
    throw new Error(ERROR_MESSAGES.SCHEDULE_EMPTY);
  }

  return http<SubmissionResponse>("/api/v1/submissions", {
    method: "POST",
    body: JSON.stringify(submissionData),
  });
}
```

---

### Step 1.3: Add Caching Infrastructure ❌ NOT STARTED

**Time:** 20 minutes

**File:** `src/repositories/SubmissionRepository.ts`

**Action:** ADD

```typescript
export class SubmissionRepository {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Get data from cache if not expired
   */
  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > this.CACHE_DURATION;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  /**
   * Store data in cache with timestamp
   */
  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Clear all cached data
   */
  public clearCache(): void {
    this.cache.clear();
  }
}
```

---

### Step 1.4: Update getSubmissionsByLocation with Caching ❌ NOT STARTED

**Time:** 10 minutes

**File:** `src/repositories/SubmissionRepository.ts`

**Action:** UPDATE

```typescript
async getSubmissionsByLocation(
  token: string,
  location: string,
  forceRefresh = false
): Promise<SubmissionResponse[]> {
  if (!token) {
    throw new Error(ERROR_MESSAGES.AUTH_TOKEN_REQUIRED);
  }

  const cacheKey = `submissions_${token}_${location}`;

  // Check cache first
  if (!forceRefresh) {
    const cached = this.getFromCache<SubmissionResponse[]>(cacheKey);
    if (cached) return cached;
  }

  const data = await http<SubmissionResponse[]>(
    `/api/v1/submissions?location=${encodeURIComponent(location)}`,
    {
      method: "GET",
      authToken: token,
    }
  );

  // Cache the result
  this.setCache(cacheKey, data);

  return data;
}
```

---

### Step 1.5: Add JSDoc Documentation ❌ NOT STARTED

**Time:** 15 minutes

**File:** `src/repositories/SubmissionRepository.ts`

**Action:** UPDATE - Add comprehensive JSDoc to all methods

**Example:**

````typescript
/**
 * SubmissionRepository
 *
 * Handles all submission-related data operations.
 * Implements caching, validation, and error handling.
 *
 * Key Principles:
 * 1. Single Responsibility: Only manages submission data access
 * 2. Abstraction: Hides implementation details from consumers
 * 3. Dependency Inversion: Depends on http abstraction
 * 4. Testability: Easy to mock for unit tests
 *
 * @example
 * ```typescript
 * const submission = await submissionRepository.submitSchedule(data);
 * const all = await submissionRepository.getAllSubmissions(token);
 * ```
 */
export class SubmissionRepository {
  // ... documented methods
}
````

---

### Step 1.6: Export Singleton Instance ❌ NOT STARTED

**Time:** 5 minutes

**File:** `src/repositories/SubmissionRepository.ts`

**Action:** ADD at end of file

```typescript
/**
 * Singleton instance of SubmissionRepository
 * Use this throughout the application for consistent caching and state
 */
export const submissionRepository = new SubmissionRepository();
```

---

### Step 1.7: Rename File (Fix Typo) ❌ NOT STARTED

**Time:** 2 minutes

**Action:** RENAME

- FROM: `src/repositories/SubmissonRepository.ts`
- TO: `src/repositories/SubmissionRepository.ts`

**Update imports in:**

- Any files currently importing from the old path (likely none yet)

---

### Step 1.8: Delete Empty types.ts ❌ NOT STARTED

**Time:** 1 minute

**File:** `src/repositories/types.ts`

**Action:** DELETE (contents moved to `src/types/auth.ts`)

---

### Phase 1 Summary

**Files Changed:**

- ✏️ RENAME: `SubmissonRepository.ts` → `SubmissionRepository.ts`
- ✏️ UPDATE: Add 3 methods, caching, validation, JSDoc
- 🗑️ DELETE: `repositories/types.ts`

**Time Investment:** 1-2 hours  
**Lines of Code:** +150 / -10  
**Testing:** Manual test each method in isolation

---

## **PHASE 2: Migrate Component Call Sites** ⏱️ 2-3 hours | ⚪ NOT STARTED

**Goal:** Replace all direct `api.ts` imports with repository usage

---

### Step 2.1: Migrate WeekGridWireframe.tsx ⚪ NOT STARTED

**Time:** 30 minutes

**File:** `src/pages/studentView/WeekGridWireframe.tsx`

**Current Code (Line 9):**

```typescript
import { submitSchedule, updateStudentSchedule } from "../../services/api";
```

**Action:** REPLACE with

```typescript
import { submissionRepository } from "../../repositories/SubmissionRepository";
```

**Current Usage (Line ~355-365):**

```typescript
if (isUpdate) {
  result = await updateStudentSchedule(studentId, submission);
} else {
  result = await submitSchedule(submission);
}
```

**Action:** REPLACE with

```typescript
if (isUpdate) {
  result = await submissionRepository.updateSubmission(studentId, submission);
} else {
  result = await submissionRepository.submitSchedule(submission);
}
```

**Testing:**

- [ ] Test new student submission
- [ ] Test returning student update
- [ ] Test validation errors
- [ ] Test success/error alerts

---

### Step 2.2: Migrate ManagerScheduleWireframe.tsx ⚪ NOT STARTED

**Time:** 30 minutes

**File:** `src/pages/managerView/ManagerScheduleWireframe.tsx`

**Current Code (Line 6):**

```typescript
import { fetchSubmissions } from "../../services/api";
```

**Action:** REPLACE with

```typescript
import { submissionRepository } from "../../repositories/SubmissionRepository";
```

**Current Usage (Line ~120-140):**

```typescript
const loadSubmissions = async (location?: string, forceRefresh = false) => {
  setIsLoading(true);
  try {
    const data = await fetchSubmissions(token!, location, forceRefresh);
    setSubmissions(data);
  } catch (error) {
    console.error("Failed to load submissions:", error);
  } finally {
    setIsLoading(false);
  }
};
```

**Action:** REPLACE with

```typescript
const loadSubmissions = async (location?: string, forceRefresh = false) => {
  setIsLoading(true);
  try {
    const data = location
      ? await submissionRepository.getSubmissionsByLocation(
          token!,
          location,
          forceRefresh
        )
      : await submissionRepository.getAllSubmissions(token!, forceRefresh);
    setSubmissions(data);
  } catch (error) {
    console.error("Failed to load submissions:", error);
  } finally {
    setIsLoading(false);
  }
};
```

**Testing:**

- [ ] Test load all submissions
- [ ] Test filter by location
- [ ] Test force refresh
- [ ] Test caching behavior

---

### Step 2.3: Migrate StudentAuth.tsx ⚪ NOT STARTED

**Time:** 20 minutes

**File:** `src/components/StudentAuth.tsx`

**Current Code (Line 2):**

```typescript
import { getStudentSubmission } from "../services/api";
```

**Action:** REPLACE with

```typescript
import { submissionRepository } from "../repositories/SubmissionRepository";
```

**Current Usage (Line ~50-60):**

```typescript
const submission = await getStudentSubmission(studentId);
```

**Action:** REPLACE with

```typescript
const submission = await submissionRepository.fetchSubmissionById(studentId);
```

**Testing:**

- [ ] Test new student (returns null)
- [ ] Test returning student (loads data)
- [ ] Test invalid studentId

---

### Step 2.4: Migrate preloader.ts ⚪ NOT STARTED

**Time:** 15 minutes

**File:** `src/services/preloader.ts`

**Current Code (Line 1):**

```typescript
import { fetchSubmissions } from "./api";
```

**Action:** REPLACE with

```typescript
import { submissionRepository } from "../repositories/SubmissionRepository";
```

**Current Usage (Line ~20-25):**

```typescript
async preloadManagerData(token: string): Promise<void> {
  if (!token || token === "student-token") return;
  try {
    await fetchSubmissions(token);
  } catch (error) {
    console.warn("Preload failed:", error);
  }
}
```

**Action:** REPLACE with

```typescript
async preloadManagerData(token: string): Promise<void> {
  if (!token || token === "student-token") return;
  try {
    await submissionRepository.getAllSubmissions(token);
  } catch (error) {
    console.warn("Preload failed:", error);
  }
}
```

**Testing:**

- [ ] Test preload on manager login
- [ ] Test preload skipped for students

---

### Phase 2 Summary

**Files Changed:**

- ✏️ UPDATE: `WeekGridWireframe.tsx` (import + 2 call sites)
- ✏️ UPDATE: `ManagerScheduleWireframe.tsx` (import + 1 call site with conditional)
- ✏️ UPDATE: `StudentAuth.tsx` (import + 1 call site)
- ✏️ UPDATE: `preloader.ts` (import + 1 call site)

**Time Investment:** 2-3 hours  
**Lines Changed:** ~20-30 lines  
**Testing:** Full E2E testing of all user flows

---

## **PHASE 3: Cleanup & Refactor api.ts** ⏱️ 1 hour | ⚪ NOT STARTED

**Goal:** Remove duplicate code and deprecate old API layer

---

### Step 3.1: Remove Functions from api.ts ⚪ NOT STARTED

**Time:** 20 minutes

**File:** `src/services/api.ts`

**Action:** DELETE these functions (now in repository):

```typescript
// DELETE:
export async function submitSchedule(...)
export async function fetchSubmissions(...)
export async function getStudentSubmission(...)
export async function updateStudentSchedule(...)
```

**Keep (if used elsewhere):**

- Utility functions
- Type definitions (if not in `types/`)

**Result:**

- File should be mostly empty or deleted
- Or rename to `api.deprecated.ts` with warnings

---

### Step 3.2: Update Imports Across Codebase ⚪ NOT STARTED

**Time:** 15 minutes

**Action:** SEARCH for any remaining imports:

```bash
grep -r "from.*services/api" src/
```

**Expected:** No results (all migrated in Phase 2)

**If found:** Update to use repository

---

### Step 3.3: Delete cache.ts (If Empty) ⚪ NOT STARTED

**Time:** 5 minutes

**File:** `src/services/cache.ts`

**Check:** Is `submissionCache` still used?

**If NO:**

- DELETE: `src/services/cache.ts`
- Caching now in repository

**If YES:**

- Keep for now, plan migration

---

### Step 3.4: Update scheduleService.ts ⚪ NOT STARTED

**Time:** 20 minutes

**File:** `src/services/scheduleService.ts`

**Review:** Does this file use `api.ts`?

**If YES:**

- UPDATE: Use repository instead
- ADD: JSDoc documentation

**If NO:**

- REVIEW: Is this service still needed?
- Consider moving logic to repository

---

### Phase 3 Summary

**Files Changed:**

- 🗑️ DELETE or DEPRECATE: `services/api.ts`
- 🗑️ DELETE (maybe): `services/cache.ts`
- ✏️ UPDATE (maybe): `services/scheduleService.ts`

**Time Investment:** 1 hour  
**Lines Removed:** ~200-300 lines  
**Testing:** Verify no broken imports, full app testing

---

## **PHASE 4: Performance Optimizations** ⏱️ 4-6 hours | ⚪ NOT STARTED

**Goal:** Implement advanced optimizations from roadmap

---

### Step 4.1: Add Pagination Support ⚪ NOT STARTED

**Time:** 2 hours

#### Backend Changes

**File:** `backend/src/controllers/submissions.controller.js`

**Action:** UPDATE `getAllSubmissions`

```javascript
export const getAllSubmissions = async (req, res, next) => {
  try {
    const { location, limit = 50, offset = 0 } = req.query;

    const query = location ? { location } : {};

    const [submissions, total] = await Promise.all([
      Submission.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(offset)),
      Submission.countDocuments(query),
    ]);

    res.json({
      submissions,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    next(error);
  }
};
```

#### Frontend Changes

**File:** `src/types/submission.ts`

**Action:** ADD

```typescript
export interface PaginatedSubmissionsResponse {
  submissions: SubmissionResponse[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}
```

**File:** `src/repositories/SubmissionRepository.ts`

**Action:** UPDATE

```typescript
async getAllSubmissions(
  token: string,
  options: { limit?: number; offset?: number; forceRefresh?: boolean } = {}
): Promise<PaginatedSubmissionsResponse> {
  const { limit = 50, offset = 0, forceRefresh = false } = options;

  if (!token) {
    throw new Error(ERROR_MESSAGES.AUTH_TOKEN_REQUIRED);
  }

  const cacheKey = `submissions_${token}_${limit}_${offset}`;

  if (!forceRefresh) {
    const cached = this.getFromCache<PaginatedSubmissionsResponse>(cacheKey);
    if (cached) return cached;
  }

  const data = await http<PaginatedSubmissionsResponse>(
    `/api/v1/submissions?limit=${limit}&offset=${offset}`,
    {
      method: "GET",
      authToken: token,
    }
  );

  this.setCache(cacheKey, data);
  return data;
}
```

**File:** `src/pages/managerView/ManagerScheduleWireframe.tsx`

**Action:** UPDATE - Add pagination UI and infinite scroll

---

### Step 4.2: Implement Code Splitting ⚪ NOT STARTED

**Time:** 1 hour

**File:** `src/App.tsx`

**Action:** UPDATE

```typescript
import { lazy, Suspense } from 'react';

// Lazy load heavy components
const WeekGridWireframe = lazy(() => import('./pages/studentView/WeekGridWireframe'));
const ManagerScheduleWireframe = lazy(() => import('./pages/managerView/ManagerScheduleWireframe'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      {role === USER_ROLES.STUDENT ? (
        <WeekGridWireframe />
      ) : (
        <ManagerScheduleWireframe />
      )}
    </Suspense>
  );
}
```

---

### Step 4.3: Add Virtual Scrolling (Optional) ⚪ NOT STARTED

**Time:** 1-2 hours

**Install:** `npm install react-window`

**File:** `src/pages/managerView/components/StudentSchedulesCalendar.tsx`

**Action:** REFACTOR to use `FixedSizeList` from react-window for large datasets

---

### Phase 4 Summary

**Files Changed:**

- ✏️ UPDATE: Backend controller (pagination)
- ✏️ UPDATE: Frontend types (pagination response)
- ✏️ UPDATE: Repository (pagination params)
- ✏️ UPDATE: Manager view (pagination UI)
- ✏️ UPDATE: App.tsx (code splitting)
- ✏️ UPDATE (optional): Calendar (virtual scrolling)

**Time Investment:** 4-6 hours  
**Performance Gain:** 30-50% faster initial load, 60%+ faster with large datasets

---

## **PHASE 5: Backend Optimizations** ⏱️ 3-4 hours | ⚪ NOT STARTED

**Goal:** Move frontend logic to backend for better performance and maintainability

**Problem:** Currently, the frontend fetches all submissions and does filtering, transformation, and business logic calculations client-side. This results in:
- Unnecessary data transfer (loading all locations when only one is needed)
- Heavy computation on the client
- Duplicated business logic between frontend and backend
- Difficult to maintain time-based rules across components

---

### Step 5.1: Use Server-Side Location Filtering ⚪ NOT STARTED

**Time:** 30 minutes  
**Priority:** HIGH

**Problem:** `ManagerScheduleWireframe.tsx` calls `getAllSubmissions()` and filters by location on the frontend:

```typescript
// Current (inefficient)
const data = await submissionRepository.getAllSubmissions(token);
setSubmissions(data);
// Then filters: submissions.filter((sub) => sub.location === location)
```

**Solution:** Use the existing `getSubmissionsByLocation()` method

**File:** `src/pages/managerView/ManagerScheduleWireframe.tsx`

**Action:** UPDATE

```typescript
useEffect(() => {
  const loadSubmissions = async () => {
    if (!token || !location) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // Use location-filtered endpoint instead of fetching all
      const data = await submissionRepository.getSubmissionsByLocation(
        token,
        location,
        false // use cache
      );
      setSubmissions(data);
      setDataLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : ERROR_MESSAGES.FETCHING_SUBMISSIONS_ERROR);
    } finally {
      setIsLoading(false);
    }
  };

  loadSubmissions();
}, [token, location]); // Re-fetch when location changes
```

**Benefit:** 
- 50-80% reduction in data transfer (depending on location distribution)
- Faster query execution with indexed MongoDB queries
- Better cache efficiency

---

### Step 5.2: Create Backend Endpoint for Availability Grid ⚪ NOT STARTED

**Time:** 2 hours  
**Priority:** HIGH

**Problem:** Complex 60+ line data transformation in `ManagerScheduleWireframe.tsx` converting schedule slots to grid format:

```typescript
const displayedAvailability = useMemo(() => {
  const availability: Record<string, Record<Day, (StudentStatus | null)[]>> = {};
  // 60+ lines of nested loops and transformations
  submissions.filter(...).forEach((sub) => {
    sub.schedule.forEach((slot) => {
      const timeIndex = timeSlots.indexOf(slot.time);
      if (timeIndex !== -1 && timeIndex < slotsForDay) {
        daySlots[timeIndex] = slot.type;
      }
    });
  });
  return availability;
}, [submissions, location]);
```

**Solution:** Create a new backend endpoint that returns pre-formatted availability grids

#### Backend Changes

**File:** `backend/src/controllers/submissions.controller.js`

**Action:** ADD new controller

```javascript
export const getAvailabilityGrid = async (req, res, next) => {
  try {
    const { location } = req.query;
    
    if (!location) {
      return res.status(400).json({ message: "Location parameter is required" });
    }

    const submissions = await Submission.find({ location });
    
    const timeSlots = [
      "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
      "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
      "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
      "17:00", "17:30", "18:00"
    ];
    
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    const availability = {};
    
    submissions.forEach((sub) => {
      availability[sub.studentId] = {};
      
      days.forEach((day) => {
        const slotsForDay = day === "Fri" ? 18 : 21;
        const daySlots = new Array(slotsForDay).fill(null);
        
        sub.schedule.forEach((slot) => {
          if (slot.day === day) {
            const timeIndex = timeSlots.indexOf(slot.time);
            if (timeIndex !== -1 && timeIndex < slotsForDay) {
              daySlots[timeIndex] = slot.type;
            }
          }
        });
        
        availability[sub.studentId][day] = daySlots;
      });
    });
    
    res.json({
      location,
      availability,
      students: submissions.map((sub) => ({
        id: sub.studentId,
        name: sub.studentName,
        location: sub.location,
        notes: sub.notes || ""
      }))
    });
  } catch (error) {
    next(error);
  }
};
```

**File:** `backend/src/routes/submissions.routes.js`

**Action:** ADD route

```javascript
submissionsRouter.get("/availability", verifyManagerToken, getAvailabilityGrid);
```

#### Frontend Changes

**File:** `src/types/submission.ts`

**Action:** ADD

```typescript
export interface AvailabilityGridResponse {
  location: string;
  availability: Record<string, Record<Day, (StudentStatus | null)[]>>;
  students: Array<{
    id: string;
    name: string;
    location: string;
    notes: string;
  }>;
}
```

**File:** `src/repositories/SubmissionRepository.ts`

**Action:** ADD

```typescript
/**
 * Fetch pre-formatted availability grid (manager-only)
 * 
 * @param token - Manager authentication token
 * @param location - Location to fetch availability for
 * @param forceRefresh - Skip cache and fetch fresh data
 * @returns Pre-formatted availability grid with student data
 */
async getAvailabilityGrid(
  token: string,
  location: string,
  forceRefresh = false
): Promise<AvailabilityGridResponse> {
  if (!token) {
    throw new Error(ERROR_MESSAGES.AUTH_TOKEN_REQUIRED);
  }

  const cacheKey = `availability_${token}_${location}`;

  if (!forceRefresh) {
    const cached = this.getFromCache<AvailabilityGridResponse>(cacheKey);
    if (cached) return cached;
  }

  const data = await http<AvailabilityGridResponse>(
    `/api/v1/submissions/availability?location=${encodeURIComponent(location)}`,
    {
      method: "GET",
      authToken: token,
    }
  );

  this.setCache(cacheKey, data);
  return data;
}
```

**File:** `src/pages/managerView/ManagerScheduleWireframe.tsx`

**Action:** SIMPLIFY - replace transformation logic

```typescript
const [availabilityData, setAvailabilityData] = useState<AvailabilityGridResponse | null>(null);

useEffect(() => {
  const loadData = async () => {
    if (!token || !location) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const data = await submissionRepository.getAvailabilityGrid(token, location);
      setAvailabilityData(data);
      setDataLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : ERROR_MESSAGES.FETCHING_SUBMISSIONS_ERROR);
    } finally {
      setIsLoading(false);
    }
  };

  loadData();
}, [token, location]);

// Use the pre-formatted data directly
const displayedStudents = useMemo(() => {
  return availabilityData?.students.map((s, idx) => ({
    ...s,
    color: `hsl(${idx * 60}, 70%, 60%)`
  })) || [];
}, [availabilityData]);

const displayedAvailability = availabilityData?.availability || {};
```

**Benefit:**
- Removes 60+ lines of complex frontend code
- Reduces frontend computation
- Single source of truth for transformation logic
- Easier to test and maintain

---

### Step 5.3: Move Time Slot Business Logic to Backend Model ⚪ NOT STARTED

**Time:** 1 hour  
**Priority:** MEDIUM

**Problem:** Business rules for time slots (Friday 5 PM cutoff, other days 6 PM) scattered across multiple frontend files:
- `scheduleService.ts`
- `StudentSchedulesCalendar.tsx`
- `WeekGridWireframe.tsx`

**Solution:** Centralize in backend model with helper methods

**File:** `backend/src/models/submission.model.js`

**Action:** ADD static methods

```javascript
// Static helper methods for time slot business logic
submissionSchema.statics.getTimeSlotsForDay = function(day) {
  const allTimeSlots = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
    "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
    "17:00", "17:30", "18:00"
  ];
  
  // Friday ends at 17:00, other days at 18:00
  const maxIndex = day === "Fri" ? 17 : 20; // Up to 16:30 for Fri, 17:30 for others
  return allTimeSlots.slice(0, maxIndex + 1);
};

submissionSchema.statics.getClosingTime = function(day) {
  return day === "Fri" ? "17:00" : "18:00";
};

submissionSchema.statics.isValidTimeSlot = function(day, time) {
  const validSlots = this.getTimeSlotsForDay(day);
  return validSlots.includes(time);
};

submissionSchema.statics.getEndTimeForSlot = function(day, time) {
  const [hours, minutes] = time.split(":");
  const date = new Date();
  date.setHours(parseInt(hours), parseInt(minutes));
  date.setMinutes(date.getMinutes() + 30);
  
  const closingTime = this.getClosingTime(day);
  const [closeHours, closeMinutes] = closingTime.split(":");
  const closingDate = new Date();
  closingDate.setHours(parseInt(closeHours), parseInt(closeMinutes));
  
  // Cap at closing time
  if (date >= closingDate) {
    return closingTime;
  }
  
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
};
```

**File:** `backend/src/controllers/submissions.controller.js`

**Action:** ADD validation using model methods

```javascript
export const createSubmission = async (req, res, next) => {
  try {
    const requestBody = req.body;

    // Validate time slots using model methods
    const invalidSlots = requestBody.schedule.filter(
      (slot) => !Submission.isValidTimeSlot(slot.day, slot.time)
    );
    
    if (invalidSlots.length > 0) {
      return res.status(400).json({
        message: "Invalid time slots detected",
        invalidSlots
      });
    }

    // Check for existing submission
    const existingSubmission = await Submission.findOne({
      studentId: requestBody.studentId,
    });
    
    if (existingSubmission) {
      return res.status(409).json({
        message: "Submission for this student ID already exists."
      });
    }

    const submission = await Submission.create(requestBody);
    res.status(201).json(submission);
  } catch (error) {
    next(error);
  }
};
```

**Benefit:**
- Single source of truth for business hours
- Easy to update business rules (one place)
- Server-side validation prevents invalid data
- Frontend can still access these rules via API if needed

---

### Step 5.4: Add Backend Validation with express-validator ⚪ NOT STARTED

**Time:** 1 hour  
**Priority:** MEDIUM

**Problem:** Frontend validation can be bypassed. Backend has minimal validation.

**Solution:** Add comprehensive backend validation middleware

**File:** `backend/src/middleware/validation.middleware.js`

**Action:** CREATE

```javascript
import { body, query, validationResult } from "express-validator";

export const validateSubmission = [
  body("studentId")
    .notEmpty()
    .withMessage("Student ID is required")
    .isString()
    .trim(),
  body("studentName")
    .notEmpty()
    .withMessage("Student name is required")
    .isString()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),
  body("location")
    .notEmpty()
    .withMessage("Location is required")
    .isIn(["hsl", "med"])
    .withMessage("Invalid location"),
  body("schedule")
    .isArray({ min: 1 })
    .withMessage("Schedule must contain at least one time slot"),
  body("schedule.*.day")
    .isIn(["Mon", "Tue", "Wed", "Thu", "Fri"])
    .withMessage("Invalid day"),
  body("schedule.*.type")
    .isIn(["available", "notAvailable", "class", "preferred"])
    .withMessage("Invalid schedule type"),
  body("notes")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Notes must not exceed 1000 characters"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateLocationQuery = [
  query("location")
    .optional()
    .isIn(["hsl", "med"])
    .withMessage("Invalid location"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];
```

**File:** `backend/src/routes/submissions.routes.js`

**Action:** UPDATE - add validation middleware

```javascript
import { validateSubmission, validateLocationQuery } from "../middleware/validation.middleware.js";

submissionsRouter.get("/", verifyManagerToken, validateLocationQuery, retrieveSubmissions);
submissionsRouter.post("/", validateSubmission, createSubmission);
submissionsRouter.put("/:studentId", validateSubmission, updateSubmission);
submissionsRouter.get("/availability", verifyManagerToken, validateLocationQuery, getAvailabilityGrid);
```

**Benefit:**
- Prevents invalid data from reaching the database
- Clear error messages for debugging
- Consistent validation across all endpoints
- Defense against malicious requests

---

### Step 5.5: Add Backend API Documentation Endpoint ⚪ NOT STARTED

**Time:** 30 minutes  
**Priority:** LOW

**File:** `backend/src/controllers/docs.controller.js`

**Action:** CREATE - Add endpoint that returns time slot configuration

```javascript
export const getTimeSlotConfiguration = (req, res) => {
  res.json({
    businessHours: {
      monday: { start: "08:00", end: "18:00" },
      tuesday: { start: "08:00", end: "18:00" },
      wednesday: { start: "08:00", end: "18:00" },
      thursday: { start: "08:00", end: "18:00" },
      friday: { start: "08:00", end: "17:00" },
    },
    timeSlotDuration: 30, // minutes
    validDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    validTypes: ["available", "notAvailable", "class", "preferred"],
    validLocations: ["hsl", "med"],
  });
};
```

**File:** `backend/src/routes/index.js`

**Action:** ADD route

```javascript
import { getTimeSlotConfiguration } from "../controllers/docs.controller.js";

router.get("/api/v1/config/timeslots", getTimeSlotConfiguration);
```

**Benefit:**
- Frontend can fetch configuration dynamically
- Easy to change business hours without frontend redeployment
- Self-documenting API

---

### Phase 5 Summary

**Files Changed:**

- ✏️ UPDATE: `ManagerScheduleWireframe.tsx` (use filtered endpoint + pre-formatted data)
- ✏️ UPDATE: `SubmissionRepository.ts` (add getAvailabilityGrid method)
- ✏️ ADD: `validation.middleware.js` (backend validation)
- ✏️ UPDATE: `submissions.controller.js` (add getAvailabilityGrid, validation)
- ✏️ UPDATE: `submissions.routes.js` (add routes + validation)
- ✏️ UPDATE: `submission.model.js` (add time slot helper methods)
- ✏️ ADD: `docs.controller.js` (configuration endpoint)
- ✏️ UPDATE: `types/submission.ts` (add AvailabilityGridResponse)

**Time Investment:** 3-4 hours  
**Code Reduction:** ~80-100 lines removed from frontend  
**Performance Gain:** 
- 50-80% reduction in data transfer
- 70-90% reduction in frontend computation
- Better scalability for large datasets

**Data Transfer Comparison:**

| Scenario | Before (All Submissions) | After (Filtered + Formatted) | Savings |
|----------|-------------------------|------------------------------|----------|
| 50 students (25 per location) | ~150KB | ~75KB | 50% |
| 100 students (50 per location) | ~300KB | ~150KB | 50% |
| 200 students (100 per location) | ~600KB | ~300KB | 50% |

---

## 📁 File Change Matrix

### Complete File Inventory

| File Path                                            | Phase | Action                             | Priority | Status         | Est. Time |
| ---------------------------------------------------- | ----- | ---------------------------------- | -------- | -------------- | --------- |
| `src/repositories/SubmissonRepository.ts`            | 1     | RENAME → `SubmissionRepository.ts` | HIGH     | ❌ TODO        | 2 min     |
| `src/repositories/SubmissionRepository.ts`           | 1     | UPDATE (add methods, cache, docs)  | HIGH     | 🟡 60%         | 60 min    |
| `src/repositories/types.ts`                          | 1     | DELETE                             | MEDIUM   | ❌ TODO        | 1 min     |
| `src/pages/studentView/WeekGridWireframe.tsx`        | 2     | UPDATE (imports & calls)           | HIGH     | ⚪ Not Started | 30 min    |
| `src/pages/managerView/ManagerScheduleWireframe.tsx` | 2     | UPDATE (imports & calls)           | HIGH     | ⚪ Not Started | 30 min    |
| `src/components/StudentAuth.tsx`                     | 2     | UPDATE (imports & calls)           | HIGH     | ⚪ Not Started | 20 min    |
| `src/services/preloader.ts`                          | 2     | UPDATE (imports & calls)           | MEDIUM   | ⚪ Not Started | 15 min    |
| `src/services/api.ts`                                | 3     | DELETE or DEPRECATE                | HIGH     | ⚪ Not Started | 20 min    |
| `src/services/cache.ts`                              | 3     | DELETE (if unused)                 | MEDIUM   | ⚪ Not Started | 5 min     |
| `src/services/scheduleService.ts`                    | 3     | REVIEW & UPDATE                    | LOW      | ⚪ Not Started | 20 min    |
| `backend/src/controllers/submissions.controller.js`  | 4     | UPDATE (pagination)                | MEDIUM   | ⚪ Not Started | 60 min    |
| `src/types/submission.ts`                            | 4     | UPDATE (pagination types)          | MEDIUM   | ⚪ Not Started | 10 min    |
| `src/App.tsx`                                        | 4     | UPDATE (code splitting)            | MEDIUM   | ⚪ Not Started | 30 min    |
| `src/pages/managerView/ManagerScheduleWireframe.tsx` | 5     | UPDATE (use filtered endpoint)     | HIGH     | ⚪ Not Started | 30 min    |
| `backend/src/controllers/submissions.controller.js`  | 5     | ADD (getAvailabilityGrid)          | HIGH     | ⚪ Not Started | 60 min    |
| `backend/src/middleware/validation.middleware.js`    | 5     | CREATE (validation)                | MEDIUM   | ⚪ Not Started | 60 min    |
| `backend/src/models/submission.model.js`             | 5     | UPDATE (time slot helpers)         | MEDIUM   | ⚪ Not Started | 30 min    |
| `backend/src/routes/submissions.routes.js`           | 5     | UPDATE (add validation)            | MEDIUM   | ⚪ Not Started | 15 min    |
| `backend/src/controllers/docs.controller.js`         | 5     | CREATE (config endpoint)           | LOW      | ⚪ Not Started | 20 min    |
| `src/repositories/SubmissionRepository.ts`           | 5     | UPDATE (add getAvailabilityGrid)   | HIGH     | ⚪ Not Started | 20 min    |
| `src/types/submission.ts`                            | 5     | ADD (AvailabilityGridResponse)     | HIGH     | ⚪ Not Started | 10 min    |

### Summary Statistics

- **Total Files Affected:** 20
- **Files to Create:** 2
- **Files to Update:** 16
- **Files to Rename:** 1
- **Files to Delete:** 2
- **Total Estimated Time:** 11-16 hours

---

## 🧪 Testing Strategy

### Phase 1 Testing: Repository Layer

**Manual Tests:**

```typescript
// Test in browser console after importing repository

// Test 1: Submit new schedule
const testSubmission = {
  student: { id: "TEST123", name: "Test Student", location: "Main Campus" },
  schedule: [{ day: "Mon", time: "09:00", type: "available" }],
  notes: "Test notes",
};
await submissionRepository.submitSchedule(testSubmission);

// Test 2: Fetch by ID
const result = await submissionRepository.fetchSubmissionById("TEST123");
console.assert(result !== null, "Should return submission");

// Test 3: Fetch by ID (not found)
const notFound = await submissionRepository.fetchSubmissionById("NONEXISTENT");
console.assert(notFound === null, "Should return null for 404");

// Test 4: Get all (manager)
const all = await submissionRepository.getAllSubmissions("manager-token");
console.assert(Array.isArray(all), "Should return array");

// Test 5: Get by location
const filtered = await submissionRepository.getSubmissionsByLocation(
  "manager-token",
  "Main Campus"
);
console.assert(Array.isArray(filtered), "Should return array");

// Test 6: Cache verification
const start = Date.now();
await submissionRepository.getAllSubmissions("manager-token");
const cached = await submissionRepository.getAllSubmissions("manager-token");
const elapsed = Date.now() - start;
console.assert(elapsed < 50, "Second call should be cached (fast)");

// Test 7: Token validation
try {
  await submissionRepository.getAllSubmissions("");
  console.error("Should have thrown error");
} catch (e) {
  console.assert(e.message.includes("TOKEN"), "Should validate token");
}
```

### Phase 2 Testing: Component Integration

**Test Checklist:**

**Student View (WeekGridWireframe)**

- [ ] New student can submit schedule
- [ ] Form validation works (empty fields)
- [ ] Success alert shows on submit
- [ ] Returning student sees existing data
- [ ] Returning student can update schedule
- [ ] Update success alert shows
- [ ] Error alert shows on failure

**Manager View (ManagerScheduleWireframe)**

- [ ] All submissions load on login
- [ ] Location filter works
- [ ] Cache reduces load time (second visit)
- [ ] Force refresh bypasses cache
- [ ] Pagination works (if implemented)
- [ ] Loading states show correctly

**Student Auth (StudentAuth)**

- [ ] New student flow works
- [ ] Returning student flow works
- [ ] Invalid ID handled gracefully

### Phase 3 Testing: Cleanup Verification

**Checks:**

- [ ] No imports from `services/api.ts` remain
- [ ] App builds without errors
- [ ] All pages load correctly
- [ ] No console errors
- [ ] TypeScript compile succeeds

### Phase 4 Testing: Performance

**Metrics to Track:**

- [ ] Initial load time (before/after)
- [ ] Time to first submission display
- [ ] Memory usage with large datasets
- [ ] Network request count (caching)
- [ ] Bundle size (code splitting)

**Tools:**

- Chrome DevTools Lighthouse
- React DevTools Profiler
- Network tab (cache validation)

---

## 🔄 Rollback Plan

### If Issues Arise During Migration

**Phase 1 Rollback:**

```bash
# Revert repository changes
git checkout HEAD -- src/repositories/SubmissionRepository.ts
git checkout HEAD -- src/repositories/types.ts
```

**Phase 2 Rollback (Per Component):**

```bash
# Revert specific component
git checkout HEAD -- src/pages/studentView/WeekGridWireframe.tsx
```

**Phase 3 Rollback:**

```bash
# Restore api.ts
git checkout HEAD -- src/services/api.ts
git checkout HEAD -- src/services/cache.ts
```

**Full Rollback:**

```bash
# Revert all changes
git reset --hard HEAD~N  # N = number of commits since start
git push --force  # Only if safe to force push
```

### Mitigation Strategy

1. **Work in Feature Branch**

   ```bash
   git checkout -b refactor/repository-pattern
   ```

2. **Commit After Each Phase**

   ```bash
   git commit -m "Phase 1: Complete SubmissionRepository"
   git commit -m "Phase 2: Migrate WeekGridWireframe"
   # etc.
   ```

3. **Test Before Merging**
   - Full E2E testing after each phase
   - Manual verification of all user flows
   - Performance testing

4. **Gradual Deployment**
   - Deploy to staging first
   - Monitor for 24-48 hours
   - Deploy to production

---

## ✅ Success Metrics

### Code Quality Metrics

| Metric                  | Before | Target           | How to Measure        |
| ----------------------- | ------ | ---------------- | --------------------- |
| Lines of duplicate code | ~200   | <50              | Manual code review    |
| API call sites          | 8      | 0 (all via repo) | `grep -r "from.*api"` |
| Test coverage           | 0%     | 30%+             | Jest coverage report  |
| TypeScript errors       | 0      | 0                | `tsc --noEmit`        |
| ESLint warnings         | ?      | 0                | `npm run lint`        |

### Performance Metrics

| Metric                    | Before | Target | How to Measure         |
| ------------------------- | ------ | ------ | ---------------------- |
| Initial load time         | ~3s    | <2s    | Lighthouse             |
| Time to Interactive       | ~4s    | <3s    | Lighthouse             |
| Bundle size               | ~500KB | <400KB | `npm run build` output |
| API calls (cached)        | N      | N/2    | Network tab            |
| Memory usage (large data) | ~150MB | <100MB | Chrome Task Manager    |

### User Experience Metrics

| Metric                 | Before | Target | How to Measure |
| ---------------------- | ------ | ------ | -------------- |
| Form submission errors | ?      | 0      | User testing   |
| Load time perception   | Slow   | Fast   | User survey    |
| Cache hit rate         | 0%     | >70%   | Analytics      |

---

## 📚 Additional Resources

### Documentation to Create

1. **API Documentation**
   - JSDoc in all repository methods ✅
   - README for repository usage
   - Type definitions with examples

2. **Developer Guide**
   - How to add new repository methods
   - Caching strategy explanation
   - Testing guidelines

3. **Migration Guide** (This Document)
   - Step-by-step instructions
   - Rollback procedures
   - Common pitfalls

### Learning Resources

- [Repository Pattern Explained](https://martinfowler.com/eaaCatalog/repository.html)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [React Performance Optimization](https://react.dev/learn/render-and-commit)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)

---

## 🎯 Next Steps

### Immediate Actions (Today)

1. **Review this plan** with team/mentor
2. **Create feature branch** `refactor/repository-pattern`
3. **Start Phase 1** (Complete repository)
4. **Test thoroughly** after each step

### This Week

1. Complete Phases 1-3
2. Deploy to staging
3. Monitor for issues
4. User acceptance testing

### Next Week

1. Phase 4 (optimizations)
2. Deploy to production
3. Monitor performance metrics
4. Gather user feedback

---

## 📞 Questions & Support

**If you encounter issues:**

1. Check rollback plan above
2. Review testing checklist
3. Consult with mentor/team
4. Document learnings for future

**Common Questions:**

- Q: Can I skip caching in Phase 1?
  - A: Yes, but implement it before Phase 4
- Q: What if tests fail in Phase 2?
  - A: Rollback that component, debug, retry
- Q: Should I do all phases at once?
  - A: No! Complete and test each phase separately

---

## 📝 Change Log

| Date       | Phase    | Status         | Notes                                            |
| ---------- | -------- | -------------- | ------------------------------------------------ |
| 2025-12-21 | Planning | ✅ Complete    | Initial plan created                             |
| 2025-12-21 | Phase 1  | 🟡 60%         | Repository structure created, 4/7 tasks complete |
| TBD        | Phase 1  | ❌ Pending     | Complete remaining 3 tasks (30-45 min)           |
| TBD        | Phase 2  | ⚪ Not Started | Component migration                              |
| TBD        | Phase 3  | ⚪ Not Started | Cleanup                                          |
| TBD        | Phase 4  | ⚪ Not Started | Optimizations                                    |

---

## ✅ Completed Work Summary

### Architecture Improvements (Already Done)

- ✅ Created centralized constants layer (`src/constants/`)
- ✅ Built `httpClient.ts` with auth token support
- ✅ Organized types into `src/types/` (auth, submission)
- ✅ Created `AuthRepository` and migrated `AuthContext`
- ✅ Created `SubmissionRepository` class with 4 methods:
  - `submitSchedule()` - needs validation
  - `fetchSubmissionById()` - with 404 handling ✅
  - `getSubmissionsByLocation()` - with token validation & URL encoding ✅
  - `updateSubmission()` - with full validation ✅

### Next Immediate Steps (Phase 1 - 30-45 min)

1. ❌ Add `getAllSubmissions()` method (10 min)
2. ❌ Add validation to `submitSchedule()` (10 min)
3. ❌ Implement caching infrastructure (30 min)
4. ❌ Add JSDoc documentation (15 min)
5. ❌ Export singleton instance (5 min)
6. ❌ Rename file & cleanup (3 min)

---

**Version:** 1.1  
**Last Updated:** December 21, 2025  
**Status:** 🟡 Phase 1 In Progress - 60% Complete
