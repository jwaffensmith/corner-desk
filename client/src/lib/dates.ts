// Calendar days are "YYYY-MM-DD" strings and months are "YYYY-MM", in the browser's time zone.
const pad = (n: number) => String(n).padStart(2, "0");
const toDay = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = (day: string) => new Date(`${day}T00:00:00`);

export const today = () => toDay(new Date());
export const dayOf = (timestamp: string) => toDay(new Date(timestamp));

export function formatDay(day: string): string {
  const date = parse(day);
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: date.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  });
}

export function formatMonth(month: string): string {
  const date = parse(`${month}-01`);
  return date.toLocaleDateString(undefined, {
    month: "long",
    year: date.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  });
}

// The `count` months ending with `last`, oldest first.
export function monthsThrough(last: string, count: number): string[] {
  const [year, month] = last.split("-").map(Number);
  return Array.from({ length: count }, (_, i) => toDay(new Date(year, month - count + i, 1)).slice(0, 7));
}

function shift(day: string, days: number): string {
  const date = parse(day);
  date.setDate(date.getDate() + days);
  return toDay(date);
}

// Weeks run Monday to Sunday.
const endOfWeek = (day: string) => shift(day, (7 - parse(day).getDay()) % 7);
export const startOfThisWeek = () => shift(endOfWeek(today()), -6);

// Anything already past due still belongs to this week.
export const dueThisWeek = (day: string | null) => day !== null && day <= endOfWeek(today());
