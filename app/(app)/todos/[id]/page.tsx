'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { cn, getStatusConfig } from '@/lib/utils'
import { STATUSES, LINK_TYPES } from '@/types'
import { TagBadge } from '@/components/tag-badge'
import { TagSelector } from '@/components/tag-selector'
import { FileUpload } from '@/components/file-upload'
import type { Tag, Attachment } from '@/types'

interface TaskDetail {
  id: string
  title: string
  body: string | null
  status: string
  remarks: string | null
  createdAt: string
  updatedAt: string
  tags: Tag[]
  attachments: Attachment[]
  outgoingLinks: { id: string; linkType: string; target?: { id: string; title: string; status: string } }[]
  incomingLinks: { id: string; linkType: string; source?: { id: string; title: string; status: string } }[]
}

export default function TaskDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [task, setTask] = useState<TaskDetail | null>(null)
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)

  // Edit state
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [remarks, setRemarks] = useState('')
  const [status, setStatus] = useState('backlog')
  const [tagIds, setTagIds] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    const [taskRes, tagsRes] = await Promise.all([
      fetch(`/api/tasks/${id}`),
      fetch('/api/tags'),
    ])
    const [taskData, tagsData] = await Promise.all([taskRes.json(), tagsRes.json()])
    setTask(taskData)
    setAllTags(tagsData)
    setTitle(taskData.title ?? '')
    setBody(taskData.body ?? '')
    setRemarks(taskData.remarks ?? '')
    setStatus(taskData.status ?? 'backlog')
    setTagIds(taskData.tags?.map((t: Tag) => t.id) ?? [])
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  async function save(partial?: Partial<{ title: string; body: string; status: string; remarks: string; tagIds: string[] }>) {
    setSaving(true)
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          partial ?? { title, body: body || null, status, remarks: remarks || null, tagIds }
        ),
      })
      const updated = await res.json()
      setTask(updated)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this task? This cannot be undone.')) return
    setDeleting(true)
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    router.push('/todos')
    router.refresh()
  }

  async function handleCreateTag(name: string, color: string): Promise<Tag> {
    const res = await fetch('/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, color }),
    })
    const tag = await res.json()
    setAllTags((prev) => [...prev, tag])
    return tag
  }

  async function removeLink(linkId: string) {
    await fetch(`/api/task-links/${linkId}`, { method: 'DELETE' })
    load()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <svg className="animate-spin h-5 w-5 text-gray-300" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    )
  }

  if (!task) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Task not found</p>
        <Link href="/todos" className="text-sm text-gray-400 underline mt-2 inline-block">Back to tasks</Link>
      </div>
    )
  }

  const statusConfig = getStatusConfig(status)

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        {/* Back */}
        <Link href="/todos" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-6 transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          All tasks
        </Link>

        <div className="space-y-6">
          {/* Title + header actions */}
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => save({ title })}
                className="w-full text-2xl font-semibold text-gray-900 bg-transparent border-none outline-none placeholder:text-gray-300 leading-tight"
                placeholder="Task title"
              />
              <p className="text-xs text-gray-400 mt-1.5">
                Created {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}
                {task.updatedAt !== task.createdAt && (
                  <> · Updated {formatDistanceToNow(new Date(task.updatedAt), { addSuffix: true })}</>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {saving && (
                <span className="text-xs text-gray-400">Saving…</span>
              )}
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="btn-ghost text-red-400 hover:text-red-600 hover:bg-red-50 p-2"
                title="Delete task"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M3 6h18M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6M9 6V4h6v2" />
                </svg>
              </button>
            </div>
          </div>

          {/* Status */}
          <div className="card p-4">
            <label className="block text-xs font-medium text-gray-500 mb-2">Status</label>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => { setStatus(s.value); save({ status: s.value }) }}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
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

          {/* Tags */}
          <div className="card p-4">
            <label className="block text-xs font-medium text-gray-500 mb-2">Tags</label>
            <TagSelector
              allTags={allTags}
              selectedIds={tagIds}
              onChange={(ids) => { setTagIds(ids); save({ tagIds: ids }) }}
              onCreateTag={handleCreateTag}
            />
          </div>

          {/* Description */}
          <div className="card p-4">
            <label className="block text-xs font-medium text-gray-500 mb-2">Description</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onBlur={() => save({ body: body || null })}
              rows={5}
              placeholder="Add a description…"
              className="w-full text-sm text-gray-700 bg-transparent border-none outline-none resize-none placeholder:text-gray-300 leading-relaxed"
            />
          </div>

          {/* Remarks */}
          <div className="card p-4">
            <label className="block text-xs font-medium text-gray-500 mb-2">Remarks</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              onBlur={() => save({ remarks: remarks || null })}
              rows={3}
              placeholder="Notes after completion, observations, decisions…"
              className="w-full text-sm text-gray-700 bg-transparent border-none outline-none resize-none placeholder:text-gray-300 leading-relaxed"
            />
          </div>

          {/* Attachments */}
          <div className="card p-4">
            <label className="block text-xs font-medium text-gray-500 mb-3">Attachments</label>
            <FileUpload
              taskId={id}
              attachments={task.attachments}
              onUploaded={(att) => setTask((t) => t ? { ...t, attachments: [...t.attachments, att] } : t)}
              onDeleted={(attId) => setTask((t) => t ? { ...t, attachments: t.attachments.filter((a) => a.id !== attId) } : t)}
            />
          </div>

          {/* Linked tasks */}
          {(task.outgoingLinks.length > 0 || task.incomingLinks.length > 0) && (
            <div className="card p-4">
              <label className="block text-xs font-medium text-gray-500 mb-3">Linked tasks</label>
              <div className="space-y-2">
                {task.outgoingLinks.map((link) => {
                  if (!link.target) return null
                  const sc = getStatusConfig(link.target.status)
                  const lt = LINK_TYPES.find((l) => l.value === link.linkType)
                  return (
                    <div key={link.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                      <span className="text-xs text-gray-400 w-20 flex-shrink-0">{lt?.label ?? link.linkType}</span>
                      <Link href={`/todos/${link.target.id}`} className="flex-1 flex items-center gap-2 hover:opacity-70 transition-opacity">
                        <span className={cn('px-1.5 py-0.5 rounded-full text-xs font-medium', sc.bg, sc.text)}>
                          {sc.label}
                        </span>
                        <span className="text-sm text-gray-700">{link.target.title}</span>
                      </Link>
                      <button onClick={() => removeLink(link.id)} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )
                })}
                {task.incomingLinks.map((link) => {
                  if (!link.source) return null
                  const sc = getStatusConfig(link.source.status)
                  const lt = LINK_TYPES.find((l) => l.value === link.linkType)
                  return (
                    <div key={link.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                      <span className="text-xs text-gray-400 w-20 flex-shrink-0">← {lt?.label}</span>
                      <Link href={`/todos/${link.source.id}`} className="flex-1 flex items-center gap-2 hover:opacity-70 transition-opacity">
                        <span className={cn('px-1.5 py-0.5 rounded-full text-xs font-medium', sc.bg, sc.text)}>
                          {sc.label}
                        </span>
                        <span className="text-sm text-gray-700">{link.source.title}</span>
                      </Link>
                      <button onClick={() => removeLink(link.id)} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )
                })}
              </div>
              <p className="text-xs text-gray-400 mt-3">
                Go to{' '}
                <Link href="/flow" className="underline hover:text-gray-600">Flow view</Link>
                {' '}to add or visualise connections.
              </p>
            </div>
          )}

          {/* No links yet hint */}
          {task.outgoingLinks.length === 0 && task.incomingLinks.length === 0 && (
            <p className="text-xs text-gray-400 text-center">
              No linked tasks.{' '}
              <Link href="/flow" className="underline hover:text-gray-600">Open Flow view</Link>
              {' '}to create connections.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
