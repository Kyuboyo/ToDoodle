'use client'

import {
  useCallback, useState, useRef, createContext, useContext,
} from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Panel,
  addEdge,
  useNodesState,
  useEdgesState,
  NodeToolbar,
  Handle,
  Position,
  MarkerType,
  EdgeLabelRenderer,
  BaseEdge,
  getStraightPath,
  type Connection,
  type Node,
  type Edge,
  type NodeProps,
  type EdgeProps,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { cn, getStatusConfig } from '@/lib/utils'
import { LINK_TYPES } from '@/types'
import type { Tag } from '@/types'

// ── Types ──────────────────────────────────────────────────────────────────

export interface FlowNode {
  nodeId: string   // flow_nodes.id
  taskId: string   // tasks.id — used as React Flow node id
  title: string
  status: string
  tags: Tag[]
  x: number
  y: number
}

export interface FlowLink {
  id: string
  sourceId: string
  targetId: string
  linkType: string
}

export interface FullTask {
  id: string
  title: string
  status: string
  tags: Tag[]
}

interface FlowCanvasProps {
  flowId: string
  initialNodes: FlowNode[]
  initialLinks: FlowLink[]
  allTasksWithTags: FullTask[]
}

// ── Context (avoids passing callbacks through node data) ───────────────────

const RemoveNodeCtx = createContext<(nodeId: string) => void>(() => {})

// ── Task Node ──────────────────────────────────────────────────────────────

function TaskNode({ data, selected }: NodeProps) {
  const onRemove = useContext(RemoveNodeCtx)
  const sc = getStatusConfig(data.status)

  return (
    <>
      <NodeToolbar isVisible={selected} position={Position.Top} style={{ marginBottom: 4 }}>
        <button
          onClick={() => onRemove(data.nodeId)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-200 text-red-500 text-xs font-medium rounded-lg shadow-md hover:bg-red-50 active:scale-95 transition-all"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
          Remove from flow
        </button>
      </NodeToolbar>

      <div
        className={cn(
          'w-56 bg-white rounded-2xl transition-all duration-150',
          selected
            ? 'border-2 border-gray-800 shadow-lg'
            : 'border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300'
        )}
      >
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3.5 !h-3.5 !bg-gray-300 !border-2 !border-white hover:!bg-gray-600 !transition-colors"
        />
        <div className="p-4">
          <p className="text-sm font-semibold text-gray-900 leading-snug mb-3 line-clamp-2">
            {data.title}
          </p>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span
              className={cn(
                'px-2 py-0.5 rounded-full text-xs font-medium',
                sc.bg, sc.text
              )}
            >
              {sc.label}
            </span>
            {data.tags?.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {data.tags.slice(0, 2).map((tag: Tag) => (
                  <span
                    key={tag.id}
                    className="px-1.5 py-0.5 rounded-full text-xs font-medium"
                    style={{ backgroundColor: tag.color, color: 'rgba(0,0,0,0.55)' }}
                  >
                    {tag.name}
                  </span>
                ))}
                {data.tags.length > 2 && (
                  <span className="text-xs text-gray-400">+{data.tags.length - 2}</span>
                )}
              </div>
            )}
          </div>
        </div>
        <Handle
          type="source"
          position={Position.Right}
          className="!w-3.5 !h-3.5 !bg-gray-300 !border-2 !border-white hover:!bg-gray-600 !transition-colors"
        />
      </div>
    </>
  )
}

// ── Labeled Edge ───────────────────────────────────────────────────────────

function LabeledEdge({
  id, sourceX, sourceY, targetX, targetY, data, selected,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getStraightPath({
    sourceX, sourceY, targetX, targetY,
  })
  const lt = LINK_TYPES.find((l) => l.value === data?.linkType) ?? LINK_TYPES[0]
  const color = selected ? '#1f2937' : '#9ca3af'

  return (
    <>
      <defs>
        <marker
          id={`arrow-${id}`}
          markerWidth="8"
          markerHeight="6"
          refX="7"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 8 3, 0 6" fill={color} />
        </marker>
      </defs>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{ stroke: color, strokeWidth: selected ? 2.5 : 1.5 }}
        markerEnd={`url(#arrow-${id})`}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%,-50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <span className="px-2 py-0.5 bg-white border border-gray-200 rounded-full text-xs text-gray-500 shadow-sm whitespace-nowrap select-none">
            {lt.label}
          </span>
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

const nodeTypes = { task: TaskNode }
const edgeTypes = { labeled: LabeledEdge }

// ── Add Tasks Modal ────────────────────────────────────────────────────────

function AddTasksModal({
  tasks,
  onAdd,
  onClose,
}: {
  tasks: FullTask[]
  onAdd: (ids: string[]) => Promise<void>
  onClose: () => void
}) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [adding, setAdding] = useState(false)

  const filtered = tasks.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase())
  )

  function toggle(id: string) {
    setSelected((p) => (p.includes(id) ? p.filter((i) => i !== id) : [...p, id]))
  }

  async function handleConfirm() {
    if (selected.length === 0) return
    setAdding(true)
    await onAdd(selected)
    setAdding(false)
    onClose()
  }

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 w-[400px] max-h-[520px] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Add tasks to flow</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {tasks.length === 0
                  ? 'All tasks are already in this flow'
                  : `${tasks.length} task${tasks.length !== 1 ? 's' : ''} available`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors -mt-0.5"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {tasks.length > 0 && (
            <div className="relative mt-3">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round"
              >
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tasks…"
                className="input-base pl-9 text-sm"
              />
            </div>
          )}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {filtered.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-sm text-gray-400">
                {tasks.length === 0
                  ? 'All tasks are already added to this flow'
                  : 'No tasks match your search'}
              </p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {filtered.map((task) => {
                const sc = getStatusConfig(task.status)
                const isOn = selected.includes(task.id)
                return (
                  <button
                    key={task.id}
                    onClick={() => toggle(task.id)}
                    className={cn(
                      'w-full flex items-start gap-3 px-3 py-3 rounded-xl text-left transition-colors',
                      isOn ? 'bg-gray-100' : 'hover:bg-gray-50'
                    )}
                  >
                    <div
                      className={cn(
                        'mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all',
                        isOn
                          ? 'border-gray-800 bg-gray-800'
                          : 'border-gray-300 bg-white'
                      )}
                    >
                      {isOn && (
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 leading-snug line-clamp-1">
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className={cn('px-1.5 py-0.5 rounded-full text-xs font-medium', sc.bg, sc.text)}>
                          {sc.label}
                        </span>
                        {task.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag.id}
                            className="px-1.5 py-0.5 rounded-full text-xs font-medium"
                            style={{ backgroundColor: tag.color, color: 'rgba(0,0,0,0.55)' }}
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {tasks.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50">
            <button
              onClick={handleConfirm}
              disabled={selected.length === 0 || adding}
              className="btn-primary w-full"
            >
              {adding
                ? 'Adding to canvas…'
                : selected.length > 0
                  ? `Add ${selected.length} task${selected.length > 1 ? 's' : ''} to canvas`
                  : 'Select tasks above'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Link Type Picker ───────────────────────────────────────────────────────

function LinkTypePicker({
  onConfirm,
  onCancel,
  saving,
}: {
  onConfirm: (type: string) => void
  onCancel: () => void
  saving: boolean
}) {
  const [selected, setSelected] = useState('relates_to')

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"
        onClick={onCancel}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 w-72 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">
          Set relationship type
        </h3>
        <p className="text-xs text-gray-400 mb-4">
          How are these two tasks connected?
        </p>
        <div className="space-y-2 mb-5">
          {LINK_TYPES.map((lt) => (
            <button
              key={lt.value}
              onClick={() => setSelected(lt.value)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all',
                selected === lt.value
                  ? 'border-gray-900 bg-gray-900 text-white'
                  : 'border-gray-200 text-gray-700 hover:border-gray-300 bg-white'
              )}
            >
              <div
                className={cn(
                  'w-2 h-2 rounded-full flex-shrink-0',
                  selected === lt.value ? 'bg-white' : 'bg-gray-300'
                )}
              />
              {lt.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel} className="btn-secondary flex-1">
            Cancel
          </button>
          <button
            onClick={() => onConfirm(selected)}
            disabled={saving}
            className="btn-primary flex-1"
          >
            {saving ? 'Saving…' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main FlowCanvas ────────────────────────────────────────────────────────

export function FlowCanvas({
  flowId,
  initialNodes,
  initialLinks,
  allTasksWithTags,
}: FlowCanvasProps) {
  // Track task IDs currently in the flow (drives available task list)
  const [taskIdsInFlow, setTaskIdsInFlow] = useState<Set<string>>(
    new Set(initialNodes.map((n) => n.taskId))
  )

  // flow_nodes.id lookup by taskId (needed for PATCH/DELETE node positions)
  const nodeIdMap = useRef<Map<string, string>>(
    new Map(initialNodes.map((n) => [n.taskId, n.nodeId]))
  )

  const [pendingConnection, setPendingConnection] = useState<Connection | null>(null)
  const [savingLink, setSavingLink] = useState(false)
  const [showAddTasks, setShowAddTasks] = useState(false)

  // ── Node / edge builders ─────────────────────────────────────────────────

  function buildNode(n: FlowNode): Node {
    return {
      id: n.taskId,
      type: 'task',
      position: { x: n.x, y: n.y },
      data: {
        nodeId: n.nodeId,
        title: n.title,
        status: n.status,
        tags: n.tags,
      },
    }
  }

  function buildEdge(l: FlowLink): Edge {
    return {
      id: l.id,
      source: l.sourceId,
      target: l.targetId,
      type: 'labeled',
      data: { linkType: l.linkType },
    }
  }

  const [nodes, setNodes, onNodesChange] = useNodesState(
    initialNodes.map(buildNode)
  )
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    initialLinks.map(buildEdge)
  )

  // Derived: tasks not yet in this flow (passed to AddTasksModal)
  const availableTasks = allTasksWithTags.filter(
    (t) => !taskIdsInFlow.has(t.id)
  )

  // ── Remove node from flow ────────────────────────────────────────────────

  const handleRemoveNode = useCallback(
    async (nodeId: string) => {
      // nodeId = flow_nodes.id (stored in data.nodeId)
      const entry = [...nodeIdMap.current.entries()].find(
        ([, nid]) => nid === nodeId
      )
      if (!entry) return
      const [taskId] = entry

      await fetch(`/api/flows/${flowId}/nodes/${nodeId}`, { method: 'DELETE' })

      setNodes((nds) => nds.filter((n) => n.id !== taskId))
      setEdges((eds) =>
        eds.filter((e) => e.source !== taskId && e.target !== taskId)
      )
      nodeIdMap.current.delete(taskId)
      setTaskIdsInFlow((prev) => {
        const s = new Set(prev)
        s.delete(taskId)
        return s
      })
    },
    [flowId, setNodes, setEdges]
  )

  // ── Add tasks ────────────────────────────────────────────────────────────

  const handleAddTasks = useCallback(
    async (taskIds: string[]) => {
      // Spread new nodes across the canvas, offset from existing count
      const offset = nodes.length
      const body = taskIds.map((taskId, i) => ({
        taskId,
        x: 80 + ((offset + i) % 4) * 280,
        y: 80 + Math.floor((offset + i) / 4) * 200,
      }))

      const res = await fetch(`/api/flows/${flowId}/nodes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const inserted: { id: string; taskId: string; x: number; y: number }[] =
        await res.json()

      const newNodes: Node[] = inserted
        .map((n) => {
          const task = allTasksWithTags.find((t) => t.id === n.taskId)
          if (!task) return null
          nodeIdMap.current.set(n.taskId, n.id)
          return {
            id: n.taskId,
            type: 'task',
            position: { x: n.x, y: n.y },
            data: {
              nodeId: n.id,
              title: task.title,
              status: task.status,
              tags: task.tags,
            },
          } as Node
        })
        .filter(Boolean) as Node[]

      setNodes((nds) => [...nds, ...newNodes])
      setTaskIdsInFlow((prev) => new Set([...prev, ...taskIds]))
    },
    [flowId, nodes.length, allTasksWithTags, setNodes]
  )

  // ── Connect nodes ────────────────────────────────────────────────────────

  const onConnect = useCallback((connection: Connection) => {
    setPendingConnection(connection)
  }, [])

  async function confirmConnection(linkType: string) {
    if (!pendingConnection) return
    setSavingLink(true)
    try {
      const res = await fetch('/api/task-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceId: pendingConnection.source,
          targetId: pendingConnection.target,
          linkType,
        }),
      })
      if (!res.ok) return
      const link = await res.json()
      setEdges((eds) => addEdge(buildEdge(link), eds))
    } finally {
      setSavingLink(false)
      setPendingConnection(null)
    }
  }

  // ── Delete edges ─────────────────────────────────────────────────────────

  async function onEdgesDelete(deleted: Edge[]) {
    await Promise.all(
      deleted.map((e) =>
        fetch(`/api/task-links/${e.id}`, { method: 'DELETE' })
      )
    )
  }

  // ── Persist node position ────────────────────────────────────────────────

  function onNodeDragStop(_: React.MouseEvent, node: Node) {
    const nodeId = nodeIdMap.current.get(node.id)
    if (!nodeId) return
    fetch(`/api/flows/${flowId}/nodes/${nodeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ x: node.position.x, y: node.position.y }),
    })
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <RemoveNodeCtx.Provider value={handleRemoveNode}>
      <div className="w-full h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onEdgesDelete={onEdgesDelete}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          deleteKeyCode="Delete"
          minZoom={0.15}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
          connectionLineStyle={{ stroke: '#9ca3af', strokeWidth: 2, strokeDasharray: '6 3' }}
        >
          <Background color="#e5e7eb" gap={24} size={1} />
          <Controls
            className="!rounded-xl !border !border-gray-200 !shadow-sm !bg-white !overflow-hidden"
            showInteractive={false}
          />
          <MiniMap
            nodeColor="#f1f5f9"
            maskColor="rgba(249,250,251,0.85)"
            className="!rounded-xl !border !border-gray-200 !shadow-sm"
          />

          {/* Empty state */}
          {nodes.length === 0 && (
            <Panel position="top-center">
              <div className="mt-32 text-center pointer-events-none select-none">
                <div className="w-16 h-16 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-center mx-auto mb-4">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-gray-400">
                    <circle cx="5" cy="12" r="2" />
                    <circle cx="19" cy="5" r="2" />
                    <circle cx="19" cy="19" r="2" />
                    <path d="M7 12h10M17 7l-3 3M17 17l-3-3" />
                  </svg>
                </div>
                <p className="text-base font-semibold text-gray-600">Canvas is empty</p>
                <p className="text-sm text-gray-400 mt-1">
                  Click <strong className="font-medium text-gray-700">+ Add tasks</strong> to start building your flow
                </p>
              </div>
            </Panel>
          )}

          {/* Top-right toolbar */}
          <Panel position="top-right" className="m-4">
            <button
              onClick={() => setShowAddTasks(true)}
              className="btn-primary shadow-md"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Add tasks
            </button>
          </Panel>

          {/* Bottom-left hints */}
          <Panel position="bottom-left" className="m-4">
            <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl shadow-sm px-4 py-3 space-y-1.5 text-xs text-gray-500">
              <p>
                <span className="font-medium text-gray-700">Connect</span>
                {' '}— drag from right handle to another node's left handle
              </p>
              <p>
                <span className="font-medium text-gray-700">Delete link</span>
                {' '}— click a link then press{' '}
                <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border border-gray-200 font-mono text-gray-600">Del</kbd>
              </p>
              <p>
                <span className="font-medium text-gray-700">Remove node</span>
                {' '}— click to select, then use toolbar above node
              </p>
            </div>
          </Panel>
        </ReactFlow>

        {/* Overlays (outside ReactFlow to avoid z-index issues) */}
        {showAddTasks && (
          <AddTasksModal
            tasks={availableTasks}
            onAdd={handleAddTasks}
            onClose={() => setShowAddTasks(false)}
          />
        )}
        {pendingConnection && (
          <LinkTypePicker
            onConfirm={confirmConnection}
            onCancel={() => setPendingConnection(null)}
            saving={savingLink}
          />
        )}
      </div>
    </RemoveNodeCtx.Provider>
  )
}
