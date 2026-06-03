import { getSchedule } from "@/lib/queries/schedule"
import { getToday, formatDate } from "@/lib/date"
import { getCategories } from "@/lib/categories"
import BlockCard from "@/components/block-card"
import ReminderCard from "@/components/reminder-card"
import { notFound } from "next/navigation"

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>
}) {
  const { category } = await params
  if (!getCategories().includes(category)) notFound()

  const today = await getToday()
  const todayStr = formatDate(today)
  const { blocks, reminders } = await getSchedule(category, today)

  const dateLabel = today.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  })

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 pt-6">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xl font-semibold capitalize">{category}</h2>
        <span className="text-sm font-medium text-muted-foreground">{dateLabel}</span>
      </div>

      {reminders.length > 0 && (
        <section className="space-y-2">
          {reminders.map((reminder) => (
            <ReminderCard
              key={reminder.id}
              reminder={reminder}
              todayStr={todayStr}
              category={category}
            />
          ))}
        </section>
      )}

      <section className="space-y-4">
        {blocks.map((block) => (
          <BlockCard
            key={block.id}
            block={block}
            todayStr={todayStr}
            category={category}
          />
        ))}
        {blocks.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No blocks yet. Add one in{" "}
            <a href="/manage/blocks" className="underline">
              Manage
            </a>
            .
          </p>
        )}
      </section>
    </div>
  )
}
