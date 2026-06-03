// Server-only: reads cookies. Do NOT import this in client components.
import { cookies } from "next/headers"
export { formatDate, addDays, diffDays } from "./date-utils"

export async function getToday(): Promise<Date> {
  const cookieStore = await cookies()

  // Dev override
  if (process.env.NEXT_PUBLIC_DEV_MODE === "true") {
    const testDate = cookieStore.get("test-date")
    if (testDate?.value) return new Date(testDate.value + "T00:00:00.000Z")
  }

  // The browser writes its local date as YYYY-MM-DD via TzSync.
  // Treat it as midnight UTC so formatDate() always returns the same string.
  const localDate = cookieStore.get("local-date")?.value
  if (localDate) return new Date(localDate + "T00:00:00.000Z")

  // Fallback: server UTC (only hits on the very first render before TzSync fires)
  return new Date()
}
