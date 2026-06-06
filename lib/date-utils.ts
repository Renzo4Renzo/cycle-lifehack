// Pure date utilities — safe to import in both client and server code

export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0]
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setUTCDate(d.getUTCDate() + days)
  return d
}

export function diffDays(from: Date, to: Date): number {
  return Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
}
