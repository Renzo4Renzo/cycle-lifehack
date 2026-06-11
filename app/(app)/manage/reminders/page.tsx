import { getAllReminders } from "@/lib/queries/manage"
import { getToday, formatDate } from "@/lib/date"
import ReminderList from "@/components/reminder-list"

export default async function ManageRemindersPage() {
  const reminders = await getAllReminders()
  const todayStr = formatDate(await getToday())
  return <ReminderList reminders={reminders} todayStr={todayStr} />
}
