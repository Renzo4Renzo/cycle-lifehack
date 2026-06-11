// Server-only: reads DB / cookies. Do NOT import this in client components.
import { cache } from "react"
import { cookies } from "next/headers"
import { supabaseServer } from "./supabase"
import { shiftedTodayUTC } from "./date-utils"
export { formatDate, addDays, diffDays } from "./date-utils"

export const getScheduleOffsetMinutes = cache(async (): Promise<number> => {
  const db = supabaseServer()
  const { data } = await db.from("settings").select("schedule_tz_offset").single()
  return data?.schedule_tz_offset ?? -300
})

export const getToday = cache(async (): Promise<Date> => {
  // Dev override via cookie
  if (process.env.NEXT_PUBLIC_DEV_MODE === "true") {
    const cookieStore = await cookies()
    const testDate = cookieStore.get("test-date")
    if (testDate?.value) return new Date(testDate.value + "T00:00:00.000Z")
  }

  const offsetMinutes = await getScheduleOffsetMinutes()
  return shiftedTodayUTC(offsetMinutes)
})
