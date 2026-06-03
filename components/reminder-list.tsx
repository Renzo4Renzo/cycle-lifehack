"use client"
import { useState } from "react"
import { Pencil, Trash2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import CreateReminderForm from "@/components/create-reminder-form"
import { deleteReminder } from "@/lib/actions/manage-actions"
import type { ReminderView } from "@/lib/types"

export default function ReminderList({ reminders }: { reminders: ReminderView[] }) {
  const [dialogReminder, setDialogReminder] = useState<ReminderView | null | "new">(null)
  const [deleteTarget, setDeleteTarget] = useState<ReminderView | null>(null)

  const isOpen = dialogReminder !== null
  const editReminder = dialogReminder === "new" ? undefined : (dialogReminder ?? undefined)

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button onClick={() => setDialogReminder("new")}>
          <Plus className="h-4 w-4 mr-1" /> Add reminder
        </Button>
      </div>

      {reminders.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">No reminders yet.</p>
      )}

      {reminders.map((reminder) => (
        <div key={reminder.id} className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
          <div>
            <p className="font-medium text-sm">{reminder.name}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {reminder.category} · every {reminder.cadence_days} day{reminder.cadence_days === 1 ? "" : "s"}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" onClick={() => setDialogReminder(reminder)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(reminder)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      ))}

      <Dialog open={isOpen} onOpenChange={(o) => { if (!o) setDialogReminder(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{dialogReminder === "new" ? "New reminder" : "Edit reminder"}</DialogTitle>
          </DialogHeader>
          {isOpen && (
            <CreateReminderForm reminder={editReminder} onDone={() => setDialogReminder(null)} />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{deleteTarget?.name}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              This reminder and its state will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (deleteTarget) await deleteReminder(deleteTarget.id)
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
