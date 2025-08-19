import React, { useState, useEffect } from 'react'
import MindMap from './MindMap'
import ListView from './ListView'
import RealityView from './RealityView'

const SingleScreenView = () => {
  const [activeView, setActiveView] = useState('combined')
  const [showBackendData, setShowBackendData] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
      // On mobile, default to list view for better usability
      if (window.innerWidth <= 768 && activeView === 'combined') {
        setActiveView('list')
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [activeView])

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* View selector */}
      <div style={{
        display: 'flex',
        gap: isMobile ? '5px' : '10px',
        padding: isMobile ? '8px' : '10px',
        backgroundColor: '#f8f9fa',
        borderBottom: '1px solid #dee2e6',
        alignItems: 'center',
        flexWrap: 'wrap',
        overflow: 'hidden'
      }}>
        {!isMobile && (
          <button
            onClick={() => setActiveView('combined')}
            style={{
              padding: '8px 16px',
              backgroundColor: activeView === 'combined' ? '#007bff' : '#f8f9fa',
              color: activeView === 'combined' ? 'white' : '#007bff',
              border: '1px solid #007bff',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Combined
          </button>
        )}
        <button
          onClick={() => setActiveView('mindmap')}
          style={{
            padding: isMobile ? '10px 12px' : '8px 16px',
            backgroundColor: activeView === 'mindmap' ? '#007bff' : '#f8f9fa',
            color: activeView === 'mindmap' ? 'white' : '#007bff',
            border: '1px solid #007bff',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: isMobile ? '12px' : '14px',
            minHeight: '44px'
          }}
        >
          {isMobile ? 'Map' : 'Mind Map'}
        </button>
        <button
          onClick={() => setActiveView('list')}
          style={{
            padding: isMobile ? '10px 12px' : '8px 16px',
            backgroundColor: activeView === 'list' ? '#007bff' : '#f8f9fa',
            color: activeView === 'list' ? 'white' : '#007bff',
            border: '1px solid #007bff',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: isMobile ? '12px' : '14px',
            minHeight: '44px'
          }}
        >
          {isMobile ? 'List' : 'Priority List'}
        </button>
        <button
          onClick={() => setActiveView('reality')}
          style={{
            padding: isMobile ? '10px 12px' : '8px 16px',
            backgroundColor: activeView === 'reality' ? '#007bff' : '#f8f9fa',
            color: activeView === 'reality' ? 'white' : '#007bff',
            border: '1px solid #007bff',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: isMobile ? '12px' : '14px',
            minHeight: '44px'
          }}
        >
          {isMobile ? 'Reality' : 'Reality Mirror'}
        </button>
        <label style={{ 
          marginLeft: 'auto', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '5px',
          fontSize: isMobile ? '12px' : '14px',
          minHeight: '44px'
        }}>
          <input
            type="checkbox"
            checked={showBackendData}
            onChange={(e) => setShowBackendData(e.target.checked)}
            style={{
              transform: isMobile ? 'scale(1.2)' : 'scale(1)',
              margin: isMobile ? '0 5px 0 0' : '0'
            }}
          />
          {isMobile ? 'Backend' : 'Show Backend Data'}
        </label>
      </div>

      {/* Content area */}
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden'
      }}>
        {activeView === 'combined' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr',
            gridTemplateRows: isMobile ? '1fr 1fr 1fr' : '1fr',
            width: '100%',
            height: '100%'
          }}>
            <div style={{
              borderRight: isMobile ? 'none' : '1px solid #dee2e6',
              borderBottom: isMobile ? '1px solid #dee2e6' : 'none',
              height: '100%',
              overflow: 'hidden'
            }}>
              <MindMap />
            </div>
            <div style={{
              borderRight: isMobile ? 'none' : '1px solid #dee2e6',
              borderBottom: isMobile ? '1px solid #dee2e6' : 'none',
              height: '100%',
              overflow: 'auto'
            }}>
              <ListView showBackendData={showBackendData} />
            </div>
            <div style={{
              height: '100%',
              overflow: 'auto'
            }}>
              <RealityView />
            </div>
          </div>
        )}

        {activeView === 'mindmap' && (
          <div style={{ width: '100%', height: '100%' }}>
            <MindMap />
          </div>
        )}

        {activeView === 'list' && (
          <div style={{ width: '100%', height: '100%', overflow: 'auto' }}>
            <ListView showBackendData={showBackendData} />
          </div>
        )}

        {activeView === 'reality' && (
          <div style={{ width: '100%', height: '100%', overflow: 'auto' }}>
            <RealityView />
          </div>
        )}
      </div>
    </div>
  )
}

export default SingleScreenView
