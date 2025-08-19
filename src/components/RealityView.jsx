import React, { useEffect, useRef } from 'react'
import { useMindMapStore } from '../store/mindMapStore'

const RealityView = () => {
  const canvasRef = useRef(null)
  const tasks = useMindMapStore(state => state.tasks)
  const nodes = useMindMapStore(state => state.nodes)
  const nodeRelationships = useMindMapStore(state => state.nodeRelationships)
  const isMainNode = useMindMapStore(state => state.isMainNode)
  const selectAggregatedTime = useMindMapStore(state => state.selectAggregatedTime)

  const formatDuration = (seconds) => {
    if (seconds < 3600) {
      // Less than 1 hour: show minutes
      return `${Math.round(seconds / 60)}min`
    } else if (seconds < 86400) {
      // Less than 24 hours: show hours + minutes
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.round((seconds % 3600) / 60)
      return `${hours}h ${minutes}m`
    } else {
      // 24 hours or more: show days + hours
      const days = Math.floor(seconds / 86400)
      const hours = Math.round((seconds % 86400) / 3600)
      return `${days}d ${hours}h`
    }
  }

  const getSubnodeColors = (mainNodeId) => {
    const children = nodeRelationships[mainNodeId]?.children || []
    const colors = []
    
    children.forEach((childId, index) => {
      const hue = (index * 137.5) % 360
      colors.push({
        id: childId,
        color: `hsl(${hue}, 70%, 60%)`,
        time: tasks[childId]?.timeSpent || 0
      })
    })
    
    return colors
  }

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const width = canvas.width
    const height = canvas.height

    ctx.clearRect(0, 0, width, height)
    
    const mainNodes = nodes.filter(node => isMainNode(node.id))
    if (mainNodes.length === 0) return

    const totalTime = mainNodes.reduce((sum, node) => sum + selectAggregatedTime(node.id), 0)
    const fallbackTotalTime = mainNodes.reduce((sum, node) => sum + (tasks[node.id]?.timeSpent || 0), 0)
    const displayTotalTime = totalTime > 0 ? totalTime : fallbackTotalTime
    
    if (displayTotalTime === 0) return

    const centerX = width / 2
    const centerY = height / 2
    let angle = 0
    const baseRadius = Math.min(width, height) * 0.25

    mainNodes.forEach(node => {
      const task = tasks[node.id]
      if (!task) return
      
      const aggregatedTime = selectAggregatedTime(node.id)
      const taskTime = tasks[node.id]?.timeSpent || 0
      const displayTime = aggregatedTime > 0 ? aggregatedTime : taskTime
      const timeRatio = displayTime / displayTotalTime
      const radius = Math.max(30, baseRadius * Math.sqrt(timeRatio) * 2)
      
      const fontSize = Math.max(12, Math.min(radius * 0.25, 20))
      const timeFontSize = Math.max(10, Math.min(radius * 0.2, 16))

      const x = centerX + Math.cos(angle) * (baseRadius * 1.5)
      const y = centerY + Math.sin(angle) * (baseRadius * 1.5)

      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
      ctx.fill()
      ctx.strokeStyle = '#333'
      ctx.lineWidth = 2
      ctx.stroke()

      const subnodeColors = getSubnodeColors(node.id)
      const totalSubnodeTime = subnodeColors.reduce((sum, sub) => sum + sub.time, 0)
      
      if (totalSubnodeTime > 0) {
        let bandAngle = 0
        const bandWidth = 8
        
        subnodeColors.forEach(subnode => {
          if (subnode.time > 0) {
            const subnodeRatio = subnode.time / totalSubnodeTime
            const arcLength = Math.PI * 2 * subnodeRatio
            
            ctx.beginPath()
            ctx.arc(x, y, radius + bandWidth / 2, bandAngle, bandAngle + arcLength)
            ctx.strokeStyle = subnode.color
            ctx.lineWidth = bandWidth
            ctx.stroke()
            
            bandAngle += arcLength
          }
        })
      }

      // Draw task name
      ctx.fillStyle = '#000'
      ctx.font = `bold ${fontSize}px Arial`
      ctx.textAlign = 'center'
      ctx.fillText(task.name, x, y - 5)
      
      // Draw formatted duration
      ctx.font = `${timeFontSize}px Arial`
      ctx.fillText(formatDuration(Math.round(displayTime)), x, y + fontSize * 0.8)
      
      angle += Math.PI * 2 / mainNodes.length
    })
  }, [tasks, nodes, nodeRelationships, isMainNode, selectAggregatedTime])

  const isMobile = window.innerWidth <= 768
  const canvasSize = isMobile ? Math.min(300, window.innerWidth - 40) : 600

  return (
    <div className="mm-full" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxSizing: 'border-box',
      padding: isMobile ? '10px' : '20px'
    }}>
      <div style={{ 
        width: '100%', 
        height: '100%', 
        maxWidth: `${canvasSize}px`, 
        maxHeight: `${canvasSize}px`,
        aspectRatio: '1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <canvas 
          ref={canvasRef} 
          width={canvasSize} 
          height={canvasSize} 
          className="reality-canvas"
          style={{
            width: '100%',
            height: '100%',
            border: '1px solid #ddd',
            borderRadius: '8px',
            touchAction: 'none'
          }}
        />
      </div>
    </div>
  )
}

export default RealityView
