import { useMemo } from 'react'
import type { Node, Edge } from '@xyflow/react'
import { Graph, layout } from '@dagrejs/dagre'
import type { Board, Card, Column, Dependency } from '@/types'
import type { GraphFilters, LayoutMode } from '@/stores/graphViewStore'
import { getCardUrgency } from '@/lib/dates'
import type { CardUrgency } from '@/lib/dates'

export type { CardUrgency }

const NODE_WIDTH = 220
const NODE_HEIGHT = 130
const CLUSTER_X_GAP = 80
const CLUSTER_Y_GAP = 16

export interface GraphCardNodeData extends Record<string, unknown> {
  card: Card
  column: Column
  urgency: CardUrgency
  dimmed: boolean
}

export interface GraphDependencyEdgeData extends Record<string, unknown> {
  type: Dependency['type']
  dimmed: boolean
}

function applyHierarchyLayout(
  nodes: Node<GraphCardNodeData>[],
  edges: Edge<GraphDependencyEdgeData>[],
): Node<GraphCardNodeData>[] {
  const g = new Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'TB', nodesep: 30, ranksep: 60 })

  nodes.forEach((n) => {
    g.setNode(String(n.id), { width: NODE_WIDTH, height: NODE_HEIGHT })
  })

  edges.forEach((e) => {
    const edgeData = e.data as GraphDependencyEdgeData
    if (edgeData?.type === 'blocks' || edgeData?.type === 'parent_of') {
      g.setEdge(String(e.source), String(e.target))
    }
  })

  layout(g)

  return nodes.map((n) => {
    const pos = g.node(String(n.id))
    if (!pos) return n
    return { ...n, position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 } }
  })
}

function applyClusterLayout(
  nodes: Node<GraphCardNodeData>[],
  edges: Edge<GraphDependencyEdgeData>[],
): Node<GraphCardNodeData>[] {
  // --- Topological sort (Kahn's) using directed edges only ---
  const directedEdges = edges.filter(
    (e) => e.data?.type === 'blocks' || e.data?.type === 'parent_of',
  )
  const inDegree = new Map<string, number>()
  const adj = new Map<string, string[]>()
  nodes.forEach((n) => { inDegree.set(n.id, 0); adj.set(n.id, []) })
  directedEdges.forEach((e) => {
    adj.get(e.source)?.push(e.target)
    inDegree.set(e.target, (inDegree.get(e.target) ?? 0) + 1)
  })
  const topoRank = new Map<string, number>()
  const queue = nodes.filter((n) => (inDegree.get(n.id) ?? 0) === 0).map((n) => n.id)
  let rank = 0
  while (queue.length > 0) {
    const id = queue.shift()!
    topoRank.set(id, rank++)
    for (const next of (adj.get(id) ?? [])) {
      const deg = (inDegree.get(next) ?? 1) - 1
      inDegree.set(next, deg)
      if (deg === 0) queue.push(next)
    }
  }
  // Nodes left in cycles get appended ranks
  nodes.forEach((n) => { if (!topoRank.has(n.id)) topoRank.set(n.id, rank++) })

  // --- Separate linked vs unlinked ---
  const edgeNodeIds = new Set<string>()
  edges.forEach((e) => { edgeNodeIds.add(e.source); edgeNodeIds.add(e.target) })

  const linkedNodes = nodes.filter((n) => edgeNodeIds.has(n.id))
  const unlinkedNodes = nodes.filter((n) => !edgeNodeIds.has(n.id))

  // --- Group linked nodes by columnId, sorted by topological rank ---
  const linkedGroups = new Map<number, Node<GraphCardNodeData>[]>()
  linkedNodes.forEach((n) => {
    const colId = (n.data as GraphCardNodeData).column.id
    if (!linkedGroups.has(colId)) linkedGroups.set(colId, [])
    linkedGroups.get(colId)!.push(n)
  })
  linkedGroups.forEach((group) =>
    group.sort((a, b) => (topoRank.get(a.id) ?? 0) - (topoRank.get(b.id) ?? 0)),
  )

  // --- Group unlinked nodes by columnId ---
  const unlinkedGroups = new Map<number, Node<GraphCardNodeData>[]>()
  unlinkedNodes.forEach((n) => {
    const colId = (n.data as GraphCardNodeData).column.id
    if (!unlinkedGroups.has(colId)) unlinkedGroups.set(colId, [])
    unlinkedGroups.get(colId)!.push(n)
  })

  const result: Node<GraphCardNodeData>[] = []
  let groupX = 0

  // Linked columns first (left side)
  linkedGroups.forEach((groupNodes) => {
    let nodeY = 0
    groupNodes.forEach((n) => {
      result.push({ ...n, position: { x: groupX, y: nodeY } })
      nodeY += NODE_HEIGHT + CLUSTER_Y_GAP
    })
    groupX += NODE_WIDTH + CLUSTER_X_GAP
  })

  // Unlinked columns on the right, with extra gap to visually separate
  if (unlinkedGroups.size > 0) {
    groupX += CLUSTER_X_GAP // extra separation
    unlinkedGroups.forEach((groupNodes) => {
      let nodeY = 0
      groupNodes.forEach((n) => {
        result.push({ ...n, position: { x: groupX, y: nodeY } })
        nodeY += NODE_HEIGHT + CLUSTER_Y_GAP
      })
      groupX += NODE_WIDTH + CLUSTER_X_GAP
    })
  }

  return result
}

interface UseGraphDataParams {
  board: Board | undefined
  dependencies: Dependency[] | undefined
  layoutMode: LayoutMode
  searchQuery: string
  focusedCardId: number | null
  filters: GraphFilters
}

export function useGraphData({
  board,
  dependencies,
  layoutMode,
  searchQuery,
  focusedCardId,
  filters,
}: UseGraphDataParams): { nodes: Node<GraphCardNodeData>[]; edges: Edge<GraphDependencyEdgeData>[] } {
  return useMemo(() => {
    if (!board || !dependencies) return { nodes: [], edges: [] }

    // 4.2: Build cardMap (cardId → { card, column })
    const cardMap = new Map<number, { card: Card; column: Column }>()
    for (const col of board.columns) {
      for (const card of col.cards ?? []) {
        cardMap.set(card.id, { card, column: col })
      }
    }

    // 4.3: Filter dependencies
    let filteredDeps = dependencies

    if (filters.relationTypes.length > 0) {
      filteredDeps = filteredDeps.filter((d) =>
        filters.relationTypes.includes(d.type),
      )
    }

    if (filters.columnIds.length > 0) {
      filteredDeps = filteredDeps.filter((d) => {
        const from = cardMap.get(d.fromCard.id)
        const to = cardMap.get(d.toCard.id)
        return (
          (from && filters.columnIds.includes(from.column.id)) ||
          (to && filters.columnIds.includes(to.column.id))
        )
      })
    }

    if (filters.dateFrom || filters.dateTo) {
      const from = filters.dateFrom ? new Date(filters.dateFrom).getTime() : null
      const to = filters.dateTo ? new Date(filters.dateTo).getTime() : null
      filteredDeps = filteredDeps.filter((d) => {
        const fromEntry = cardMap.get(d.fromCard.id)
        const toEntry = cardMap.get(d.toCard.id)
        const cards = [fromEntry?.card, toEntry?.card].filter(Boolean) as Card[]
        return cards.some((c) => {
          const times = [c.startTime, c.endTime].filter(Boolean) as string[]
          return times.some((t) => {
            const ts = new Date(t).getTime()
            if (from && ts < from) return false
            if (to && ts > to) return false
            return true
          })
        })
      })
    }

    if (filters.tagIds.length > 0) {
      filteredDeps = filteredDeps.filter((d) => {
        const fromEntry = cardMap.get(d.fromCard.id)
        const toEntry = cardMap.get(d.toCard.id)
        const cards = [fromEntry?.card, toEntry?.card].filter(Boolean) as Card[]
        return cards.some((c) =>
          c.tags.some((t) => filters.tagIds.includes(t.id)),
        )
      })
    }

    // Collect card IDs that are in at least one (filtered) dependency
    const linkedCardIds = new Set<number>()
    filteredDeps.forEach((d) => {
      linkedCardIds.add(d.fromCard.id)
      linkedCardIds.add(d.toCard.id)
    })

    // 4.8: Determine urgency per card
    // Build the set of cards to show as nodes
    // Hierarchy: only linked cards; Cluster: all cards
    const cardsToShow: Map<number, { card: Card; column: Column }> = new Map()
    if (layoutMode === 'cluster') {
      cardMap.forEach((v, k) => cardsToShow.set(k, v))
    } else {
      linkedCardIds.forEach((id) => {
        const entry = cardMap.get(id)
        if (entry) cardsToShow.set(id, entry)
      })
    }

    // Apply column filter to nodes (remove cards not in filtered columns)
    if (filters.columnIds.length > 0) {
      cardsToShow.forEach((v, k) => {
        if (!filters.columnIds.includes(v.column.id)) cardsToShow.delete(k)
      })
    }

    // Apply tag filter to nodes
    if (filters.tagIds.length > 0) {
      cardsToShow.forEach((v, k) => {
        if (!v.card.tags.some((t) => filters.tagIds.includes(t.id)))
          cardsToShow.delete(k)
      })
    }

    // Apply date filter to nodes
    if (filters.dateFrom || filters.dateTo) {
      const from = filters.dateFrom ? new Date(filters.dateFrom).getTime() : null
      const to = filters.dateTo ? new Date(filters.dateTo).getTime() : null
      cardsToShow.forEach((v, k) => {
        const times = [v.card.startTime, v.card.endTime].filter(Boolean) as string[]
        const matches = times.some((t) => {
          const ts = new Date(t).getTime()
          if (from && ts < from) return false
          if (to && ts > to) return false
          return true
        })
        if (!matches) cardsToShow.delete(k)
      })
    }

    // 4.4: search dimming — mark nodes where title doesn't match query
    const lowerSearch = searchQuery.toLowerCase().trim()

    // 4.5: focus dimming — compute connected card IDs
    const focusedNeighbors = new Set<number>()
    if (focusedCardId !== null) {
      focusedNeighbors.add(focusedCardId)
      filteredDeps.forEach((d) => {
        if (d.fromCard.id === focusedCardId) focusedNeighbors.add(d.toCard.id)
        if (d.toCard.id === focusedCardId) focusedNeighbors.add(d.fromCard.id)
      })
    }

    // Cards whose titles match the search query (all cards match when query is empty)
    const searchActiveIds = new Set<number>()
    cardsToShow.forEach(({ card }) => {
      if (!lowerSearch || card.title.toLowerCase().includes(lowerSearch)) {
        searchActiveIds.add(card.id)
      }
    })

    // Build nodes
    const rawNodes: Node<GraphCardNodeData>[] = []
    cardsToShow.forEach(({ card, column }) => {
      const urgency = getCardUrgency(card)

      const dimmed =
        !searchActiveIds.has(card.id) ||
        (focusedCardId !== null && !focusedNeighbors.has(card.id))

      rawNodes.push({
        id: String(card.id),
        type: 'graphCard',
        position: { x: 0, y: 0 },
        data: { card, column, urgency, dimmed },
      })
    })

    // Build edges (only for cards that made it into nodes)
    const nodeIds = new Set(rawNodes.map((n) => n.id))
    const edges: Edge<GraphDependencyEdgeData>[] = filteredDeps
      .filter(
        (d) => nodeIds.has(String(d.fromCard.id)) && nodeIds.has(String(d.toCard.id)),
      )
      .map((d) => {
        // Search dim: edge is dimmed if either endpoint is not in the search-active set
        const searchDimmed =
          lowerSearch !== '' &&
          !(searchActiveIds.has(d.fromCard.id) && searchActiveIds.has(d.toCard.id))

        // Focus dim: edge is dimmed unless both endpoints are within the focused neighborhood
        const focusDimmed =
          focusedCardId !== null &&
          !(focusedNeighbors.has(d.fromCard.id) && focusedNeighbors.has(d.toCard.id))

        const edgeDimmed = searchDimmed || focusDimmed

        return {
          id: `dep-${d.id}`,
          source: String(d.fromCard.id),
          target: String(d.toCard.id),
          type: 'graphDependency',
          data: { type: d.type, dimmed: edgeDimmed },
        }
      })

    // 4.6/4.7: Apply layout
    const positionedNodes =
      layoutMode === 'hierarchy'
        ? applyHierarchyLayout(rawNodes, edges)
        : applyClusterLayout(rawNodes, edges)

    return { nodes: positionedNodes, edges }
  }, [board, dependencies, layoutMode, searchQuery, focusedCardId, filters])
}
