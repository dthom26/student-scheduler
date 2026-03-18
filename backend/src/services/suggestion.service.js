import { OPENAI_API_KEY, ANTHROPIC_API_KEY, HF_API_TOKEN, GROQ_API_KEY } from "../config/env.js";

// All time slots in order — used for index-based buffer math
const ALL_TIMES = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00",
];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

/**
 * Empty constraint object — used when no custom notes exist or AI parsing fails.
 * @typedef {Object} AiConstraints
 * @property {string[]} excludeStudentIds     - Never schedule these students this week
 * @property {Object}   allowedDays           - { [studentId]: string[] } restrict to these days only
 * @property {Object}   studentMaxHours       - { [studentId]: number } per-student max hour cap override
 * @property {Object}   studentMinHours       - { [studentId]: number } per-student min hours target
 * @property {number|null} globalMinHours     - Minimum hours target applied to ALL students
 * @property {string[]} deprioritizeStudentIds - Give these students lower scheduling priority
 */
const EMPTY_CONSTRAINTS = {
  excludeStudentIds: [],
  allowedDays: {},
  studentMaxHours: {},
  studentMinHours: {},
  globalMinHours: null,
  deprioritizeStudentIds: [],
};

/**
 * Converts a time string "HH:MM" to a slot index within ALL_TIMES.
 * Returns -1 if not found.
 */
function timeToIdx(time) {
  return ALL_TIMES.indexOf(time);
}

/**
 * Builds a set of blocked slot indices for a student on a given day.
 * A slot is blocked if:
 *   - Its type is "notAvailable"
 *   - Its type is "class" (always blocked regardless of blockDuringClass rule,
 *     since the buffer logic covers the class slot itself too)
 *   - It falls within bufferBeforeClass minutes before any class slot
 *   - It falls within bufferAfterClass minutes after any class slot
 */
function buildBlockedSet(studentSchedule, day, rules) {
  const { bufferBeforeClass, bufferAfterClass } = rules;
  const slotsPerMinute = 1 / 30; // each slot = 30 min
  const bufferBeforeSlots = Math.ceil(bufferBeforeClass * slotsPerMinute);
  const bufferAfterSlots = Math.ceil(bufferAfterClass * slotsPerMinute);

  const blocked = new Set();
  const classIndices = [];

  for (const slot of studentSchedule) {
    if (slot.day !== day) continue;
    const idx = timeToIdx(slot.time);
    if (idx === -1) continue;

    if (slot.type === "notAvailable") {
      blocked.add(idx);
    }
    if (slot.type === "class") {
      blocked.add(idx);
      classIndices.push(idx);
    }
  }

  // Expand blocked window around each class slot
  for (const classIdx of classIndices) {
    for (let i = 1; i <= bufferBeforeSlots; i++) {
      if (classIdx - i >= 0) blocked.add(classIdx - i);
    }
    for (let i = 1; i <= bufferAfterSlots; i++) {
      if (classIdx + i < ALL_TIMES.length) blocked.add(classIdx + i);
    }
  }

  return blocked;
}

/**
 * Returns the score for a student at a given slot (0 = ineligible).
 * preferPreferredSlots=true: preferred=2, available=1
 * preferPreferredSlots=false: available=1, preferred=1 (no bonus)
 */
function slotScore(studentSchedule, day, timeIdx, rules) {
  const time = ALL_TIMES[timeIdx];
  const slot = studentSchedule.find((s) => s.day === day && s.time === time);
  if (!slot) return 0;
  if (slot.type === "preferred") return rules.preferPreferredSlots ? 2 : 1;
  if (slot.type === "available") return 1;
  return 0; // class / notAvailable — shouldn't reach here after blocked check
}

/**
 * Removes contiguous blocks that are shorter than minShiftLength hours
 * (i.e. fewer than minShiftLength * 2 consecutive slots).
 */
function removeMicroShifts(assignments, minShiftLength) {
  const minSlots = minShiftLength * 2;
  if (minSlots <= 1) return assignments;

  const result = [];

  for (const day of DAYS) {
    const daySorted = assignments
      .filter((a) => a.day === day)
      .sort((a, b) => timeToIdx(a.time) - timeToIdx(b.time));

    if (daySorted.length === 0) continue;

    // Group into contiguous blocks per student
    const blocks = [];
    for (const assignment of daySorted) {
      const last = blocks[blocks.length - 1];
      if (
        last &&
        last.studentId === assignment.studentId &&
        timeToIdx(assignment.time) === timeToIdx(last.slots[last.slots.length - 1].time) + 1
      ) {
        last.slots.push(assignment);
      } else {
        blocks.push({ studentId: assignment.studentId, slots: [assignment] });
      }
    }

    for (const block of blocks) {
      if (block.slots.length >= minSlots) {
        result.push(...block.slots);
      }
      // blocks shorter than minSlots are silently dropped
    }
  }

  return result;
}

/**
 * Core deterministic scheduling algorithm.
 *
 * @param {Array}          submissions    - Array of submission documents from MongoDB
 * @param {Object}         rules          - ScheduleRules document (or defaults object)
 * @param {AiConstraints}  aiConstraints  - Parsed constraints from AI (or EMPTY_CONSTRAINTS)
 * @returns {Array}                       - Assignment[] { day, time, studentId }
 */
function runAlgorithm(submissions, rules, aiConstraints = EMPTY_CONSTRAINTS) {
  const { excludeStudentIds, allowedDays, studentMaxHours, studentMinHours, globalMinHours, deprioritizeStudentIds } = aiConstraints;
  const excludeSet = new Set(excludeStudentIds ?? []);
  const deprioritizeSet = new Set(deprioritizeStudentIds ?? []);

  // Filter out excluded students
  const activeSubs = submissions.filter((s) => !excludeSet.has(s.studentId));

  const maxSlots = rules.maxHoursPerWeek * 2; // each slot = 0.5h
  const minSlots = (rules.minHoursPerWeek ?? 0) * 2;
  const maxDays = rules.maxDaysPerWeek ?? 5;
  const maxShiftSlots = rules.maxShiftLength > 0 ? rules.maxShiftLength * 2 : Infinity;

  // Closing shift: last 4 hours of the day (16:00 onward)
  const closingStartIdx = timeToIdx("16:00");

  // Weekly slot counter per student (respects per-student overrides)
  const weeklySlots = {};
  const weeklyMaxSlots = {};
  const weeklyMinSlots = {};
  for (const sub of activeSubs) {
    weeklySlots[sub.studentId] = 0;
    const overrideMax = studentMaxHours?.[sub.studentId];
    weeklyMaxSlots[sub.studentId] = overrideMax != null ? overrideMax * 2 : maxSlots;
    const overrideMin = studentMinHours?.[sub.studentId] ?? globalMinHours;
    // Honour the higher of the form-level minHoursPerWeek and any AI override
    const effectiveMin = Math.max(minSlots, overrideMin != null ? overrideMin * 2 : 0);
    weeklyMinSlots[sub.studentId] = effectiveMin;
  }

  // Days each student has already been scheduled (for spread bonus + maxDays enforcement)
  const daysWorked = {};
  for (const sub of activeSubs) daysWorked[sub.studentId] = new Set();

  // Per-student per-day consecutive slot counter (for maxShiftLength enforcement)
  const currentShiftSlots = {};
  for (const sub of activeSubs) currentShiftSlots[sub.studentId] = 0;

  // Pre-build blocked sets for every student × day
  const blockedCache = {};
  for (const sub of activeSubs) {
    blockedCache[sub.studentId] = {};
    for (const day of DAYS) {
      blockedCache[sub.studentId][day] = buildBlockedSet(sub.schedule, day, rules);
    }
  }

  const assignments = [];

  for (const day of DAYS) {
    const lastSlotForStudent = {};
    // Reset per-day shift counter
    for (const sub of activeSubs) currentShiftSlots[sub.studentId] = 0;

    for (let timeIdx = 0; timeIdx < ALL_TIMES.length; timeIdx++) {
      const candidates = [];

      for (const sub of activeSubs) {
        if (weeklySlots[sub.studentId] >= weeklyMaxSlots[sub.studentId]) continue;

        // Respect max days per week
        if (!daysWorked[sub.studentId].has(day) && daysWorked[sub.studentId].size >= maxDays) continue;

        // Respect day restrictions from AI (if specified for this student)
        const allowed = allowedDays?.[sub.studentId];
        if (allowed && !allowed.includes(day)) continue;

        if (blockedCache[sub.studentId][day].has(timeIdx)) continue;

        // Enforce max shift length: if continuing a shift would exceed the limit, skip
        const isContinuing = lastSlotForStudent[sub.studentId] === timeIdx - 1;
        if (isContinuing && currentShiftSlots[sub.studentId] >= maxShiftSlots) continue;

        const score = slotScore(sub.schedule, day, timeIdx, rules);
        if (score === 0) continue;

        // Continuity bonus: prefer extending an existing shift
        const continuityBonus = isContinuing ? 0.5 : 0;

        // Day-spread bonus: slightly prefer students not yet working today
        const spreadBonus = !daysWorked[sub.studentId].has(day) ? 0.3 : 0;

        // Minimum hours boost: strongly prioritise students below their minimum target
        const belowMin = weeklySlots[sub.studentId] < (weeklyMinSlots[sub.studentId] ?? 0);
        const minHoursBoost = belowMin ? 3 : 0;

        // Closing shift preference: track whether this student has closing availability
        // (used as a first-class sort key so it isn't buried by hoursAssigned tiebreaking)
        const isClosingSlot = timeIdx >= closingStartIdx;
        const hasClosingAvailability = rules.preferClosingShifts && isClosingSlot;

        // Shift cohesion: once a student starts a shift, keep them going for the entire
        // contiguous available window — not just until minShiftLength. Without this,
        // hoursAssigned fairness sorting interrupts mid-shift (e.g. Sarah's preferred→available
        // block from 12:30–18:00 gets split when Jane has fewer hours at 14:30), causing
        // fragments that removeMicroShifts then prunes entirely.
        const inActiveShift = isContinuing;

        // Deprioritize penalty from AI
        const deprioritizePenalty = deprioritizeSet.has(sub.studentId) ? -1 : 0;

        candidates.push({
          studentId: sub.studentId,
          score: score + continuityBonus + spreadBonus + minHoursBoost + deprioritizePenalty,
          hoursAssigned: weeklySlots[sub.studentId],
          belowMin,
          prefersClosing: hasClosingAvailability,
          inActiveShift,
        });
      }

      if (candidates.length === 0) {
        // Reset shift counter for any student whose shift just ended
        for (const sub of activeSubs) {
          if (lastSlotForStudent[sub.studentId] === timeIdx - 1) {
            currentShiftSlots[sub.studentId] = 0;
          }
        }
        continue;
      }

      // Sort: below-minimum first, then in-progress shifts (shift cohesion), then closing preference, then fewest hours, then highest score
      candidates.sort((a, b) => {
        if (a.belowMin !== b.belowMin) return a.belowMin ? -1 : 1;
        if (a.inActiveShift !== b.inActiveShift) return a.inActiveShift ? -1 : 1;
        if (a.prefersClosing !== b.prefersClosing) return a.prefersClosing ? -1 : 1;
        if (a.hoursAssigned !== b.hoursAssigned) return a.hoursAssigned - b.hoursAssigned;
        return b.score - a.score;
      });

      const chosen = candidates[0];
      const wasContinuing = lastSlotForStudent[chosen.studentId] === timeIdx - 1;

      assignments.push({ day, time: ALL_TIMES[timeIdx], studentId: chosen.studentId });
      weeklySlots[chosen.studentId]++;
      daysWorked[chosen.studentId].add(day);
      lastSlotForStudent[chosen.studentId] = timeIdx;

      // Track consecutive shift slots
      currentShiftSlots[chosen.studentId] = wasContinuing
        ? currentShiftSlots[chosen.studentId] + 1
        : 1;

      // Reset any other student whose run just broke
      for (const sub of activeSubs) {
        if (sub.studentId !== chosen.studentId && lastSlotForStudent[sub.studentId] === timeIdx - 1) {
          currentShiftSlots[sub.studentId] = 0;
        }
      }
    }
  }

  return removeMicroShifts(assignments, rules.minShiftLength);
}

/**
 * Builds the AI prompt to parse custom notes into structured constraints.
 * The AI's only job is to translate free-text manager instructions into a
 * well-defined JSON object. The heuristic enforces everything.
 */
function buildConstraintPrompt(customNotes, submissions) {
  const studentList = submissions
    .map((s) => `- ID: "${s.studentId}"  Name: "${s.studentName}"`)
    .join("\n");

  return {
    system: `You are a scheduling assistant. Your only task is to parse manager instructions into a structured JSON constraint object. You must respond with valid JSON and nothing else.

The JSON must have exactly this shape:
{
  "excludeStudentIds": [],
  "allowedDays": {},
  "studentMaxHours": {},
  "studentMinHours": {},
  "globalMinHours": null,
  "deprioritizeStudentIds": []
}

Field meanings:
- excludeStudentIds: array of studentId strings who should NOT be scheduled at all this week
- allowedDays: object mapping studentId to an array of days they are allowed to work (e.g. {"id1": ["Mon","Wed","Fri"]}). Only include students who have day restrictions.
- studentMaxHours: object mapping studentId to a number — overrides their maximum hours this week
- studentMinHours: object mapping studentId to a number — each named student should work AT LEAST this many hours
- globalMinHours: a single number if the instruction applies a minimum to ALL students (e.g. "everyone should work at least 10 hours"). Set to null if not applicable.
- deprioritizeStudentIds: array of studentId strings who should be scheduled last / minimally

Valid days: Mon, Tue, Wed, Thu, Fri
If a field has no entries, use an empty array, empty object, or null.
Match student names to IDs case-insensitively — do your best to identify the student.
If an instruction says \"each person\", \"everyone\", \"all students\", or similar, use globalMinHours/globalMaxHours rather than listing every student individually.`,
    user: `STUDENTS:\n${studentList}\n\nMANAGER INSTRUCTIONS:\n${customNotes.trim()}\n\nRespond with the JSON constraint object only.`,
  };
}

/**
 * Calls the Groq API with system + user messages and forces JSON output.
 */
async function callGroq(systemPrompt, userPrompt) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0,
      max_tokens: 512,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Groq API error ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

/**
 * Calls the OpenAI API with system + user messages and forces JSON output.
 */
async function callOpenAI(systemPrompt, userPrompt) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0,
      max_tokens: 512,
      response_format: { type: "json_object" },
    }),
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

/**
 * Calls the Anthropic API with system + user messages.
 */
async function callAnthropic(systemPrompt, userPrompt) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-20240307",
      max_tokens: 512,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });
  const data = await res.json();
  return data.content?.[0]?.text ?? "";
}

/**
 * Validates and normalises the raw constraint object returned by the AI.
 * Any invalid or unrecognised fields are silently dropped so the heuristic
 * never receives corrupt data.
 */
function validateConstraints(raw, submissions) {
  const validIds = new Set(submissions.map((s) => s.studentId));
  const validDaySet = new Set(DAYS);

  const excludeStudentIds = (raw.excludeStudentIds ?? [])
    .filter((id) => typeof id === "string" && validIds.has(id));

  const allowedDays = {};
  for (const [studentId, days] of Object.entries(raw.allowedDays ?? {})) {
    if (!validIds.has(studentId)) continue;
    const validDays = (days ?? []).filter((d) => validDaySet.has(d));
    if (validDays.length > 0) allowedDays[studentId] = validDays;
  }

  const studentMaxHours = {};
  for (const [studentId, hours] of Object.entries(raw.studentMaxHours ?? {})) {
    if (!validIds.has(studentId)) continue;
    const h = Number(hours);
    if (h > 0 && h <= 40) studentMaxHours[studentId] = h;
  }

  const studentMinHours = {};
  for (const [studentId, hours] of Object.entries(raw.studentMinHours ?? {})) {
    if (!validIds.has(studentId)) continue;
    const h = Number(hours);
    if (h > 0 && h <= 40) studentMinHours[studentId] = h;
  }

  const rawGlobal = raw.globalMinHours;
  const globalMinHours = rawGlobal != null && Number(rawGlobal) > 0 && Number(rawGlobal) <= 40
    ? Number(rawGlobal)
    : null;

  const deprioritizeStudentIds = (raw.deprioritizeStudentIds ?? [])
    .filter((id) => typeof id === "string" && validIds.has(id));

  return { excludeStudentIds, allowedDays, studentMaxHours, studentMinHours, globalMinHours, deprioritizeStudentIds };
}

/**
 * Uses the LLM to parse customNotes into an AiConstraints object.
 * Returns EMPTY_CONSTRAINTS on any failure so the heuristic always runs cleanly.
 */
async function parseNotesWithAI(customNotes, submissions) {
  const hasOpenAI = !!OPENAI_API_KEY;
  const hasAnthropic = !!ANTHROPIC_API_KEY;
  const hasGroq = !!GROQ_API_KEY;

  if (!hasOpenAI && !hasAnthropic && !hasGroq) return EMPTY_CONSTRAINTS;

  const { system, user } = buildConstraintPrompt(customNotes, submissions);

  try {
    let responseText;
    if (hasOpenAI) {
      responseText = await callOpenAI(system, user);
    } else if (hasAnthropic) {
      responseText = await callAnthropic(system, user);
    } else {
      responseText = await callGroq(system, user);
    }

    // Extract first JSON object from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn("[AI] No JSON in response, using empty constraints.");
      return EMPTY_CONSTRAINTS;
    }

    const raw = JSON.parse(jsonMatch[0]);
    const constraints = validateConstraints(raw, submissions);
    console.log("[AI] Parsed constraints:", JSON.stringify(constraints));
    return constraints;
  } catch (err) {
    console.error("[AI] Failed to parse notes, using empty constraints:", err.message);
    return EMPTY_CONSTRAINTS;
  }
}

/**
 * Public entry point.
 *
 * 1. If customNotes exist and an LLM key is configured, ask the AI to parse
 *    the notes into structured constraints.
 * 2. Run the deterministic heuristic with those constraints applied.
 *    The heuristic always has final authority over the schedule.
 *
 * @param {Array}  submissions - Submission documents for a location
 * @param {Object} rules       - ScheduleRules (or defaults)
 * @returns {Promise<Array>}   - Assignment[] { day, time, studentId }
 */
export async function generateSuggestion(submissions, rules) {
  const hasCustomNotes = !!rules.customNotes?.trim();
  const hasLLM = !!(OPENAI_API_KEY || ANTHROPIC_API_KEY || GROQ_API_KEY);

  let aiConstraints = EMPTY_CONSTRAINTS;
  if (hasCustomNotes && hasLLM) {
    aiConstraints = await parseNotesWithAI(rules.customNotes, submissions);
  }

  const assignments = runAlgorithm(submissions, rules, aiConstraints);
  console.log(`[Schedule] Generated ${assignments.length} assignments for ${submissions.length} students.`);
  return assignments;
}
