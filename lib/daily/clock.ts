// The daily rollover rule lives here and NOWHERE else: 03:00 UTC, whatever the
// player's timezone. Subtracting 3h before the `floor` is enough — `Date.now()`
// is an absolute instant, so no timezone or DST logic belongs in this file.

export const ROTATION_HOUR_UTC = 3;
export const DAY_MS = 86_400_000;
const OFFSET_MS = ROTATION_HOUR_UTC * 3_600_000;

// Current game-day number. This is THE value that identifies a day: everything
// else (draw, progress, streak) refers to it.
export function dayIndex(now: number = Date.now()): number {
  return Math.floor((now - OFFSET_MS) / DAY_MS);
}

// Milliseconds until the next rollover (drives the home page countdown).
export function msUntilNextRotation(now: number = Date.now()): number {
  return (dayIndex(now) + 1) * DAY_MS + OFFSET_MS - now;
}

// Day the first puzzle was served. Written as a date rather than a raw index so
// the number stays checkable by eye.
export const LAUNCH_DAY = dayIndex(Date.UTC(2026, 7, 15, ROTATION_HOUR_UTC));

// The number a player sees in a shared result. `dayIndex` is around 20 000 and
// reads like a build number; a calendar date would be ambiguous either side of
// the 03:00 rollover.
export function puzzleNumber(day: number): number {
  return day - LAUNCH_DAY + 1;
}
