'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { STATUSES } from '@/types'
import type { Tag } from '@/types'
import { TagBadge } from './tag-badge'

interface CreateTaskDialogProps {
  tags: Tag[]
  defaultStatus?: string
  onCreated?: (taskId: string) => void
  children: React.ReactNode
}

export function CreateTaskDialog({
  tags,
  defaultStatus = 'backlog',
  onCreated,
  children,
}: CreateTaskDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [status, setStatus] = useState(defaultStatus)
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  function toggleTag(id: string) {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), status, tagIds: selectedTagIds }),
      })
      const task = await res.json()
      setOpen(false)
      setTitle('')
      setSelectedTagIds([])
      setStatus(defaultStatus)
      if (onCreated) {
        onCreated(task.id)
      } else {
        router.push(`/todos/${task.id}`)
      }
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div onClick={() => setOpen(true)}>{children}</div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20" onClick={() => setOpen(false)} />
          <div className="relative card w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">New task</h2>
              <button
                onClick={() => setOpen(false)}
                className="btn-ghost p-1.5"
                aria-label="Close"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input-base text-base"
                  placeholder="Task title"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Status</label>
                <div className="flex flex-wrap gap-1.5">
                  {STATUSES.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setStatus(s.value)}
                      className={cn(
                        'px-3 py-1 rounded-full text-xs font-medium transition-all',
                        status === s.value
                          ? `${s.bg} ${s.text} ring-2 ring-offset-1 ring-gray-300`
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {tags.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Tags</label>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className={cn(
                          'transition-all',
                          selectedTagIds.includes(tag.id)
                            ? 'ring-2 ring-offset-1 ring-gray-400 rounded-full'
                            : 'opacity-60 hover:opacity-100'
                        )}
                      >
                        <TagBadge tag={tag} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={loading || !title.trim()} className="btn-primary flex-1">
                  {loading ? 'Creating…' : 'Create task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
