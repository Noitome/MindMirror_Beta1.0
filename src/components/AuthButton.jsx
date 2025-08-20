import React, { useState } from 'react'
import { useMindMapStore } from '../store/mindMapStore'
import AuthModal from './AuthModal'

const AuthButton = () => {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const user = useMindMapStore(state => state.user)
  const isAuthenticated = useMindMapStore(state => state.isAuthenticated)
  const syncStatus = useMindMapStore(state => state.syncStatus)
  const logout = useMindMapStore(state => state.logout)
  const syncToCloud = useMindMapStore(state => state.syncToCloud)

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const handleSync = async () => {
    try {
      await syncToCloud()
    } catch (error) {
      console.error('Sync failed:', error)
    }
  }

  const isMobile = window.innerWidth <= 768

  if (isAuthenticated && user) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: isMobile ? '3px' : '8px',
        fontSize: isMobile ? '10px' : '12px'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          color: '#666',
          minWidth: isMobile ? '60px' : '80px'
        }}>
          <div style={{ 
            fontWeight: 'bold',
            fontSize: isMobile ? '10px' : '12px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: isMobile ? '60px' : '100px'
          }}>
            {user.displayName || user.email?.split('@')[0] || 'User'}
          </div>
          <div style={{ 
            fontSize: isMobile ? '8px' : '10px',
            color: syncStatus === 'success' ? '#28a745' : 
                   syncStatus === 'error' ? '#dc3545' : 
                   syncStatus === 'syncing' ? '#ffc107' : '#6c757d'
          }}>
            {syncStatus === 'syncing' ? 'Syncing...' :
             syncStatus === 'success' ? 'Synced' :
             syncStatus === 'error' ? 'Sync Error' : 'Local'}
          </div>
        </div>
        
        {!isMobile && (
          <button
            onClick={handleSync}
            disabled={syncStatus === 'syncing'}
            style={{
              padding: '4px 8px',
              backgroundColor: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              cursor: syncStatus === 'syncing' ? 'not-allowed' : 'pointer',
              fontSize: '10px',
              opacity: syncStatus === 'syncing' ? 0.6 : 1
            }}
          >
            Sync
          </button>
        )}
        
        <button
          onClick={handleLogout}
          style={{
            padding: isMobile ? '8px 10px' : '6px 12px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: isMobile ? '10px' : '12px',
            minHeight: isMobile ? '32px' : '36px'
          }}
        >
          {isMobile ? 'Out' : 'Sign Out'}
        </button>
      </div>
    )
  }

  return (
    <>
      <button
        onClick={() => setShowAuthModal(true)}
        style={{
          padding: isMobile ? '10px 12px' : '8px 16px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: isMobile ? '12px' : '14px',
          minHeight: '44px'
        }}
      >
        {isMobile ? 'Sign In' : 'Sign In / Sync'}
      </button>
      
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </>
  )
}

export default AuthButton
