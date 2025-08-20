import React, { memo, useMemo, useState } from 'react'
import { Handle, Position } from 'reactflow'
import { NodeResizer } from '@reactflow/node-resizer'
import '@reactflow/node-resizer/dist/style.css'
import Timer from './Timer'
import Notes from './Notes'
import TimeAdjuster from './TimeAdjuster'
import { useMindMapStore } from '../store/mindMapStore'

const TaskNode = ({ id, data, selected }) => {
  const [showNotes, setShowNotes] = useState(false)
  const [showTimeAdjuster, setShowTimeAdjuster] = useState(false)
  const [showLinking, setShowLinking] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [mergeTargetId, setMergeTargetId] = useState('')
  
  const setPopupOpen = useMindMapStore(state => state.setPopupOpen)
  const [linkingMode, setLinkingMode] = useState(null) // 'parent' or 'child'
  
  React.useEffect(() => {
    const isAnyPopupOpen = showNotes || showTimeAdjuster || showLinking || showDeleteConfirm
    setPopupOpen(isAnyPopupOpen)
  }, [showNotes, showTimeAdjuster, showLinking, showDeleteConfirm, setPopupOpen])
  
  const updateTaskName = useMindMapStore(state => state.updateTaskName)
  const task = useMindMapStore(state => state.tasks[id])
  const linkNodes = useMindMapStore(state => state.linkNodes)
  const unlinkNodes = useMindMapStore(state => state.unlinkNodes)
  const nodeRelationships = useMindMapStore(state => state.nodeRelationships)
  const nodes = useMindMapStore(state => state.nodes)
  const isMainNode = useMindMapStore(state => state.isMainNode)
  const deleteNode = useMindMapStore(state => state.deleteNode)

  const handleNameChange = (e) => {
    updateTaskName(id, e.target.value)
  }

  const depth = data.depth || 0
  const railWidth = 3
  const rails = Array.from({ length: Math.min(depth, 6) })
  const railColor = 'var(--mm-color-rail)'

  const dynamicStyles = useMemo(() => {
    const width = data.width || 200
    const height = data.height || 150

    // Calculate font sizes based on box dimensions - no limits
    const baseFontSize = Math.min(width, height) * 0.08
    const nameFontSize = baseFontSize * 1.5
    const timerFontSize = baseFontSize
    const metadataFontSize = baseFontSize * 0.6
    const inputPadding = width * 0.05

    return {
      container: {
        padding: `${inputPadding}px`,
      },
      name: {
        fontSize: `${nameFontSize}px`,
        padding: `${inputPadding / 2}px`,
      },
      timer: {
        fontSize: `${timerFontSize}px`,
      },
      metadata: {
        fontSize: `${metadataFontSize}px`,
      }
    }
  }, [data.width, data.height])

  if (!task) return null

  return (
    <div 
      className="task-node" 
      onDoubleClick={() => {
        const hasChildren = (nodeRelationships[id]?.children || []).length > 0
        if (hasChildren) {
          useMindMapStore.getState().toggleCollapse(id)
        }
      }}
      style={{ 
        width: '100%', 
        height: '100%',
        position: 'relative',
        border: isMainNode(id) ? '3px solid #FF6B35' : nodeRelationships[id]?.parent ? '2px solid #007bff' : '2px solid #4CAF50',
        borderRadius: '8px',
        boxShadow: isMainNode(id) ? '0 4px 8px rgba(255,107,53,0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        ...dynamicStyles.container,
        backgroundColor: 'white'
      }}
    >
      <NodeResizer 
        color="#4CAF50"
        isVisible={selected}
        minWidth={50}
        minHeight={50}
        handleStyle={{
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          backgroundColor: '#4CAF50'
        }}
      />
      <Handle type="target" position={Position.Top} />
      <Handle type="target" position={Position.Bottom} />
      <Handle type="target" position={Position.Left} />
      <Handle type="target" position={Position.Right} />
      <Handle type="source" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      <Handle type="source" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <div 
        className="task-content" 
        style={{ 
          width: '100%', 
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          paddingLeft: `${Math.min(8 * (depth || 0), 32)}px`
        }}
      >
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: `${railWidth * Math.min(depth, 6)}px`,
          display: 'flex',
          gap: '1px',
          paddingLeft: '2px'
        }}>
          {rails.map((_, i) => (
            <div key={i} style={{ width: `${railWidth}px`, background: railColor, opacity: 0.25 + i * 0.1 }} />
          ))}
        </div>
        <div style={{ position: 'absolute', top: '6px', right: '6px', display: 'flex', alignItems: 'center', gap: '4px', zIndex: 2 }}>
          {(() => {
            const children = nodeRelationships[id]?.children || []
            const hasChildren = children.length > 0
            if (!hasChildren) return null
            const collapsed = useMindMapStore.getState().collapsed[id]
            return (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  useMindMapStore.getState().toggleCollapse(id)
                }}
                title={collapsed ? 'Expand' : 'Collapse'}
                style={{
                  padding: '2px 6px',
                  fontSize: Math.max(10, (data.width || 200) * 0.035) + 'px',
                  border: '1px solid #999',
                  borderRadius: '4px',
                  background: '#f6f6f6',
                  cursor: 'pointer'
                }}
              >
                {collapsed ? '▸' : '▾'} {children.length}
              </button>
            )
          })()}
        </div>
        <div className="task-metadata" style={{
          position: 'absolute',
          top: '5px',
          left: '5px',
          ...dynamicStyles.metadata,
          color: '#666',
          lineHeight: 1.2
        }}>
          {isMainNode(id) && <div style={{ color: '#FF6B35', fontWeight: 'bold' }}>🏠 MAIN</div>}
          {nodeRelationships[id]?.parent && <div style={{ color: '#007bff', fontWeight: 'bold' }}>📎 SUB</div>}
          {new Date(task.createdAt).toLocaleDateString()}
          {task.lastWorkedOn && (
            <div style={{ 
              fontSize: '0.8em',
              opacity: 0.8
            }}>
              Last: {new Date(task.lastWorkedOn).toLocaleDateString()}
            </div>
          )}
        </div>
        <input
          value={data.name || ''}
          onChange={handleNameChange}
          className="task-name"
          style={{ 
            ...dynamicStyles.name,
            width: '100%',
            textAlign: 'center',
            border: 'none',
            background: 'transparent',
            fontWeight: 'bold',
            boxSizing: 'border-box',
            lineHeight: 1.2
          }}
          onFocus={(e) => e.target.select()}
          onMouseDown={(e) => {
            if (window.getSelection().toString() !== '') {
              e.stopPropagation()
            }
          }}
        />
        <div style={{...dynamicStyles.timer, marginTop: '5px', width: '100%', height: '30%'}}>
          <Timer taskId={id} width={data.width} height={data.height} />
        </div>
        
        {/* Action buttons */}
        <div style={{
          display: 'flex',
          gap: '5px',
          justifyContent: 'center',
          marginTop: '10px',
          flexWrap: 'wrap'
        }}>
          <button 
            onClick={() => setShowNotes(!showNotes)}
            style={{
              padding: '4px 8px',
              fontSize: Math.max(8, (data.width || 200) * 0.03) + 'px',
              backgroundColor: showNotes ? '#007bff' : '#f8f9fa',
              color: showNotes ? 'white' : '#007bff',
              border: '1px solid #007bff',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            Notes
          </button>
          <button 
            onClick={() => setShowTimeAdjuster(!showTimeAdjuster)}
            style={{
              padding: '4px 8px',
              fontSize: Math.max(8, (data.width || 200) * 0.03) + 'px',
              backgroundColor: showTimeAdjuster ? '#ffc107' : '#f8f9fa',
              color: showTimeAdjuster ? 'white' : '#ffc107',
              border: '1px solid #ffc107',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            Adjust Time
          </button>
          <button 
            onClick={() => setShowLinking(!showLinking)}
            style={{
              padding: '4px 8px',
              fontSize: Math.max(8, (data.width || 200) * 0.03) + 'px',
              backgroundColor: showLinking ? '#28a745' : '#f8f9fa',
              color: showLinking ? 'white' : '#28a745',
              border: '1px solid #28a745',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            Link
          </button>
        </div>
        
        {/* Delete button - positioned bottom left, half size */}
        <button 
          onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
          style={{
            position: 'absolute',
            bottom: '5px',
            left: '5px',
            padding: '2px 4px',
            fontSize: Math.max(6, (data.width || 200) * 0.015) + 'px',
            backgroundColor: showDeleteConfirm ? '#dc3545' : '#f8f9fa',
            color: showDeleteConfirm ? 'white' : '#dc3545',
            border: '1px solid #dc3545',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          🗑️
        </button>
        
        {/* Popup modals */}
        {showNotes && (
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
          }} onClick={() => setShowNotes(false)}>
            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              minWidth: Math.min(400, window.innerWidth * 0.9) + 'px',
              maxWidth: Math.min(600, window.innerWidth * 0.95) + 'px',
              maxHeight: window.innerHeight * 0.9 + 'px',
              overflow: 'auto',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }} onClick={e => e.stopPropagation()}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '15px'
              }}>
                <h3 style={{ margin: 0 }}>Notes for {data.name}</h3>
                <button 
                  onClick={() => setShowNotes(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '20px',
                    cursor: 'pointer',
                    color: '#666'
                  }}
                >
                  ×
                </button>
              </div>
              <Notes taskId={id} />
            </div>
          </div>
        )}
        
        {showTimeAdjuster && (
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
          }} onClick={() => setShowTimeAdjuster(false)}>
            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              minWidth: Math.min(300, window.innerWidth * 0.9) + 'px',
              maxWidth: Math.min(500, window.innerWidth * 0.95) + 'px',
              maxHeight: window.innerHeight * 0.9 + 'px',
              overflow: 'auto',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }} onClick={e => e.stopPropagation()}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '15px'
              }}>
                <h3 style={{ margin: 0 }}>Adjust Time for {data.name}</h3>
                <button 
                  onClick={() => setShowTimeAdjuster(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '20px',
                    cursor: 'pointer',
                    color: '#666'
                  }}
                >
                  ×
                </button>
              </div>
              <TimeAdjuster taskId={id} onClose={() => setShowTimeAdjuster(false)} />
            </div>
          </div>
        )}

        {showLinking && (
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
          }} onClick={() => setShowLinking(false)}>
            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              minWidth: Math.min(400, window.innerWidth * 0.9) + 'px',
              maxWidth: Math.min(600, window.innerWidth * 0.95) + 'px',
              maxHeight: window.innerHeight * 0.9 + 'px',
              overflow: 'auto',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }} onClick={e => e.stopPropagation()}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '15px'
              }}>
                <h3 style={{ margin: 0 }}>Link Nodes for {data.name}</h3>
                <button 
                  onClick={() => setShowLinking(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '20px',
                    cursor: 'pointer',
                    color: '#666'
                  }}
                >
                  ×
                </button>
              </div>
              
              {/* Current relationships */}
              <div style={{ marginBottom: '20px' }}>
                <h4>Current Status:</h4>
                {isMainNode(id) ? (
                  <p style={{ color: '#28a745' }}>🏠 Main Node (largest in cluster)</p>
                ) : nodeRelationships[id]?.parent ? (
                  <p style={{ color: '#007bff' }}>📎 Subnode of: {nodes.find(n => n.id === nodeRelationships[id].parent)?.data.name}</p>
                ) : (
                  <p style={{ color: '#6c757d' }}>🔗 Independent node</p>
                )}
                
                {nodeRelationships[id]?.children?.length > 0 && (
                  <div>
                    <p>Subnodes:</p>
                    <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                      {nodeRelationships[id].children.map(childId => {
                        const childNode = nodes.find(n => n.id === childId)
                        return (
                          <li key={childId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            {childNode?.data.name}
                            <button
                              onClick={() => unlinkNodes(id, childId)}
                              style={{
                                marginLeft: '10px',
                                padding: '2px 6px',
                                backgroundColor: '#dc3545',
                                color: 'white',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              Unlink
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}
              </div>
              
              {/* Available nodes to link */}
              <div>
                <h4>Available Nodes:</h4>
                <div style={{ maxHeight: '200px', overflow: 'auto' }}>
                  {nodes.filter(node => 
                    node.id !== id && 
                    nodeRelationships[id]?.parent !== node.id &&
                    !nodeRelationships[id]?.children?.includes(node.id)
                  ).map(node => (
                    <div key={node.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px',
                      border: '1px solid #eee',
                      borderRadius: '4px',
                      marginBottom: '5px'
                    }}>
                      <span>{node.data.name}</span>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button
                          onClick={() => {
                            linkNodes(node.id, id)
                            setShowLinking(false)
                          }}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Make Parent
                        </button>
                        <button
                          onClick={() => {
                            linkNodes(id, node.id)
                            setShowLinking(false)
                          }}
                          disabled={nodeRelationships[node.id]?.parent}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: nodeRelationships[node.id]?.parent ? '#ccc' : '#28a745',
                            color: nodeRelationships[node.id]?.parent ? '#666' : 'white',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: nodeRelationships[node.id]?.parent ? 'not-allowed' : 'pointer',
                            fontSize: '12px'
                          }}
                          title={nodeRelationships[node.id]?.parent ? 'Cannot create sub-sub nodes' : 'Make this node a child'}
                        >
                          Make Child
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {showDeleteConfirm && (
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
          }} onClick={() => setShowDeleteConfirm(false)}>
            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              minWidth: Math.min(400, window.innerWidth * 0.9) + 'px',
              maxWidth: Math.min(600, window.innerWidth * 0.95) + 'px',
              maxHeight: window.innerHeight * 0.9 + 'px',
              overflow: 'auto',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }} onClick={e => e.stopPropagation()}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '15px'
              }}>
                <h3 style={{ margin: 0, color: '#dc3545' }}>Delete {data.name}</h3>
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '20px',
                    cursor: 'pointer',
                    color: '#666'
                  }}
                >
                  ×
                </button>
              </div>
              
              <p style={{ marginBottom: '20px' }}>
                What would you like to do with this node's data?
              </p>
              
              <div style={{ marginBottom: '20px' }}>
                <h4>Merge with another node:</h4>
                <select
                  value={mergeTargetId}
                  onChange={(e) => setMergeTargetId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                    marginBottom: '10px'
                  }}
                >
                  <option value="">Select a node to merge with...</option>
                  {nodes.filter(node => node.id !== id).map(node => (
                    <option key={node.id} value={node.id}>
                      {node.data.name}
                    </option>
                  ))}
                </select>
                <p style={{ fontSize: '12px', color: '#666', margin: '5px 0' }}>
                  Time and notes will be merged. Notes will show source node name in brackets.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    deleteNode(id, null)
                    setShowDeleteConfirm(false)
                  }}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Delete Only
                </button>
                <button
                  onClick={() => {
                    if (mergeTargetId) {
                      deleteNode(id, { targetNodeId: mergeTargetId })
                      setShowDeleteConfirm(false)
                      setMergeTargetId('')
                    }
                  }}
                  disabled={!mergeTargetId}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: mergeTargetId ? '#28a745' : '#ccc',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: mergeTargetId ? 'pointer' : 'not-allowed'
                  }}
                >
                  Merge & Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default memo(TaskNode)
