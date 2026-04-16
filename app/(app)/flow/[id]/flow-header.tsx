'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Flow {
  id: string
  name: string
  description: string | null
}

export function FlowHeader({ flow, taskCount }: { flow: Flow; taskCount: number }) {
  const router = useRouter()
  const [name, setName] = useState(flow.name)
  const [description, setDescription] = useState(flow.description ?? '')
  const [editingName, setEditingName] = useState(false)
  const [editingDesc, setEditingDesc] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function saveName() {
    setEditingName(false)
    if (!name.trim() || name.trim() === flow.name) return
    await fetch(`/api/flows/${flow.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    })
    router.refresh()
  }

  async function saveDescription() {
    setEditingDesc(false)
    if (description.trim() === (flow.description ?? '')) return
    await fetch(`/api/flows/${flow.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: description.trim() || null }),
    })
    router.refresh()
  }

  async function handleDelete() {
    setDeleting(true)
    await fetch(`/api/flows/${flow.id}`, { method: 'DELETE' })
    router.push('/flow')
    router.refresh()
  }

  return (
    <div className="flex items-center gap-3 px-6 py-3 border-b border-gray-100 flex-shrink-0 bg-white">
      {/* Back */}
      <Link
        href="/flow"
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
        Flows
      </Link>

      <div className="w-px h-4 bg-gray-200 flex-shrink-0" />

      {/* Name + description */}
      <div className="flex-1 min-w-0">
        {editingName ? (
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={saveName}
            onKeyDown={(e) => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') { setName(flow.name); setEditingName(false) } }}
            className="text-base font-semibold text-gray-900 bg-transparent border-b border-gray-300 outline-none w-full max-w-xs"
          />
        ) : (
          <button
            onClick={() => setEditingName(true)}
            className="text-base font-semibold text-gray-900 hover:text-gray-600 transition-colors truncate max-w-xs text-left group flex items-center gap-1.5"
            title="Click to rename"
          >
            {name}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="opacity-0 group-hover:opacity-50 flex-shrink-0">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        )}

        {editingDesc ? (
          <input
            autoFocus
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={saveDescription}
            onKeyDown={(e) => { if (e.key === 'Enter') saveDescription(); if (e.key === 'Escape') { setDescription(flow.description ?? ''); setEditingDesc(false) } }}
            placeholder="Add a description…"
            className="text-xs text-gray-400 bg-transparent border-b border-gray-200 outline-none w-full max-w-sm mt-0.5"
          />
        ) : (
          <button
            onClick={() => setEditingDesc(true)}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors text-left truncate max-w-sm group flex items-center gap-1 mt-0.5"
            title="Click to edit description"
          >
            {description || <span className="italic">Add a description…</span>}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="opacity-0 group-hover:opacity-50 flex-shrink-0">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        )}
      </div>

      {/* Task count */}
      <span className="text-xs text-gray-400 flex-shrink-0">
        {taskCount} task{taskCount !== 1 ? 's' : ''}
      </span>

      {/* Delete */}
      {confirmDelete ? (
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-gray-500">Delete this flow?</span>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-2.5 py-1 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
          <button
            onClick={() => setConfirmDelete(false)}
            className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirmDelete(true)}
          className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          title="Delete flow"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 6h18M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6M9 6V4h6v2" />
          </svg>
        </button>
      )}
    </div>
  )
}
