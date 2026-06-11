import { getScheduleOffsetMinutes } from "@/lib/date"
import TimezoneForm from "@/components/timezone-form"

export default async function TimezonePage() {
  const currentOffset = await getScheduleOffsetMinutes()
  return <TimezoneForm currentOffset={currentOffset} />
}
