import type { StoreResult } from "@/types/kiosks/management";
import type { StoreDayOfWeek } from "@/types/tenants/management";

export type StoreOpeningState = "OPEN" | "CLOSED" | "UNRESTRICTED" | "UNKNOWN";

const DAY_BY_ENGLISH_NAME: Record<string, StoreDayOfWeek> = {
  Sunday: "Sunday",
  Monday: "Monday",
  Tuesday: "Tuesday",
  Wednesday: "Wednesday",
  Thursday: "Thursday",
  Friday: "Friday",
  Saturday: "Saturday",
};

const DAYS: StoreDayOfWeek[] = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function toMinute(value?: string | null): number | null {
  if (!value) return null;
  const [hour, minute] = value.split(":").map(Number);
  return Number.isInteger(hour) && Number.isInteger(minute)
    ? hour * 60 + minute
    : null;
}

function localClock(observedAt: Date, timeZone: string) {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      weekday: "long",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(observedAt);
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    const day = DAY_BY_ENGLISH_NAME[values.weekday];
    const hour = Number(values.hour);
    const minute = Number(values.minute);
    if (!day || !Number.isInteger(hour) || !Number.isInteger(minute)) return null;
    return { day, minute: hour * 60 + minute };
  } catch {
    return null;
  }
}

export function getStoreOpeningState(
  store: Pick<StoreResult, "openingHours" | "timeZone">,
  observedAt = new Date(),
): StoreOpeningState {
  if (store.openingHours.length === 0) return "UNRESTRICTED";

  const clock = localClock(observedAt, store.timeZone);
  if (!clock) return "UNKNOWN";

  const today = store.openingHours.find((day) => day.dayOfWeek === clock.day);
  const opensAt = toMinute(today?.opensAt);
  const closesAt = toMinute(today?.closesAt);
  if (today && !today.isClosed && opensAt !== null && closesAt !== null) {
    const isOpen =
      opensAt < closesAt
        ? clock.minute >= opensAt && clock.minute < closesAt
        : clock.minute >= opensAt;
    if (isOpen) return "OPEN";
  }

  const previousDay = DAYS[(DAYS.indexOf(clock.day) + DAYS.length - 1) % DAYS.length];
  const yesterday = store.openingHours.find(
    (day) => day.dayOfWeek === previousDay,
  );
  const previousOpensAt = toMinute(yesterday?.opensAt);
  const previousClosesAt = toMinute(yesterday?.closesAt);
  if (
    yesterday &&
    !yesterday.isClosed &&
    previousOpensAt !== null &&
    previousClosesAt !== null &&
    previousOpensAt > previousClosesAt &&
    clock.minute < previousClosesAt
  ) {
    return "OPEN";
  }

  return "CLOSED";
}
