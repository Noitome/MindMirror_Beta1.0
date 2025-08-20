import React, { useMemo } from 'react'
import { getSmoothStepPath } from 'reactflow'
import { useMindMapStore } from '../../store/mindMapStore'

const intersectsRect = (x1, y1, x2, y2, rect) => {
  const minX = Math.min(x1, x2)
  const maxX = Math.max(x1, x2)
  const minY = Math.min(y1, y2)
  const maxY = Math.max(y1, y2)
  const rx1 = rect.x
  const ry1 = rect.y
  const rx2 = rect.x + rect.width
  const ry2 = rect.y + rect.height
  if (maxX < rx1 || minX > rx2 || maxY < ry1 || minY > ry2) return false
  const lineIntersects = (x1, y1, x2, y2, x3, y3, x4, y4) => {
    const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4)
    if (den === 0) return false
    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den
    const u = ((x1 - x3) * (y1 - y2) - (y1 - y3) * (x1 - x2)) / den
    return t >= 0 && t <= 1 && u >= 0 && u <= 1
  }
  if (lineIntersects(x1, y1, x2, y2, rx1, ry1, rx2, ry1)) return true
  if (lineIntersects(x1, y1, x2, y2, rx2, ry1, rx2, ry2)) return true
  if (lineIntersects(x1, y1, x2, y2, rx2, ry2, rx1, ry2)) return true
  if (lineIntersects(x1, y1, x2, y2, rx1, ry2, rx1, ry1)) return true
  return false
}

const buildPath = (sourceX, sourceY, targetX, targetY, nodes) => {
  const straightBlocked = nodes.some(n => {
    const width = n.data.width || 200
    const height = n.data.height || 150
    return intersectsRect(sourceX, sourceY, targetX, targetY, {
      x: n.position.x,
      y: n.position.y,
      width,
      height
    })
  })
  if (!straightBlocked) {
    const [path] = getSmoothStepPath({ sourceX, sourceY, targetX, targetY })
    return path
  }
  const midX = (sourceX + targetX) / 2
  const offset = 30
  const waypointY = sourceY < targetY ? targetY - offset : targetY + offset
  const p1 = `M ${sourceX} ${sourceY} L ${midX} ${waypointY}`
  const p2 = `L ${targetX} ${targetY}`
  return `${p1} ${p2}`
}

export default function RoutedEdge({
  id,
  sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
  selected
}) {
  const visibleNodes = useMindMapStore(s => s.selectVisibleNodes())
  const d = useMemo(
    () => buildPath(sourceX, sourceY, targetX, targetY, visibleNodes),
    [sourceX, sourceY, targetX, targetY, visibleNodes]
  )

  return (
    <>
      <defs>
        <marker id="mm-edge-arrow" markerWidth="12" markerHeight="12" refX="12" refY="6" orient="auto">
          <path d="M0,0 L12,6 L0,12 z" fill="var(--mm-edge-marker)" />
        </marker>
      </defs>
      <path
        id={id}
        d={d}
        fill="none"
        stroke={selected ? 'var(--mm-color-edge-selected)' : 'var(--mm-color-edge)'}
        strokeWidth={selected ? 3 : 2}
        markerEnd="url(#mm-edge-arrow)"
        style={{
          opacity: selected ? 1 : 0.7,
          transition: 'stroke 200ms ease, stroke-width 200ms ease, opacity 200ms ease'
        }}
      />
    </>
  )
}
