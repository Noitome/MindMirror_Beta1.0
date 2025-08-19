import React, { useCallback, useEffect, useRef } from 'react'
import ReactFlow, { 
  Background,
  Controls,
  ReactFlowProvider,
  applyEdgeChanges,
  applyNodeChanges,
  useReactFlow
} from 'reactflow'
import 'reactflow/dist/style.css'
import TaskNode from './TaskNode'
import { useMindMapStore } from '../store/mindMapStore'

const nodeTypes = {
  task: TaskNode
}

const MindMapContent = () => {
  const nodes = useMindMapStore(state => state.nodes)
  const edges = useMindMapStore(state => state.edges)
  const updateNodes = useMindMapStore(state => state.updateNodes)
  const updateEdges = useMindMapStore(state => state.updateEdges)
  const updateTaskSize = useMindMapStore(state => state.updateTaskSize)
  const { getNodes, fitView } = useReactFlow()
  const containerRef = useRef(null)
  const fitViewTimeoutRef = useRef(null)

  const onNodesChange = useCallback(
    (changes) => {
      const updatedNodes = applyNodeChanges(changes, nodes)
      
      // Check for dimension changes
      changes.forEach(change => {
        if (change.type === 'dimensions' && change.dimensions) {
          updateTaskSize(change.id, change.dimensions.width, change.dimensions.height)
        }
      })
      
      updateNodes(updatedNodes)
    },
    [nodes, updateNodes, updateTaskSize]
  )

  const onEdgesChange = useCallback(
    (changes) => {
      const updatedEdges = applyEdgeChanges(changes, edges)
      updateEdges(updatedEdges)
    },
    [edges, updateEdges]
  )

  // Sync node dimensions with store
  useEffect(() => {
    const syncDimensions = () => {
      const currentNodes = getNodes()
      currentNodes.forEach(node => {
        if (node.width && node.height) {
          updateTaskSize(node.id, node.width, node.height)
        }
      })
    }
    
    const interval = setInterval(syncDimensions, 100)
    return () => clearInterval(interval)
  }, [getNodes, updateTaskSize])

  // Enhanced resize, orientation, and visibility handling
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const debouncedFitView = () => {
      if (fitViewTimeoutRef.current) {
        clearTimeout(fitViewTimeoutRef.current)
      }
      fitViewTimeoutRef.current = setTimeout(() => {
        try {
          fitView({ padding: 0.1, duration: 200 })
        } catch (error) {
          console.warn('FitView failed:', error)
        }
      }, 150)
    }

    // Initial fit
    debouncedFitView()

    const resizeObserver = new ResizeObserver(debouncedFitView)
    resizeObserver.observe(container)

    const onResize = () => debouncedFitView()
    const onOrient = () => debouncedFitView()
    const onVis = () => { 
      if (document.visibilityState === 'visible') {
        debouncedFitView()
      }
    }

    // Listen to multiple events for comprehensive coverage
    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onOrient)
    document.addEventListener('visibilitychange', onVis)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onOrient)
      document.addEventListener('visibilitychange', onVis)
      if (fitViewTimeoutRef.current) {
        clearTimeout(fitViewTimeoutRef.current)
      }
    }
  }, [fitView])

  return (
    <div ref={containerRef} className="mm-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        className="mm-full"
        style={{ width: '100%', height: '100%' }}
        fitView
        minZoom={0.2}
        maxZoom={2}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  )
}

const MindMap = () => {
  return (
    <ReactFlowProvider>
      <MindMapContent />
    </ReactFlowProvider>
  )
}

export default MindMap
