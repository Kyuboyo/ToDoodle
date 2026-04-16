import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { STATUSES } from '@/types'
import { notInArray } from 'drizzle-orm'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getStatusConfig(status: string) {
  return STATUSES.find((s) => s.value === status) ?? STATUSES[0]
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('audio/')) return 'music'
  if (mimeType === 'application/pdf') return 'file-text'
  return 'file'
}

export async function pruneOrphanTags() {
  const { db } = await import('@/db')
  const { tags, taskTags } = await import('@/db/schema')

  // Find tag IDs that are currently in use
  const usedTagRows = await db
    .selectDistinct({ tagId: taskTags.tagId })
    .from(taskTags)

  const usedIds = usedTagRows.map((r) => r.tagId)

  if (usedIds.length === 0) {
    // No tags in use — delete all
    await db.delete(tags)
  } else {
    await db.delete(tags).where(notInArray(tags.id, usedIds))
  }
}

export function generateStorageKey(taskId: string, filename: string): string {
  const ext = filename.split('.').pop() ?? ''
  const timestamp = Date.now()
  const random = Math.random().toString(36).slice(2, 8)
  return `${taskId}/${timestamp}-${random}.${ext}`
}
