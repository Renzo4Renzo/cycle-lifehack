"use client"
import { useTransition, useOptimistic } from "react"
import Image from "next/image"
import { Plus, SkipForward, RotateCcw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { addUse, completeCycle, restoreCycle } from "@/lib/actions/block-actions"
import { getImageUrl } from "@/lib/image"
import { advanceCycleState, restoreCycleState } from "@/lib/cycle"
import type { BlockView, BlockState } from "@/lib/types"

type OptState = Pick<BlockState, "current_cycle_idx" | "uses_per_cycle">

export default function BlockCard({
  block,
  category,
}: {
  block: BlockView
  todayStr: string
  category: string
}) {
  const totalCycles = block.cycles.length
  const [isPending, startTransition] = useTransition()

  const [opt, updateOpt] = useOptimistic<OptState, "add" | "complete" | "restore">(
    {
      current_cycle_idx: block.state.current_cycle_idx,
      uses_per_cycle: block.state.uses_per_cycle,
    },
    (cur, action) => {
      if (action === "add") {
        const uses = [...cur.uses_per_cycle]
        uses[cur.current_cycle_idx] = (uses[cur.current_cycle_idx] ?? 0) + 1
        return { ...cur, uses_per_cycle: uses }
      }
      if (action === "complete") {
        return { ...cur, ...advanceCycleState(cur as BlockState, totalCycles) }
      }
      if (action === "restore") {
        return { ...cur, ...restoreCycleState(cur as BlockState, totalCycles) }
      }
      return cur
    }
  )

  const currentCycle = block.cycles[opt.current_cycle_idx]
  const currentUses = opt.uses_per_cycle[opt.current_cycle_idx] ?? 0

  if (!currentCycle) return null

  const run = (action: "add" | "complete" | "restore", serverFn: () => Promise<void>) => {
    startTransition(async () => {
      updateOpt(action)
      await serverFn()
    })
  }

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">{block.name}</span>
          <Badge
            variant="secondary"
            className={
              block.type === "manual"
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                : "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
            }
          >
            {block.type === "manual" ? "Manual" : "Auto"}
          </Badge>
        </div>
        <span className="text-sm font-medium tabular-nums text-muted-foreground">
          {currentUses} / {block.max_uses}
        </span>
      </div>

      {/* Image strip */}
      <div className="flex gap-3 overflow-x-auto px-4 py-3 scrollbar-thin">
        {currentCycle.cycle_items.map((item) => (
          <div key={item.id} className="flex shrink-0 flex-col items-center gap-1">
            <div className="relative h-20 w-20 overflow-hidden rounded-lg border bg-muted">
              <Image
                src={getImageUrl(item.image_path, item.name)}
                alt={item.name}
                fill
                className="object-cover"
                sizes="80px"
              />
            </div>
            <span className="text-xs text-muted-foreground max-w-[80px] text-center leading-tight">
              {item.name}
            </span>
          </div>
        ))}
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-end gap-2 border-t px-4 py-2">
        {block.type === "manual" ? (
          <>
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => run("add", () => addUse(block.id, category))}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add
            </Button>
            <Button
              size="sm"
              disabled={isPending}
              onClick={() => run("complete", () => completeCycle(block.id, category))}
            >
              <SkipForward className="h-3 w-3 mr-1" />
              Complete
            </Button>
          </>
        ) : (
          <>
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => run("restore", () => restoreCycle(block.id, category))}
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Restore
            </Button>
            <Button
              size="sm"
              disabled={isPending}
              onClick={() => run("complete", () => completeCycle(block.id, category))}
            >
              <SkipForward className="h-3 w-3 mr-1" />
              Complete
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
