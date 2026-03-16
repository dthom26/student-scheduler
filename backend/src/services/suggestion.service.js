import { OPENAI_API_KEY, ANTHROPIC_API_KEY } from "../config/env.js";

// All time slots in order — used for index-based buffer math
const ALL_TIMES = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00",
];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

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
 * @param {Array} submissions  - Array of submission documents from MongoDB
 * @param {Object} rules       - ScheduleRules document (or defaults object)
 * @returns {Array}            - Assignment[] { day, time, studentId }
 */
function runAlgorithm(submissions, rules) {
  const { maxHoursPerWeek } = rules;
  const maxSlots = maxHoursPerWeek * 2; // each slot = 0.5h

  // Weekly slot counter per student
  const weeklySlots = {};
  for (const sub of submissions) {
    weeklySlots[sub.studentId] = 0;
  }

  // Pre-build blocked sets for every student × day
  const blockedCache = {};
  for (const sub of submissions) {
    blockedCache[sub.studentId] = {};
    for (const day of DAYS) {
      blockedCache[sub.studentId][day] = buildBlockedSet(sub.schedule, day, rules);
    }
  }

  const assignments = [];

  for (const day of DAYS) {
    // Track consecutive run: studentId → last assigned slotIdx on this day
    const lastSlotForStudent = {};

    for (let timeIdx = 0; timeIdx < ALL_TIMES.length; timeIdx++) {
      // Build list of eligible students with scores for this slot
      const candidates = [];

      for (const sub of submissions) {
        if (weeklySlots[sub.studentId] >= maxSlots) continue;
        if (blockedCache[sub.studentId][day].has(timeIdx)) continue;

        const score = slotScore(sub.schedule, day, timeIdx, rules);
        if (score === 0) continue;

        // Contiguity bonus: slightly prefer continuing the same student's shift
        const continuityBonus =
          lastSlotForStudent[sub.studentId] === timeIdx - 1 ? 0.5 : 0;

        candidates.push({
          studentId: sub.studentId,
          score: score + continuityBonus,
          hoursAssigned: weeklySlots[sub.studentId],
        });
      }

      if (candidates.length === 0) continue;

      // Sort: fewest hours first (fairness), then highest score
      candidates.sort((a, b) => {
        if (a.hoursAssigned !== b.hoursAssigned) return a.hoursAssigned - b.hoursAssigned;
        return b.score - a.score;
      });

      const chosen = candidates[0];
      assignments.push({ day, time: ALL_TIMES[timeIdx], studentId: chosen.studentId });
      weeklySlots[chosen.studentId]++;
      lastSlotForStudent[chosen.studentId] = timeIdx;
    }
  }

  return removeMicroShifts(assignments, rules.minShiftLength);
}

/**
 * Optional LLM refinement pass.
 * Only runs when OPENAI_API_KEY or ANTHROPIC_API_KEY is set.
 * Sends proposed assignments + student notes + manager customNotes to the LLM
 * and requests a JSON patch of adjustments.
 *
 * If the LLM call fails for any reason the original assignments are returned unchanged.
 */
async function runLLMPass(assignments, submissions, rules) {
  const hasOpenAI = !!OPENAI_API_KEY;
  const hasAnthropic = !!ANTHROPIC_API_KEY;

  if (!hasOpenAI && !hasAnthropic) return assignments;

  // Build a human-readable summary of proposed shifts per student
  const studentNotes = submissions
    .filter((s) => s.notes && s.notes.trim())
    .map((s) => `- ${s.studentName} (${s.studentId}): "${s.notes.trim()}"`)
    .join("\n");

  if (!studentNotes && !rules.customNotes?.trim()) return assignments;

  // Summarise the proposed schedule for the prompt
  const scheduleSummary = DAYS.map((day) => {
    const daySlots = assignments
      .filter((a) => a.day === day)
      .sort((a, b) => timeToIdx(a.time) - timeToIdx(b.time));
    if (daySlots.length === 0) return null;
    const byStudent = {};
    for (const a of daySlots) {
      (byStudent[a.studentId] ??= []).push(a.time);
    }
    const lines = Object.entries(byStudent).map(([sid, times]) => {
      const name = submissions.find((s) => s.studentId === sid)?.studentName ?? sid;
      return `  ${name}: ${times[0]} – ${times[times.length - 1]}`;
    });
    return `${day}:\n${lines.join("\n")}`;
  })
    .filter(Boolean)
    .join("\n\n");

  const prompt = `You are a scheduling assistant. Below is an automatically generated work schedule and some context about the students. Your job is to identify any assignments that conflict with student notes or the manager's custom rules, and return a minimal list of slots to REMOVE (not reassign — just remove).

Respond with ONLY valid JSON in this exact format, no explanation:
{ "remove": [{ "day": "Mon", "time": "08:00", "studentId": "abc123" }] }
If there are no conflicts, respond: { "remove": [] }

--- PROPOSED SCHEDULE ---
${scheduleSummary}

--- STUDENT NOTES ---
${studentNotes || "None provided."}

--- MANAGER RULES (custom notes) ---
${rules.customNotes?.trim() || "None provided."}`;

  try {
    let responseText;

    if (hasOpenAI) {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0,
          max_tokens: 512,
        }),
      });
      const data = await res.json();
      responseText = data.choices?.[0]?.message?.content ?? "";
    } else {
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
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await res.json();
      responseText = data.content?.[0]?.text ?? "";
    }

    // Extract JSON from response (strip any accidental markdown fences)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return assignments;

    const patch = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(patch.remove) || patch.remove.length === 0) return assignments;

    // Apply removals
    const removeSet = new Set(
      patch.remove.map((r) => `${r.day}|${r.time}|${r.studentId}`)
    );
    return assignments.filter(
      (a) => !removeSet.has(`${a.day}|${a.time}|${a.studentId}`)
    );
  } catch (err) {
    // LLM pass failure is non-fatal — return original algorithm result
    console.error("LLM pass failed, returning algorithm result:", err.message);
    return assignments;
  }
}

/**
 * Public entry point.
 * Runs the deterministic algorithm then optionally refines with LLM.
 *
 * @param {Array}  submissions - Submission documents for a location
 * @param {Object} rules       - ScheduleRules (or defaults)
 * @returns {Promise<Array>}   - Assignment[] { day, time, studentId }
 */
export async function generateSuggestion(submissions, rules) {
  const algorithmResult = runAlgorithm(submissions, rules);
  return runLLMPass(algorithmResult, submissions, rules);
}
