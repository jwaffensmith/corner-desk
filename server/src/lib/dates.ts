export function localDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Calendar days travel as "YYYY-MM-DD" and are stored in DATE columns, which Prisma reads
// and writes as UTC midnight.
export const fromDay = (day: string) => new Date(`${day}T00:00:00Z`);
export const toDay = (date: Date) => date.toISOString().slice(0, 10);
