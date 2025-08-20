import React, { useState } from 'react'
import { useMindMapStore } from '../store/mindMapStore'

const AuthModal = ({ onClose }) => {
  const [selectedProvider, setSelectedProvider] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  const login = useMindMapStore(state => state.login)

  const allowed = (import.meta.env?.VITE_AUTH_PROVIDERS || 'google,github,microsoft,email')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean)

  const allProviders = [
    { id: 'google', name: 'Google', icon: '🔍', color: '#db4437' },
    { id: 'github', name: 'GitHub', icon: '🐙', color: '#333' },
    { id: 'microsoft', name: 'Microsoft', icon: '🪟', color: '#00a1f1' },
    { id: 'email', name: 'Email', icon: '📧', color: '#6c757d' }
  ]

  const providers = allProviders.filter(p => allowed.includes(p.id))

  const handleProviderLogin = async (providerId) => {
    setIsLoading(true)
    setError('')
    
    try {
      if (providerId === 'email') {
        if (!email || !password) {
          setError('Please enter email and password')
          setIsLoading(false)
          return
        }
        await login('email', email, password)
      } else {
        await login(providerId)
      }
      onClose()
    } catch (error) {
      setError(error.message || 'Authentication failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGuestMode = () => {
    onClose()
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }} onClick={onClose}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '12px',
        minWidth: Math.min(400, window.innerWidth * 0.9) + 'px',
        maxWidth: Math.min(500, window.innerWidth * 0.95) + 'px',
        maxHeight: window.innerHeight * 0.9 + 'px',
        overflow: 'auto',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
      }} onClick={e => e.stopPropagation()}>
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '25px'
        }}>
          <h2 style={{ margin: 0, color: '#333' }}>Sign In to MindMirror</h2>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            ×
          </button>
        </div>

        <p style={{ 
          marginBottom: '25px', 
          color: '#666',
          fontSize: '14px',
          lineHeight: '1.5'
        }}>
          Sign in to sync your goals and progress across all your devices. 
          Or continue as guest with local-only storage.
        </p>

        {error && (
          <div style={{
            backgroundColor: '#f8d7da',
            color: '#721c24',
            padding: '10px',
            borderRadius: '4px',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: '25px' }}>
          <h3 style={{ 
            margin: '0 0 15px 0', 
            fontSize: '16px',
            color: '#333'
          }}>
            Choose sign-in method:
          </h3>
          
          <div style={{ 
            display: 'grid', 
            gap: '10px',
            gridTemplateColumns: window.innerWidth <= 768 ? '1fr' : '1fr 1fr'
          }}>
            {providers.map(provider => (
              <button
                key={provider.id}
                onClick={() => {
                  if (provider.id === 'email') {
                    setSelectedProvider('email')
                  } else {
                    handleProviderLogin(provider.id)
                  }
                }}
                disabled={isLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 16px',
                  backgroundColor: provider.color,
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  opacity: isLoading ? 0.6 : 1,
                  transition: 'opacity 0.2s'
                }}
              >
                <span style={{ fontSize: '18px' }}>{provider.icon}</span>
                Continue with {provider.name}
              </button>
            ))}
          </div>
        </div>

        {selectedProvider === 'email' && (
          <div style={{ 
            marginBottom: '25px',
            padding: '20px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px'
          }}>
            <h4 style={{ margin: '0 0 15px 0', fontSize: '14px' }}>
              Email Sign In
            </h4>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                marginBottom: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                marginBottom: '15px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => handleProviderLogin('email')}
                disabled={isLoading || !email || !password}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: (isLoading || !email || !password) ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  opacity: (isLoading || !email || !password) ? 0.6 : 1
                }}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </button>
              <button
                onClick={() => setSelectedProvider(null)}
                style={{
                  padding: '10px 15px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Back
              </button>
            </div>
            <p style={{ 
              fontSize: '12px', 
              color: '#666', 
              margin: '10px 0 0 0',
              textAlign: 'center'
            }}>
              New users will be automatically registered
            </p>
          </div>
        )}

        <div style={{
          borderTop: '1px solid #eee',
          paddingTop: '20px',
          textAlign: 'center'
        }}>
          <button
            onClick={handleGuestMode}
            style={{
              padding: '10px 20px',
              backgroundColor: 'transparent',
              color: '#6c757d',
              border: '1px solid #6c757d',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Continue as Guest
          </button>
          <p style={{ 
            fontSize: '12px', 
            color: '#999', 
            margin: '10px 0 0 0'
          }}>
            Guest mode: Local storage only, no cross-device sync
          </p>
        </div>
      </div>
    </div>
  )
}

export default AuthModal
