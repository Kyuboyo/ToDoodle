'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { TAG_PALETTE } from '@/types'
import { TagBadge } from './tag-badge'
import type { Tag } from '@/types'

interface TagSelectorProps {
  allTags: Tag[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  onCreateTag?: (name: string, color: string) => Promise<Tag>
}

export function TagSelector({ allTags, selectedIds, onChange, onCreateTag }: TagSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState(TAG_PALETTE[0])
  const [creating, setCreating] = useState(false)

  const selected = allTags.filter((t) => selectedIds.includes(t.id))
  const filtered = allTags.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  )

  function toggle(id: string) {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((i) => i !== id)
        : [...selectedIds, id]
    )
  }

  async function handleCreate() {
    if (!newTagName.trim() || !onCreateTag) return
    setCreating(true)
    try {
      const tag = await onCreateTag(newTagName.trim(), newTagColor)
      onChange([...selectedIds, tag.id])
      setNewTagName('')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="relative">
      {/* Selected tags */}
      <div
        className="min-h-[38px] w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 flex flex-wrap gap-1.5 cursor-pointer"
        onClick={() => setOpen(true)}
      >
        {selected.map((tag) => (
          <TagBadge
            key={tag.id}
            tag={tag}
            onRemove={(e) => {
              e?.stopPropagation?.()
              toggle(tag.id)
            }}
          />
        ))}
        {selected.length === 0 && (
          <span className="text-sm text-gray-400 py-0.5">Add tags…</span>
        )}
      </div>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 z-20 mt-1.5 w-64 card shadow-lg p-2">
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tags…"
              className="input-base text-xs mb-2"
            />

            <div className="max-h-40 overflow-y-auto space-y-0.5">
              {filtered.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => toggle(tag.id)}
                  className={cn(
                    'w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm hover:bg-gray-50 transition-colors',
                    selectedIds.includes(tag.id) && 'bg-gray-50'
                  )}
                >
                  <div className="w-3.5 h-3.5 rounded-sm flex-shrink-0 border border-gray-200" style={{ backgroundColor: tag.color }} />
                  <span className="flex-1 text-left">{tag.name}</span>
                  {selectedIds.includes(tag.id) && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  )}
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="text-xs text-gray-400 px-2 py-1">No tags found</p>
              )}
            </div>

            {onCreateTag && (
              <div className="border-t border-gray-100 mt-2 pt-2">
                <p className="text-xs text-gray-400 px-1 mb-1.5">Create new tag</p>
                <div className="flex gap-1.5">
                  <input
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                    placeholder="Tag name"
                    className="input-base text-xs flex-1"
                  />
                  <div className="flex gap-1">
                    {TAG_PALETTE.slice(0, 5).map((c) => (
                      <button
                        key={c}
                        onClick={() => setNewTagColor(c)}
                        className={cn(
                          'w-5 h-5 rounded-full border-2 transition-all',
                          newTagColor === c ? 'border-gray-400 scale-110' : 'border-transparent'
                        )}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
                <button
                  onClick={handleCreate}
                  disabled={!newTagName.trim() || creating}
                  className="btn-secondary w-full text-xs mt-1.5"
                >
                  {creating ? 'Creating…' : '+ Create tag'}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
