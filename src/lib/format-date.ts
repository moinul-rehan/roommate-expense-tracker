/** "2026-07-01" or a Date -> "1 July, 2026" */
export function formatDate(input: string | Date): string {
  let year: number;
  let monthIndex: number;
  let day: number;

  if (typeof input === "string") {
    const [y, m, d] = input.slice(0, 10).split("-").map(Number);
    year = y;
    monthIndex = m - 1;
    day = d;
  } else {
    year = input.getFullYear();
    monthIndex = input.getMonth();
    day = input.getDate();
  }

  const monthName = new Date(Date.UTC(year, monthIndex, 1)).toLocaleString("en-US", {
    month: "long",
    timeZone: "UTC",
  });

  return `${day} ${monthName}, ${year}`;
}

/** A timestamp -> "1 July, 2026, 3:45 PM" */
export function formatDateTime(input: string | Date): string {
  const date = typeof input === "string" ? new Date(input) : input;
  const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${formatDate(date)}, ${time}`;
}
