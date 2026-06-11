import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Sidebar from "@/components/sidebar"
import DevTimeTravel from "@/components/dev-time-travel"
import { getToday, formatDate } from "@/lib/date"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect("/login")

  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === "true"
  const todayStr = isDevMode ? formatDate(await getToday()) : ""

  return (
    <div className="flex h-full">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">{children}</main>
      <DevTimeTravel todayStr={todayStr} />
    </div>
  )
}
