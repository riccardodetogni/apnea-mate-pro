/**
 * Format a person's display name from a profile-like object.
 * Falls back to the provided fallback string when both name parts are empty.
 * Avoids duplicating the surname when `name` already contains the full name
 * (legacy profiles stored "Mario Rossi" in `name` and "Rossi" in `last_name`).
 */
export const fullName = (
  p?: { name?: string | null; last_name?: string | null } | null,
  fallback = ""
): string => {
  const first = (p?.name ?? "").trim();
  const last = (p?.last_name ?? "").trim();
  if (!last) return first || fallback;
  if (!first) return last || fallback;
  if (first.toLowerCase().endsWith(last.toLowerCase())) return first;
  return `${first} ${last}`;
};

/**
 * Build the "brevetto" (certification) label for a user, mirroring the
 * database function public.brevetto_label_of():
 * instructor label first, otherwise the approved certification.
 */
export const brevettoLabel = (
  profile?: { instructor_brevetto_label?: string | null } | null,
  certification?: {
    agency?: string | null;
    level?: string | null;
    certification_id?: string | null;
    status?: string | null;
  } | null
): string | null => {
  const instructor = (profile?.instructor_brevetto_label ?? "").trim();
  if (instructor) return instructor;
  if (!certification || certification.status !== "approved") return null;
  const agency = (certification.agency ?? "").trim();
  if (!agency) return null;
  const level = (certification.level ?? "").trim();
  const num = (certification.certification_id ?? "").trim();
  return [agency, level, num ? `n. ${num}` : ""].filter(Boolean).join(" · ");
};

