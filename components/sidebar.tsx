"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Settings } from "lucide-react"
import { getCategories } from "@/lib/categories"
import { cn } from "@/lib/utils"

function categoryIcon(cat: string) {
  // Simple text label as icon fallback; real icons can be mapped here
  return cat.slice(0, 2).toUpperCase()
}

export default function Sidebar() {
  const pathname = usePathname()
  const categories = getCategories()

  const navItems = [
    ...categories.map((cat) => ({
      href: `/${cat}`,
      label: cat.charAt(0).toUpperCase() + cat.slice(1),
      icon: categoryIcon(cat),
    })),
    { href: "/manage/blocks", label: "Manage", icon: <Settings className="h-5 w-5" /> },
  ]

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-44 shrink-0 flex-col border-r bg-card py-6">
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {navItems.map(({ href, label, icon }) => {
            const active = pathname === href || (href !== "/manage/blocks" && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {typeof icon === "string" ? (
                  <span className="w-5 text-center text-xs font-bold">{icon}</span>
                ) : (
                  icon
                )}
                {label}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t bg-card md:hidden">
        {navItems.map(({ href, label, icon }) => {
          const active = pathname === href || (href !== "/manage/blocks" && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              {typeof icon === "string" ? (
                <span className="text-sm font-bold">{icon}</span>
              ) : (
                icon
              )}
              {label}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
