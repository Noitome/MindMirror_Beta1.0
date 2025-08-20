import React, { useMemo, useEffect } from 'react'
import { useMindMapStore } from '../store/mindMapStore'
import StarRating from './StarRating'
import CrownAchievement from './CrownAchievement'
import DamageEffect from './DamageEffect'

const ListView = ({ showBackendData }) => {
  const tasks = useMindMapStore(state => state.tasks)
  const nodes = useMindMapStore(state => state.nodes)
  const selectOverallAlignment = useMindMapStore(state => state.selectOverallAlignment)
  const selectInternalAlignment = useMindMapStore(state => state.selectInternalAlignment)
  const isMainNode = useMindMapStore(state => state.isMainNode)
  const updateAchievements = useMindMapStore(state => state.updateAchievements)
  const triggerDamageEffect = useMindMapStore(state => state.triggerDamageEffect)
  
  const overallAlignment = selectOverallAlignment()
  
  const showAlignmentFeedback = useMindMapStore(state => state.showAlignmentFeedback)
  const hasNonTrivialTime = useMindMapStore(state => state.selectHasNonTrivialTime ? state.selectHasNonTrivialTime(60000) : false)
  useEffect(() => {
    updateAchievements(overallAlignment)
    if (!showAlignmentFeedback() || !hasNonTrivialTime) return

    if (overallAlignment < 95) {
      triggerDamageEffect(overallAlignment)
    }
  }, [overallAlignment, updateAchievements, triggerDamageEffect, showAlignmentFeedback, hasNonTrivialTime])

  const taskList = useMemo(() => {
    // Create array of tasks with their bounding box size data
    const taskData = Object.values(tasks).map(task => {
      const node = nodes.find(n => n.id === task.id)
      const width = node?.data?.width || 200
      const height = node?.data?.height || 100
      
      // Calculate bounding box size (width * height)
      const boundingBoxSize = width * height
      
      return {
        ...task,
        width,
        height,
        boundingBoxSize,
        timeSpent: task.timeSpent || 0
      }
    })

    // Calculate total time spent and total bounding box size
    const totalTime = taskData.reduce((sum, task) => sum + task.timeSpent, 0)
    const totalBoundingBoxSize = taskData.reduce((sum, task) => sum + task.boundingBoxSize, 0)
    
    if (totalTime === 0 || totalBoundingBoxSize === 0) {
      return taskData.map(task => ({
        ...task,
        expectedTimeRatio: 0,
        actualTimeRatio: 0,
        alignmentScore: 0,
        timeRatio: 0
      }))
    }

    // Calculate alignment scores based on how actual time distribution matches expected distribution
    return taskData.map(task => {
      // Expected time ratio based on bounding box size
      const expectedTimeRatio = task.boundingBoxSize / totalBoundingBoxSize
      
      // Actual time ratio
      const actualTimeRatio = task.timeSpent / totalTime
      
      // Calculate alignment score (100% = perfect match, 0% = completely off)
      // This measures how close actual time is to expected time
      const alignmentScore = Math.max(0, Math.min(100, Math.round(100 - (Math.abs(actualTimeRatio - expectedTimeRatio) * 100))))
      
      return {
        ...task,
        expectedTimeRatio,
        actualTimeRatio,
        alignmentScore,
        timeRatio: Math.min(100, Math.round(actualTimeRatio * 100))
      }
    }).sort((a, b) => b.boundingBoxSize - a.boundingBoxSize) // Sort by bounding box size descending
  }, [tasks, nodes])

  const totalAlignmentScore = useMemo(() => {
    if (taskList.length === 0) return 0
    
    // Calculate overall alignment score as average of individual alignment scores
    const validTasks = taskList.filter(task => task.alignmentScore !== undefined)
    if (validTasks.length === 0) return 0
    
    const averageAlignment = validTasks.reduce((sum, task) => sum + task.alignmentScore, 0) / validTasks.length
    
    return Math.round(averageAlignment)
  }, [taskList])

  const formatDuration = (seconds) => {
    if (seconds < 60) {
      return `${seconds}s`
    } else if (seconds < 3600) {
      return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
    } else if (seconds < 86400) {
      const h = Math.floor(seconds / 3600)
      const m = Math.floor((seconds % 3600) / 60)
      return `${h}h ${m}m`
    } else {
      const d = Math.floor(seconds / 86400)
      const h = Math.floor((seconds % 86400) / 3600)
      return `${d}d ${h}h`
    }
  }

  const getAlignmentColor = (score) => {
    const red = Math.round(255 * (100 - score) / 100)
    const green = Math.round(255 * score / 100)
    return `rgb(${red}, ${green}, 0)`
  }

  const isMobile = window.innerWidth <= 768
  const relativeFontSize = Math.max(16, Math.min(32, window.innerWidth * 0.02))

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    }}>
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: isMobile ? '10px' : '20px',
        paddingBottom: isMobile ? '140px' : '120px'
      }}>
        <h2 style={{ marginTop: 0 }}>Priority List (Ordered by Bounding Box Size)</h2>
        
        {taskList.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
            No tasks yet. Add some tasks to the mind map to see them here.
          </div>
        ) : (
          <>
            <div style={{
              display: 'grid',
              gap: '10px',
              marginBottom: '20px'
            }}>
              {taskList.map((task, index) => {
                const nodeRelationships = useMindMapStore.getState().nodeRelationships
                const isSubnode = nodeRelationships[task.id]?.parent
                const indentLevel = useMindMapStore.getState().selectDepth(task.id)
                
                return (
                <div key={task.id} style={{
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                  padding: isMobile ? '12px' : '15px',
                  position: 'relative',
                  minHeight: isMobile ? '60px' : 'auto',
                  marginLeft: `${indentLevel * 1.25}rem`,
                  width: `calc(100% - ${indentLevel * 1.25}rem)`,
                  borderLeft: isSubnode ? `4px solid rgba(0, 123, 255, ${Math.min(0.2 + 0.1 * indentLevel, 0.7)})` : '1px solid #dee2e6'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '8px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ 
                        margin: 0, 
                        color: '#333',
                        fontSize: isMobile ? '14px' : '16px',
                        lineHeight: 1.3,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        {index + 1}. {task.name}
                        {isMainNode(task.id) && (
                          <span style={{
                            fontSize: '12px',
                            color: '#666',
                            fontWeight: 'normal'
                          }}>
                            (Internal: {selectInternalAlignment(task.id)}%)
                          </span>
                        )}
                      </h4>
                      <div style={{
                        fontSize: isMobile ? '11px' : '12px',
                        color: '#666',
                        marginTop: '4px',
                        lineHeight: 1.3
                      }}>
                        {isMobile ? (
                          <>
                            <div>Size: {task.width}×{task.height} = {task.boundingBoxSize.toLocaleString()}px²</div>
                            <div>Expected: {Math.min(100, Math.round(task.expectedTimeRatio * 100))}% | Actual: {task.timeRatio}%</div>
                          </>
                        ) : (
                          <>
                            Size: {task.width}×{task.height} = {task.boundingBoxSize.toLocaleString()}px² | 
                            Expected: {Math.min(100, Math.round(task.expectedTimeRatio * 100))}% | 
                            Actual: {task.timeRatio}%
                          </>
                        )}
                      </div>
                    </div>
                    <div style={{
                      textAlign: 'right',
                      fontSize: isMobile ? '12px' : '14px'
                    }}>
                      <div style={{ 
                        fontWeight: 'bold',
                        fontSize: isMobile ? '13px' : '14px'
                      }}>
                        {formatDuration(task.timeSpent)}
                      </div>
                      <div style={{
                        color: getAlignmentColor(task.alignmentScore),
                        fontWeight: 'bold',
                        fontSize: isMobile ? '12px' : '14px'
                      }}>
                        {task.alignmentScore}% aligned
                      </div>
                    </div>
                  </div>
                  
                  <div style={{
                    height: '4px',
                    backgroundColor: '#e9ecef',
                    borderRadius: '2px',
                    overflow: 'hidden',
                    marginTop: '8px'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.min(100, task.alignmentScore)}%`,
                      backgroundColor: getAlignmentColor(task.alignmentScore),
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>
              )})}
            </div>
          </>
        )}
      </div>
      
      {/* Total Alignment Score */}
      <div style={{
        position: 'absolute',
        bottom: isMobile ? '10px' : '20px',
        left: isMobile ? '10px' : '20px',
        right: isMobile ? '10px' : '20px',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        border: '2px solid #333',
        borderRadius: '8px',
        padding: isMobile ? '12px' : '15px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
        zIndex: 10
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{
              fontSize: `${relativeFontSize}px`,
              fontWeight: 'bold',
              color: showAlignmentFeedback() ? getAlignmentColor(totalAlignmentScore) : '#333',
              lineHeight: 1,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              {totalAlignmentScore}%
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <StarRating alignmentScore={totalAlignmentScore} size={relativeFontSize * 0.8} />
                {!showAlignmentFeedback() && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(200,200,200,0.3)',
                      color: '#666',
                      fontSize: `${relativeFontSize * 0.4}px`,
                      fontWeight: 'bold',
                      borderRadius: '4px',
                      pointerEvents: 'none'
                    }}
                  >
                    Alignment pending
                  </div>
                )}
              </div>
            </div>
            <div style={{
              fontSize: `${relativeFontSize * 0.6}px`,
              color: '#666',
              marginTop: '2px'
            }}>
              Overall Alignment
            </div>
          </div>
          
          <div style={{
            fontSize: '12px',
            color: '#666',
            textAlign: 'right'
          }}>
            <div>Time vs Expected Distribution</div>
            <div>Based on Box Sizes</div>
          </div>
        </div>
        
        <div style={{
          height: '8px',
          backgroundColor: '#e9ecef',
          borderRadius: '4px',
          overflow: 'hidden',
          marginTop: '10px'
        }}>
          <div style={{
            height: '100%',
            backgroundColor: getAlignmentColor(totalAlignmentScore),
            width: `${Math.min(100, totalAlignmentScore)}%`,
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>
      
      <CrownAchievement alignmentScore={overallAlignment} />
      <DamageEffect overallAlignmentScore={overallAlignment} />
    </div>
  )
}

export default ListView
