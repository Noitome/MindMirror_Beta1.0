import React, { useEffect, useState } from 'react'
import { useMindMapStore } from '../store/mindMapStore'

const CrownAchievement = ({ alignmentScore }) => {
  const [showPopup, setShowPopup] = useState(false)
  const [playSound, setPlaySound] = useState(false)
  const achievements = useMindMapStore(state => state.achievements)
  const updateAchievements = useMindMapStore(state => state.updateAchievements)
  
  useEffect(() => {
    if (alignmentScore === 100) {
      const lastCrown = achievements.lastCrownTime
      const now = Date.now()
      
      if (!lastCrown || now - lastCrown > 60000) {
        setShowPopup(true)
        setPlaySound(true)
        updateAchievements(alignmentScore)
        
        setTimeout(() => setShowPopup(false), 3000)
      }
    }
  }, [alignmentScore, achievements.lastCrownTime, updateAchievements])
  
  useEffect(() => {
    if (playSound) {
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT')
        audio.play().catch(() => {})
      } catch (error) {
        console.warn('Could not play achievement sound')
      }
      setPlaySound(false)
    }
  }, [playSound])
  
  const shouldShowCrown = alignmentScore >= 95
  const crownOpacity = alignmentScore >= 98 ? 1 : Math.max(0, (alignmentScore - 95) / 3)
  
  const getCrownColor = () => {
    if (achievements.crownCount >= 100) return '#4169E1'
    if (achievements.crownCount >= 10) return '#4169E1'
    if (achievements.crownCount >= 5) return '#32CD32'
    return '#FFD700'
  }
  
  const getExponentText = () => {
    if (achievements.crownCount <= 1) return ''
    return `^${achievements.crownCount}`
  }
  
  return (
    <>
      {shouldShowCrown && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          fontSize: '32px',
          opacity: crownOpacity,
          transition: 'opacity 0.3s ease',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          color: getCrownColor(),
          textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
        }}>
          👑
          {getExponentText() && (
            <span style={{ fontSize: '16px', verticalAlign: 'super' }}>
              {getExponentText()}
            </span>
          )}
        </div>
      )}
      
      {showPopup && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          animation: 'fadeIn 0.5s ease'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '20px',
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            animation: 'scaleIn 0.5s ease'
          }}>
            <div style={{ fontSize: '80px', marginBottom: '20px' }}>👑</div>
            <h1 style={{ 
              margin: '0 0 10px 0', 
              color: '#333',
              fontSize: '32px'
            }}>
              Congratulations!
            </h1>
            <p style={{ 
              margin: 0, 
              color: '#666',
              fontSize: '18px',
              fontStyle: 'italic'
            }}>
              Are you cheating?
            </p>
            {achievements.crownCount > 1 && (
              <p style={{
                margin: '10px 0 0 0',
                color: getCrownColor(),
                fontSize: '16px',
                fontWeight: 'bold'
              }}>
                Achievement #{achievements.crownCount}
              </p>
            )}
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scaleIn {
          from { transform: scale(0.5); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </>
  )
}

export default CrownAchievement
