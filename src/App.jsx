/**
 * MindMirror / Mindmap-App
 * © 2025 Daniel — First Public Disclosure: 2025-08-18 (AEST)
 * Licensed under MIT (see LICENSE). Non-code assets reserved.
 */

import React, { useState } from 'react'
import SingleScreenView from './components/SingleScreenView'
import { useMindMapStore } from './store/mindMapStore'
import { useViewportVar } from './lib/useViewportVar'
import './App.css'

function App() {
  useViewportVar();
  const addNode = useMindMapStore(state => state.addNode)
  const addTask = useMindMapStore(state => state.addTask)
  const exportData = useMindMapStore(state => state.exportData)

  const addNewTask = () => {
    const id = Date.now().toString()
    const taskData = {
      id,
      name: 'New Task',
      timeSpent: 0,
      isRunning: false,
      intervals: [],
      createdAt: Date.now(),
      lastWorkedOn: null
    }
    addTask(taskData)
  }

  return (
    <div id="app" className="mm-full">
      <div className="app">
      <div className="header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: window.innerWidth <= 768 ? '8px 10px' : '10px 20px',
        backgroundColor: '#f8f9fa',
        borderBottom: '1px solid #dee2e6',
        height: window.innerWidth <= 768 ? '50px' : '60px',
        boxSizing: 'border-box',
        flexWrap: 'wrap'
      }}>
        <div>
          <h2 style={{ 
            margin: 0, 
            color: '#333',
            fontSize: window.innerWidth <= 768 ? '18px' : '24px'
          }}>MindMirror</h2>
        </div>
        <div style={{
          display: 'flex',
          gap: window.innerWidth <= 768 ? '5px' : '10px'
        }}>
          <button 
            onClick={addNewTask}
            style={{
              padding: window.innerWidth <= 768 ? '10px 12px' : '8px 16px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: window.innerWidth <= 768 ? '12px' : '14px',
              minHeight: '44px'
            }}
          >
            {window.innerWidth <= 768 ? '+' : 'Add Goal'}
          </button>
          <button 
            onClick={exportData}
            style={{
              padding: window.innerWidth <= 768 ? '10px 12px' : '8px 16px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: window.innerWidth <= 768 ? '12px' : '14px',
              minHeight: '44px'
            }}
          >
            {window.innerWidth <= 768 ? 'CSV' : 'Export CSV'}
          </button>
        </div>
      </div>

      <SingleScreenView />
      </div>
    </div>
  )
}

export default App
