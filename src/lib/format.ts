/**
 * Format a person's display name from a profile-like object.
 * Falls back to the provided fallback string when both name parts are empty.
 */
export const fullName = (
  p?: { name?: string | null; last_name?: string | null } | null,
  fallback = ""
): string => {
  const parts = [p?.name, p?.last_name].filter(
    (v): v is string => typeof v === "string" && v.trim().length > 0
  );
  return parts.join(" ") || fallback;
};
