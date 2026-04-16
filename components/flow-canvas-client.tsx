'use client'

import dynamic from 'next/dynamic'
import type { FlowNode, FlowLink, FullTask } from '@/components/flow-canvas'

const FlowCanvas = dynamic(
  () => import('@/components/flow-canvas').then((m) => m.FlowCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-6 w-6 text-gray-300" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-gray-400">Loading canvas…</p>
        </div>
      </div>
    ),
  }
)

interface Props {
  flowId: string
  initialNodes: FlowNode[]
  initialLinks: FlowLink[]
  allTasksWithTags: FullTask[]
}

export function FlowCanvasClient(props: Props) {
  return <FlowCanvas {...props} />
}
