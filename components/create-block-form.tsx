"use client"
import { useState, useTransition } from "react"
import { Plus, Trash2, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createBlock, updateBlock } from "@/lib/actions/manage-actions"
import { getCategories } from "@/lib/categories"
import { getImageUrl } from "@/lib/image"
import { cn } from "@/lib/utils"
import type { BlockView } from "@/lib/types"

interface ItemState {
  name: string
  imagePath: string | null
  imageFile?: File
  previewUrl?: string
}

interface CycleState {
  id?: string        // present when editing an existing cycle
  enabled: boolean
  items: ItemState[]
}

interface FormState {
  name: string
  type: "manual" | "automatic"
  category: string
  maxUses: string
  cycles: CycleState[]
}

function defaultForm(categories: string[]): FormState {
  return {
    name: "",
    type: "manual",
    category: categories[0] ?? "outfits",
    maxUses: "1",
    cycles: [{ enabled: true, items: [{ name: "", imagePath: null }] }],
  }
}

function blockToForm(block: BlockView): FormState {
  return {
    name: block.name,
    type: block.type,
    category: block.category,
    maxUses: String(block.max_uses),
    cycles: block.cycles.map((c) => ({
      id: c.id,
      enabled: c.enabled,
      items: c.cycle_items.map((i) => ({
        name: i.name,
        imagePath: i.image_path,
        previewUrl: i.image_path ? getImageUrl(i.image_path, i.name) : undefined,
      })),
    })),
  }
}

export default function CreateBlockForm({
  block,
  onDone,
}: {
  block?: BlockView
  onDone: () => void
}) {
  const categories = getCategories()
  const [form, setForm] = useState<FormState>(block ? blockToForm(block) : defaultForm(categories))
  const [isPending, startTransition] = useTransition()

  const setCycleItem = (ci: number, ii: number, patch: Partial<ItemState>) => {
    setForm((f) => ({
      ...f,
      cycles: f.cycles.map((c, ci2) =>
        ci2 !== ci ? c : { ...c, items: c.items.map((it, ii2) => (ii2 !== ii ? it : { ...it, ...patch })) }
      ),
    }))
  }

  const toggleCycleEnabled = (ci: number) => {
    setForm((f) => ({
      ...f,
      cycles: f.cycles.map((c, i) => (i !== ci ? c : { ...c, enabled: !c.enabled })),
    }))
  }

  const addItem = (ci: number) => {
    setForm((f) => ({
      ...f,
      cycles: f.cycles.map((c, ci2) =>
        ci2 !== ci ? c : { ...c, items: [...c.items, { name: "", imagePath: null }] }
      ),
    }))
  }

  const removeItem = (ci: number, ii: number) => {
    setForm((f) => ({
      ...f,
      cycles: f.cycles.map((c, ci2) =>
        ci2 !== ci ? c : { ...c, items: c.items.filter((_, i) => i !== ii) }
      ),
    }))
  }

  const addCycle = () => {
    setForm((f) => ({ ...f, cycles: [...f.cycles, { enabled: true, items: [{ name: "", imagePath: null }] }] }))
  }

  const removeCycle = (ci: number) => {
    setForm((f) => ({ ...f, cycles: f.cycles.filter((_, i) => i !== ci) }))
  }

  const handleSubmit = () => {
    startTransition(async () => {
      const fd = new FormData()
      fd.append("name", form.name)
      fd.append("type", form.type)
      fd.append("category", form.category)
      fd.append("max_uses", form.maxUses)
      const cyclesData = form.cycles.map((c) => ({
        id: c.id,
        enabled: c.enabled,
        items: c.items.map((i) => ({ name: i.name, imagePath: i.imagePath })),
      }))
      fd.append("cycles", JSON.stringify(cyclesData))
      for (let ci = 0; ci < form.cycles.length; ci++) {
        for (let ii = 0; ii < form.cycles[ci].items.length; ii++) {
          const file = form.cycles[ci].items[ii].imageFile
          if (file) fd.append(`image_${ci}_${ii}`, file)
        }
      }
      if (block) {
        await updateBlock(block.id, fd)
      } else {
        await createBlock(fd)
      }
      onDone()
    })
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1">
          <Label>Block name</Label>
          <Input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Outdoor Outfit"
          />
        </div>
        <div className="space-y-1">
          <Label>Type</Label>
          <Select
            value={form.type}
            onValueChange={(v) => setForm((f) => ({ ...f, type: (v ?? f.type) as "manual" | "automatic" }))}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Manual</SelectItem>
              <SelectItem value="automatic">Automatic</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Category</Label>
          <Select
            value={form.category}
            onValueChange={(v) => setForm((f) => ({ ...f, category: v ?? f.category }))}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2 space-y-1">
          <Label>Max uses per cycle</Label>
          <Input
            type="number"
            min={1}
            value={form.maxUses}
            onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value }))}
          />
        </div>
      </div>

      <div className="space-y-4">
        <Label className="text-base font-semibold">Cycles</Label>
        {form.cycles.map((cycle, ci) => (
          <div
            key={ci}
            className={cn(
              "rounded-lg border p-4 space-y-3 transition-colors",
              !cycle.enabled && "opacity-60 bg-muted/40"
            )}
          >
            {/* Cycle header */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-muted-foreground">Cycle {ci + 1}</span>
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => toggleCycleEnabled(ci)}
                  className={cn(
                    "rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
                    cycle.enabled
                      ? "border-green-300 bg-green-50 text-green-700 hover:bg-green-100"
                      : "border-gray-300 bg-gray-100 text-gray-500 hover:bg-gray-200"
                  )}
                >
                  {cycle.enabled ? "Active" : "Skipped"}
                </button>
                {form.cycles.length > 1 && (
                  <Button size="sm" variant="ghost" onClick={() => removeCycle(ci)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Items */}
            {cycle.items.map((item, ii) => (
              <div key={ii} className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
                <Input
                  placeholder="Item name"
                  value={item.name}
                  onChange={(e) => setCycleItem(ci, ii, { name: e.target.value })}
                  className="flex-1"
                />
                <div className="flex items-center gap-1">
                  {item.previewUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.previewUrl} alt="" className="h-8 w-8 rounded object-cover border" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id={`img-${ci}-${ii}`}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      setCycleItem(ci, ii, { imageFile: file, previewUrl: URL.createObjectURL(file) })
                    }}
                  />
                  <label
                    htmlFor={`img-${ci}-${ii}`}
                    className="cursor-pointer rounded border px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
                  >
                    Img
                  </label>
                </div>
                {cycle.items.length > 1 && (
                  <Button size="sm" variant="ghost" onClick={() => removeItem(ci, ii)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}

            <Button size="sm" variant="outline" onClick={() => addItem(ci)}>
              <Plus className="h-3 w-3 mr-1" /> Add item
            </Button>
          </div>
        ))}

        <Button variant="outline" onClick={addCycle}>
          <Plus className="h-4 w-4 mr-1" /> Add cycle
        </Button>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onDone} disabled={isPending}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={isPending || !form.name}>
          {isPending ? "Saving…" : block ? "Save changes" : "Create block"}
        </Button>
      </div>
    </div>
  )
}
