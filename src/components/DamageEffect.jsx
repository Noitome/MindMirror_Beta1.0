import React, { useEffect, useState } from 'react'
import { useMindMapStore } from '../store/mindMapStore'

const DamageEffect = ({ overallAlignmentScore }) => {
  const [effects, setEffects] = useState([])
  const [isBlurred, setIsBlurred] = useState(false)
  const [isPulsing, setIsPulsing] = useState(false)
  const triggerDamageEffect = useMindMapStore(state => state.triggerDamageEffect)
  const clearDamageEffect = useMindMapStore(state => state.clearDamageEffect)
  const damageEffects = useMindMapStore(state => state.damageEffects)
  const showAlignmentFeedback = useMindMapStore(state => state.showAlignmentFeedback)
  
  useEffect(() => {
    if (!showAlignmentFeedback()) return
    if (overallAlignmentScore < 95 && overallAlignmentScore !== null) {
      triggerDamageEffect(overallAlignmentScore)
    }
  }, [overallAlignmentScore, triggerDamageEffect, showAlignmentFeedback])
  
  useEffect(() => {
    if (damageEffects.isActive) {
      const { intensity, type } = damageEffects
      
      if (type === 'barrage') {
        const hitCount = 8
        for (let i = 0; i < hitCount; i++) {
          setTimeout(() => {
            addEffect(intensity * 2, 150)
            if (i === 0) {
              playAlarm()
            }
          }, i * 100)
        }
        setIsPulsing(true)
        setTimeout(() => setIsPulsing(false), 5000)
      } else if (type === 'multi') {
        const score = overallAlignmentScore ?? 100
        const hitCount = score < 20 ? 4 : score < 30 ? 3 : 2
        for (let i = 0; i < hitCount; i++) {
          setTimeout(() => {
            addEffect(intensity, 125)
          }, i * 200)
        }
      } else {
        addEffect(intensity, intensity > 1 ? 375 : 250)
      }
      
      clearDamageEffect()
    }
  }, [damageEffects, overallAlignmentScore, clearDamageEffect])
  
  const addEffect = (intensity, duration) => {
    const effectId = Date.now() + Math.random()
    const effect = {
      id: effectId,
      intensity,
      duration
    }
    
    setEffects(prev => [...prev, effect])
    setIsBlurred(true)
    
    setTimeout(() => {
      setEffects(prev => prev.filter(e => e.id !== effectId))
    }, duration)
    
    setTimeout(() => {
      setIsBlurred(false)
    }, duration + 1250)
  }
  
  const playAlarm = () => {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT')
      audio.play().catch(() => {})
    } catch (error) {
      console.warn('Could not play alarm sound')
    }
  }
  
  return (
    <>
      {effects.map(effect => (
        <div
          key={effect.id}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: `rgba(255, 0, 0, ${Math.min(0.8, effect.intensity * 0.3)})`,
            pointerEvents: 'none',
            zIndex: 9999,
            animation: `flash ${effect.duration}ms ease-out`
          }}
        />
      ))}
      
      {(isBlurred || isPulsing) && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backdropFilter: isBlurred ? 'blur(2px)' : 'none',
            backgroundColor: isPulsing ? 'rgba(255, 0, 0, 0.1)' : 'transparent',
            pointerEvents: 'none',
            zIndex: 9998,
            animation: isPulsing ? 'pulse 1s infinite' : 'none'
          }}
        />
      )}
      
      <style>{`
        @keyframes flash {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        
        @keyframes pulse {
          0%, 100% { backgroundColor: rgba(255, 0, 0, 0.05); }
          50% { backgroundColor: rgba(255, 0, 0, 0.15); }
        }
      `}</style>
    </>
  )
}

export default DamageEffect
