/** Display identity used across the nav, dashboard, and tables — last name
 * first, falling back to first name. Full name is reserved for the profile
 * page itself. Client-safe (no `server-only` import) so it can be used from
 * both Server and Client Components. */
export function getDisplayName(profile: { first_name: string; last_name: string | null }) {
  return profile.last_name || profile.first_name || "Member";
}

export function getFullName(profile: { first_name: string; last_name: string | null }) {
  return [profile.first_name, profile.last_name].filter(Boolean).join(" ");
}
