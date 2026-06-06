import { supabaseServer } from "@/lib/supabase"
import TimezoneForm from "@/components/timezone-form"

export default async function TimezonePage() {
  const db = supabaseServer()
  const { data } = await db.from("settings").select("schedule_tz_offset").single()
  const currentOffset = data?.schedule_tz_offset ?? -300

  return <TimezoneForm currentOffset={currentOffset} />
}
