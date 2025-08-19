/**
 * MindMirror / Mindmap-App
 * © 2025 Daniel — First Public Disclosure: 2025-08-18 (AEST)
 * Licensed under MIT (see LICENSE). Non-code assets reserved.
 */

import React, { useState, useEffect } from 'react'
import SingleScreenView from './components/SingleScreenView'
import AuthButton from './components/AuthButton'
import { useMindMapStore } from './store/mindMapStore'
import { useViewportVar } from './lib/useViewportVar'
import './App.css'

function App() {
  useViewportVar();
  const addNode = useMindMapStore(state => state.addNode)
  const addTask = useMindMapStore(state => state.addTask)
  const exportData = useMindMapStore(state => state.exportData)
  const loadState = useMindMapStore(state => state.loadState)
  const isGuest = useMindMapStore(state => state.isGuest)
  const syncStatus = useMindMapStore(state => state.syncStatus)

  useEffect(() => {
    loadState()
  }, [])

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
          gap: window.innerWidth <= 768 ? '5px' : '10px',
          alignItems: 'center'
        }}>
          <AuthButton />
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

      {isGuest && (
        <div style={{
          backgroundColor: '#fff3cd',
          color: '#856404',
          padding: '8px 20px',
          fontSize: '14px',
          textAlign: 'center',
          borderBottom: '1px solid #ffeaa7'
        }}>
          Guest Mode: Your data is saved locally only. 
          <strong> Sign in to sync across devices.</strong>
          {syncStatus === 'error' && (
            <span style={{ color: '#dc3545', marginLeft: '10px' }}>
              (Sync failed - check connection)
            </span>
          )}
        </div>
      )}

      <SingleScreenView />
      </div>
    </div>
  )
}

export default App
