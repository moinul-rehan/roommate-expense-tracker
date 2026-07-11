/** "2026-07" -> "July, 2026" */
export function formatMonthKey(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1))
    .toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" })
    .replace(" ", ", ");
}
