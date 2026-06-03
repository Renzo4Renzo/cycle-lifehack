// Server-only: reads cookies. Do NOT import this in client components.
import { cookies } from "next/headers"
export { formatDate, addDays, diffDays } from "./date-utils"

export async function getToday(): Promise<Date> {
  if (process.env.NEXT_PUBLIC_DEV_MODE === "true") {
    const cookieStore = await cookies()
    const testDate = cookieStore.get("test-date")
    if (testDate?.value) return new Date(testDate.value)
  }
  return new Date()
}
