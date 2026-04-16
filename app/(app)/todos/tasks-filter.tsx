'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { TagBadge } from '@/components/tag-badge'
import { STATUSES } from '@/types'
import type { Tag } from '@/types'

interface TasksFilterProps {
  allTags: Tag[]
  activeTagIds: string[]
  activeStatus: string
}

export function TasksFilter({ allTags, activeTagIds, activeStatus }: TasksFilterProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function updateParams(key: string, value: string, multi = false) {
    const params = new URLSearchParams(searchParams.toString())
    if (multi) {
      const existing = params.getAll(key)
      if (existing.includes(value)) {
        params.delete(key)
        existing.filter((v) => v !== value).forEach((v) => params.append(key, v))
      } else {
        params.append(key, value)
      }
    } else {
      if (params.get(key) === value) {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  function clearAll() {
    router.push(pathname)
  }

  const hasFilters = activeTagIds.length > 0 || activeStatus

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      {/* Status filters */}
      {STATUSES.map((s) => (
        <button
          key={s.value}
          onClick={() => updateParams('status', s.value)}
          className={cn(
            'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
            activeStatus === s.value
              ? `${s.bg} ${s.text} ring-1 ring-inset ring-current/20`
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          )}
        >
          {s.label}
        </button>
      ))}

      {/* Divider */}
      {allTags.length > 0 && (
        <div className="w-px h-5 bg-gray-200 mx-1" />
      )}

      {/* Tag filters */}
      {allTags.map((tag) => (
        <button
          key={tag.id}
          onClick={() => updateParams('tag', tag.id, true)}
          className={cn(
            'transition-all',
            activeTagIds.includes(tag.id)
              ? 'ring-2 ring-offset-1 ring-gray-400 rounded-full'
              : 'opacity-60 hover:opacity-100'
          )}
        >
          <TagBadge tag={tag} />
        </button>
      ))}

      {/* Clear */}
      {hasFilters && (
        <button
          onClick={clearAll}
          className="ml-1 text-xs text-gray-400 hover:text-gray-600 underline transition-colors"
        >
          Clear filters
        </button>
      )}
    </div>
  )
}
