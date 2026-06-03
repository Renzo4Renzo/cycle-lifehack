import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Sidebar from "@/components/sidebar"
import DevTimeTravel from "@/components/dev-time-travel"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect("/login")

  return (
    <div className="flex h-full">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">{children}</main>
      <DevTimeTravel />
    </div>
  )
}
