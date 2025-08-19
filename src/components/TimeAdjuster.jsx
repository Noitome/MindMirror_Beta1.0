import React, { useState } from 'react'
import { useMindMapStore } from '../store/mindMapStore'

const TimeAdjuster = ({ taskId, onClose }) => {
  const [hours, setHours] = useState(0)
  const [minutes, setMinutes] = useState(0)
  const [seconds, setSeconds] = useState(0)
  const [note, setNote] = useState('')
  const adjustTime = useMindMapStore(state => state.adjustTime)
  const addNote = useMindMapStore(state => state.addNote)
  const task = useMindMapStore(state => state.tasks[taskId])

  const handleAdjustment = (isAdd) => {
    // Check if note is provided
    if (!note.trim()) {
      alert('Please add a note explaining the time adjustment')
      return
    }

    // Calculate total adjustment in seconds
    const totalSeconds = (hours * 3600) + (minutes * 60) + seconds

    if (totalSeconds === 0) {
      alert('Please set a time amount to adjust')
      return
    }

    const adjustment = isAdd ? totalSeconds : -totalSeconds

    // Create adjustment note
    const adjustmentNote = `${isAdd ? 'Added' : 'Removed'} ${hours > 0 ? hours + 'h ' : ''}${minutes > 0 ? minutes + 'm ' : ''}${seconds > 0 ? seconds + 's' : ''}: ${note}`

    // Apply the adjustment
    adjustTime(taskId, adjustment, adjustmentNote)

    // Add note to task
    const now = new Date()
    const action = isAdd ? 'added' : 'removed'
    const autoNote = `TIME ${action.toUpperCase()}: ${hours > 0 ? hours + 'h ' : ''}${minutes > 0 ? minutes + 'm ' : ''}${seconds > 0 ? seconds + 's' : ''} at ${now.toLocaleString()} - ${note}`
    addNote(taskId, autoNote)

    // Close the popup
    if (onClose) onClose()
  }

  if (!task) return null

  return (
    <div style={{ padding: '20px', maxWidth: '400px' }}>
      <h4 style={{ margin: '0 0 20px 0' }}>Adjust Time for {task.name}</h4>

      {/* Time inputs */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
          <label style={{ width: '80px', fontSize: '14px' }}>Hours:</label>
          <input 
            type="number" 
            value={hours} 
            onChange={(e) => setHours(Math.max(0, parseInt(e.target.value) || 0))}
            min="0"
            style={{ 
              width: '80px', 
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
          <label style={{ width: '80px', fontSize: '14px' }}>Minutes:</label>
          <input 
            type="number" 
            value={minutes} 
            onChange={(e) => setMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
            min="0"
            max="59"
            style={{ 
              width: '80px', 
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
          <label style={{ width: '80px', fontSize: '14px' }}>Seconds:</label>
          <input 
            type="number" 
            value={seconds} 
            onChange={(e) => setSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
            min="0"
            max="59"
            style={{ 
              width: '80px', 
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
        </div>
      </div>

      {/* Note input (required) */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>
          Note (required): *
        </label>
        <textarea 
          value={note} 
          onChange={(e) => setNote(e.target.value)}
          placeholder="Explain why you're adjusting the time..."
          required
          style={{ 
            width: '100%', 
            minHeight: '80px',
            padding: '8px',
            border: `2px solid ${note.trim() ? '#28a745' : '#dc3545'}`,
            borderRadius: '4px',
            fontSize: '14px',
            resize: 'vertical'
          }}
        />
        {!note.trim() && (
          <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px' }}>
            A note is required to adjust time
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
        <button 
          onClick={() => handleAdjustment(false)}
          disabled={!note.trim() || (hours === 0 && minutes === 0 && seconds === 0)}
          style={{
            padding: '12px 24px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: !note.trim() || (hours === 0 && minutes === 0 && seconds === 0) ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            opacity: !note.trim() || (hours === 0 && minutes === 0 && seconds === 0) ? 0.5 : 1
          }}
        >
          - Remove Time
        </button>
        <button 
          onClick={() => handleAdjustment(true)}
          disabled={!note.trim() || (hours === 0 && minutes === 0 && seconds === 0)}
          style={{
            padding: '12px 24px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: !note.trim() || (hours === 0 && minutes === 0 && seconds === 0) ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            opacity: !note.trim() || (hours === 0 && minutes === 0 && seconds === 0) ? 0.5 : 1
          }}
        >
          + Add Time
        </button>
      </div>

      {/* Current time display */}
      <div style={{ 
        marginTop: '20px', 
        padding: '10px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '4px',
        textAlign: 'center',
        fontSize: '14px',
        color: '#666'
      }}>
        Current time: {Math.floor(task.timeSpent / 3600)}h {Math.floor((task.timeSpent % 3600) / 60)}m {task.timeSpent % 60}s
      </div>
    </div>
  )
}

export default TimeAdjuster