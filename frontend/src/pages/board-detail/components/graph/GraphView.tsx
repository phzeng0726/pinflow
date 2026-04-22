import { useBoardDetail } from '@/hooks/board/queries/useBoardDetail'
import { useBoardDependencies } from '@/hooks/dependency/queries/useBoardDependencies'
import {
  useGraphData,
  type GraphCardNodeData,
} from '@/hooks/dependency/useGraphData'
import { useGraphViewStore } from '@/stores/graphViewStore'
import { useThemeStore } from '@/stores/themeStore'
import { URGENCY_HEX_COLORS } from '@/lib/styleConfig'
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type EdgeTypes,
  type NodeTypes,
  type Node as RFNode,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useCallback, useEffect, useRef, useState } from 'react'
import { GraphCardNode } from './GraphCardNode'
import { GraphDependencyEdge } from './GraphDependencyEdge'
import { GraphFilterPanel } from './GraphFilterPanel'
import { GraphFocusBanner } from './GraphFocusBanner'
import { GraphLegend } from './GraphLegend'
import { GraphSidebar } from './GraphSidebar'
import { GraphToolbar } from './GraphToolbar'

// Module-level constants to prevent re-renders
const nodeTypes: NodeTypes = {
  graphCard: GraphCardNode as NodeTypes[string],
}
const edgeTypes: EdgeTypes = {
  graphDependency: GraphDependencyEdge as EdgeTypes[string],
}

interface GraphViewProps {
  boardId: number
}

export function GraphView({ boardId }: GraphViewProps) {
  const { data: board } = useBoardDetail(boardId)
  const { data: dependencies } = useBoardDependencies(boardId)

  const layoutMode = useGraphViewStore((s) => s.layoutMode)
  const searchQuery = useGraphViewStore((s) => s.searchQuery)
  const focusedCardId = useGraphViewStore((s) => s.focusedCardId)
  const filters = useGraphViewStore((s) => s.filters)
  const setFocusedCardId = useGraphViewStore((s) => s.setFocusedCardId)
  const reset = useGraphViewStore((s) => s.reset)
  const theme = useThemeStore((s) => s.theme)

  const [filterOpen, setFilterOpen] = useState(false)
  const filterRef = useRef<HTMLDivElement>(null)

  // Reset store on unmount
  useEffect(() => () => reset(), [reset])

  // Close filter panel when clicking outside
  useEffect(() => {
    if (!filterOpen) return
    const handler = (e: MouseEvent) => {
      if (
        filterRef.current &&
        !filterRef.current.contains(e.target as HTMLElement) &&
        !(e.target as Element).closest('[data-filter-trigger]')
      ) {
        setFilterOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [filterOpen])

  const handleToggleFilter = useCallback(() => setFilterOpen((v) => !v), [])

  const { nodes: computedNodes, edges: computedEdges } = useGraphData({
    board,
    dependencies,
    layoutMode,
    searchQuery,
    focusedCardId,
    filters,
  })

  const [nodes, setNodes, onNodesChange] = useNodesState(computedNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(computedEdges)

  useEffect(() => {
    setNodes(computedNodes)
  }, [computedNodes, setNodes])

  useEffect(() => {
    setEdges(computedEdges)
  }, [computedEdges, setEdges])

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: RFNode) => {
      const cardId = Number(node.id)
      setFocusedCardId(focusedCardId === cardId ? null : cardId)
    },
    [focusedCardId, setFocusedCardId],
  )

  const handlePaneClick = useCallback(() => {
    setFocusedCardId(null)
  }, [setFocusedCardId])

  const minimapNodeColor = useCallback((node: RFNode): string => {
    const { urgency } = node.data as GraphCardNodeData
    return URGENCY_HEX_COLORS[urgency ?? 'none']
  }, [])

  return (
    <div className="relative flex h-full w-full">
      {/* Left sidebar */}
      <GraphSidebar board={board} />

      {/* Graph canvas */}
      <div className="relative flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          onPaneClick={handlePaneClick}
          fitView
        >
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
          <Controls />
          <MiniMap
            style={{
              height: 96,
              width: 144,
              borderRadius: 8,
              overflow: 'hidden',
              border: theme === 'dark' ? '1px solid #374151' : '1px solid #e2e8f0',
              backgroundColor: theme === 'dark' ? '#111827' : '#f1f5f9',
            }}
            nodeColor={minimapNodeColor}
            nodeStrokeWidth={0}
            zoomable
            pannable
          />
        </ReactFlow>

        {/* Toolbar */}
        <GraphToolbar
          boardId={boardId}
          filterOpen={filterOpen}
          onToggleFilter={handleToggleFilter}
        />

        {/* Filter panel — only visible when filterOpen */}
        {filterOpen && (
          <div ref={filterRef}>
            <GraphFilterPanel boardId={boardId} />
          </div>
        )}

        {/* Focus banner */}
        {focusedCardId !== null && board && (
          <GraphFocusBanner cardId={focusedCardId} board={board} />
        )}

        {/* Legend */}
        <GraphLegend />
      </div>
    </div>
  )
}
