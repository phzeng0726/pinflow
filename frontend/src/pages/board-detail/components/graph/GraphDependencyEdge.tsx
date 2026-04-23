import type { Edge, EdgeProps } from '@xyflow/react'
import { BaseEdge, getSmoothStepPath } from '@xyflow/react'
import type { GraphDependencyEdgeData } from '@/hooks/dependency/useGraphData'
import { getDependencyEdgeStyle, DEPENDENCY_EDGE_STYLES } from '@/lib/styleConfig'

export function GraphDependencyEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps<Edge<GraphDependencyEdgeData>>) {
  const type = data?.type ?? 'related_to'
  const dimmed = data?.dimmed ?? false
  const style = getDependencyEdgeStyle(type)

  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  return (
    <>
      {/* Arrow marker defs for directed edges */}
      <defs>
        <marker
          id="arrow-blocks"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={DEPENDENCY_EDGE_STYLES.blocks.stroke} />
        </marker>
        <marker
          id="arrow-parent"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={DEPENDENCY_EDGE_STYLES.parent_of.stroke} />
        </marker>
      </defs>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: style.stroke,
          strokeDasharray: style.strokeDasharray,
          strokeWidth: 2,
          opacity: dimmed ? 0.12 : 1,
          transition: 'opacity 0.15s',
        }}
        markerEnd={style.markerEnd}
      />
    </>
  )
}
