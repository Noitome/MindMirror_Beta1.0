import React, { useState } from 'react'
import { useMindMapStore } from '../store/mindMapStore'

const Notes = ({ taskId }) => {
  const [newNote, setNewNote] = useState('')
  const task = useMindMapStore(state => state.tasks[taskId])
  const addNote = useMindMapStore(state => state.addNote)

  if (!task) return null

  const handleAddNote = () => {
    if (!newNote.trim()) return
    addNote(taskId, newNote.trim())
    setNewNote('')
  }

  // Get all notes from all intervals
  const allNotes = []
  if (task.intervals) {
    task.intervals.forEach(interval => {
      if (interval.notes) {
        interval.notes.forEach(note => {
          allNotes.push({
            ...note,
            intervalStart: interval.start,
            type: interval.isAdjustment ? 'adjustment' : 'timer'
          })
        })
      }
    })
  }

  // Add current running interval notes
  if (task.runningInterval?.notes) {
    task.runningInterval.notes.forEach(note => {
      allNotes.push({
        ...note,
        type: 'current'
      })
    })
  }

  // Sort notes by creation time (newest first)
  allNotes.sort((a, b) => b.createdAt - a.createdAt)

  const renderContent = (content) => {
    // Convert URLs to clickable links
    const urlRegex = /(https?:\/\/[^\s]+)/g
    const parts = content.split(urlRegex)
    
    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        return (
          <a 
            key={index} 
            href={part} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: '#007bff', textDecoration: 'underline' }}
          >
            {part}
          </a>
        )
      }
      return part
    })
  }

  return (
    <div className="notes" style={{
      padding: '20px',
      backgroundColor: '#f9f9f9',
      borderRadius: '8px',
      maxHeight: '400px',
      overflowY: 'auto'
    }}>
      <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>Notes</h4>
      
      <div className="notes-list" style={{
        marginBottom: '15px',
        maxHeight: '300px',
        overflowY: 'auto'
      }}>
        {allNotes.length === 0 ? (
          <p style={{ color: '#666', fontStyle: 'italic' }}>No notes yet</p>
        ) : (
          allNotes.map((note, index) => (
            <div key={`${note.createdAt}-${index}`} style={{
              padding: '8px',
              marginBottom: '8px',
              backgroundColor: note.type === 'adjustment' ? '#fff3cd' : '#e7f3ff',
              borderRadius: '4px',
              borderLeft: `3px solid ${note.type === 'adjustment' ? '#ffc107' : '#007bff'}`,
              fontSize: '14px',
              wordBreak: 'break-word'
            }}>
              <div style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>
                {new Date(note.createdAt).toLocaleString()}
                {note.type === 'adjustment' && ' (Adjustment)'}
              </div>
              <div>{renderContent(note.content)}</div>
            </div>
          ))
        )}
      </div>
      
      <div className="add-note" style={{
        display: 'flex',
        gap: '10px',
        alignItems: 'center'
      }}>
        <input
          value={newNote}
          onChange={e => setNewNote(e.target.value)}
          placeholder="Add a note..."
          style={{
            flex: 1,
            padding: '8px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px'
          }}
          onKeyPress={e => e.key === 'Enter' && handleAddNote()}
        />
        <button 
          onClick={handleAddNote}
          style={{
            padding: '8px 16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Add
        </button>
      </div>
    </div>
  )
}

export default Notes
