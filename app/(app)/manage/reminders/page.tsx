import { getAllReminders } from "@/lib/queries/manage"
import ReminderList from "@/components/reminder-list"

export default async function ManageRemindersPage() {
  const reminders = await getAllReminders()
  return <ReminderList reminders={reminders} />
}
