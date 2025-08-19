import React from 'react'
import { useMindMapStore } from '../store/mindMapStore'

const StarRating = ({ alignmentScore, size = 20 }) => {
  const getStarRating = useMindMapStore(state => state.getStarRating)
  const starCount = getStarRating(alignmentScore)
  
  const isPulsing = alignmentScore === 100
  
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '2px'
    }}>
      {[1, 2, 3, 4, 5].map(star => (
        <span
          key={star}
          style={{
            fontSize: `${size}px`,
            color: star <= starCount ? '#ffd700' : '#ddd',
            animation: isPulsing && star <= starCount ? 'pulse 2s infinite' : 'none'
          }}
        >
          ★
        </span>
      ))}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }
      `}</style>
    </div>
  )
}

export default StarRating
