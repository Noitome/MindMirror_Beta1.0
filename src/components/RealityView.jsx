import React, { useEffect, useRef } from 'react'
import { useMindMapStore } from '../store/mindMapStore'

const RealityView = () => {
  const canvasRef = useRef(null)
  const tasks = useMindMapStore(state => state.tasks)

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

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const width = canvas.width
    const height = canvas.height

    ctx.clearRect(0, 0, width, height)
    const totalTime = Object.values(tasks).reduce((sum, task) => sum + task.timeSpent, 0)
    if (totalTime === 0) return

    const centerX = width / 2
    const centerY = height / 2
    let angle = 0
    const baseRadius = Math.min(width, height) * 0.3

    Object.values(tasks).forEach(task => {
      const timeRatio = task.timeSpent / totalTime
      const radius = baseRadius * Math.sqrt(timeRatio) * 2
      
      // Calculate font size based on radius
      const fontSize = Math.max(12, Math.min(radius * 0.3, 24))
      const timeFontSize = Math.max(10, Math.min(radius * 0.25, 18))

      const x = centerX + Math.cos(angle) * baseRadius
      const y = centerY + Math.sin(angle) * baseRadius

      // Draw circle
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.fillStyle = `hsla(${Math.random() * 360}, 70%, 70%, 0.6)`
      ctx.fill()
      ctx.strokeStyle = '#333'
      ctx.stroke()

      // Draw task name
      ctx.fillStyle = '#000'
      ctx.font = `bold ${fontSize}px Arial`
      ctx.textAlign = 'center'
      ctx.fillText(task.name, x, y)
      
      // Draw formatted duration
      ctx.font = `${timeFontSize}px Arial`
      ctx.fillText(formatDuration(task.timeSpent), x, y + fontSize * 1.2)
      
      angle += Math.PI * 2 / Object.keys(tasks).length
    })
  }, [tasks])

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
