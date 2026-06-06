"use client"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { usePathname, useRouter } from "next/navigation"

export default function ManageLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  const tab = pathname.includes("reminders")
    ? "reminders"
    : pathname.includes("timezone")
    ? "timezone"
    : "blocks"

  const isListPage =
    pathname === "/manage/blocks" ||
    pathname === "/manage/reminders" ||
    pathname === "/manage/timezone"

  return (
    <div className="mx-auto max-w-2xl p-4 pt-6 space-y-4">
      <h2 className="text-xl font-semibold">Manage</h2>
      {isListPage && (
        <Tabs value={tab} onValueChange={(v) => router.push(`/manage/${v}`)}>
          <TabsList>
            <TabsTrigger value="blocks">Blocks</TabsTrigger>
            <TabsTrigger value="reminders">Reminders</TabsTrigger>
            <TabsTrigger value="timezone">Timezone</TabsTrigger>
          </TabsList>
        </Tabs>
      )}
      {children}
    </div>
  )
}
