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

  // Use the browser's timezone (set by TzSync component) so the date is
  // always correct for the user's local time, not the server's UTC clock.
  const tz = cookieStore.get("tz")?.value
  if (tz) {
    // en-CA locale returns YYYY-MM-DD, which is what we need for string comparisons
    const localDateStr = new Date().toLocaleDateString("en-CA", { timeZone: decodeURIComponent(tz) })
    return new Date(localDateStr + "T00:00:00.000Z")
  }

  return new Date()
}
