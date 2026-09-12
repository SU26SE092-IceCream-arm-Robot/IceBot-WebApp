export const DEFAULT_TIME_ZONE = "Asia/Ho_Chi_Minh";

export const TIME_ZONE_SUGGESTIONS = [
  { value: DEFAULT_TIME_ZONE, label: "Việt Nam (UTC+7)" },
  { value: "Asia/Bangkok", label: "Thái Lan (UTC+7)" },
  { value: "Asia/Singapore", label: "Singapore (UTC+8)" },
  { value: "Asia/Tokyo", label: "Nhật Bản (UTC+9)" },
  { value: "UTC", label: "UTC" },
] as const;

export function isValidIanaTimeZone(value: string): boolean {
  const normalized = value.trim();
  if (!normalized) return false;

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: normalized }).format(
      new Date(0),
    );
    return true;
  } catch {
    return false;
  }
}
