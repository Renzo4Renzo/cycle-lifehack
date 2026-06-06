// Server-only: reads DB / cookies. Do NOT import this in client components.
import { cookies } from "next/headers"
import { supabaseServer } from "./supabase"
export { formatDate, addDays, diffDays } from "./date-utils"

async function getScheduleOffsetMinutes(): Promise<number> {
  const db = supabaseServer()
  const { data } = await db.from("settings").select("schedule_tz_offset").single()
  return data?.schedule_tz_offset ?? -300
}

export async function getToday(): Promise<Date> {
  // Dev override via cookie
  if (process.env.NEXT_PUBLIC_DEV_MODE === "true") {
    const cookieStore = await cookies()
    const testDate = cookieStore.get("test-date")
    if (testDate?.value) return new Date(testDate.value + "T00:00:00.000Z")
  }

  const offsetMinutes = await getScheduleOffsetMinutes()

  // Shift the current UTC instant by the user's preferred offset, then extract
  // the Y/M/D in that shifted "local" frame and return midnight UTC of that date.
  const now = new Date()
  const shifted = new Date(now.getTime() + offsetMinutes * 60 * 1000)
  return new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()))
}
