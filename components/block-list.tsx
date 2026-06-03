"use client"
import { useState } from "react"
import { Pencil, Trash2, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import CreateBlockForm from "@/components/create-block-form"
import { deleteBlock } from "@/lib/actions/manage-actions"
import type { BlockView } from "@/lib/types"

export default function BlockList({ blocks }: { blocks: BlockView[] }) {
  const [dialogBlock, setDialogBlock] = useState<BlockView | null | "new">(null)
  const [deleteTarget, setDeleteTarget] = useState<BlockView | null>(null)

  const isOpen = dialogBlock !== null
  const editBlock = dialogBlock === "new" ? undefined : (dialogBlock ?? undefined)

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button onClick={() => setDialogBlock("new")}>
          <Plus className="h-4 w-4 mr-1" /> Add block
        </Button>
      </div>

      {blocks.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">No blocks yet.</p>
      )}

      {blocks.map((block) => (
        <div key={block.id} className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
          <div className="flex items-center gap-3">
            <div>
              <p className="font-medium text-sm">{block.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{block.category}</p>
            </div>
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
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" onClick={() => setDialogBlock(block)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(block)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      ))}

      <Dialog open={isOpen} onOpenChange={(o) => { if (!o) setDialogBlock(null) }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{dialogBlock === "new" ? "New block" : "Edit block"}</DialogTitle>
          </DialogHeader>
          {isOpen && (
            <CreateBlockForm block={editBlock} onDone={() => setDialogBlock(null)} />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{deleteTarget?.name}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the block and all its cycles and items.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (deleteTarget) await deleteBlock(deleteTarget.id)
                setDeleteTarget(null)
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
