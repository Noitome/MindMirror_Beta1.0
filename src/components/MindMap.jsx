import React, { useCallback, useEffect, useRef } from 'react'
import ReactFlow, { 
  Background,
  Controls,
  ReactFlowProvider,
  applyEdgeChanges,
  applyNodeChanges,
  useReactFlow,
  addEdge
} from 'reactflow'
import 'reactflow/dist/style.css'
import TaskNode from './TaskNode'
import { useMindMapStore } from '../store/mindMapStore'
import RoutedEdge from './edges/RoutedEdge'

const nodeTypes = {
  task: TaskNode
}
const edgeTypes = {
  routed: RoutedEdge
}
const MindMapContent = () => {
  const allNodes = useMindMapStore(state => state.nodes)
  const allEdges = useMindMapStore(state => state.edges)
  const updateNodes = useMindMapStore(state => state.updateNodes)
  const updateEdges = useMindMapStore(state => state.updateEdges)
  const selectVisibleNodes = useMindMapStore(state => state.selectVisibleNodes)
  const selectVisibleEdges = useMindMapStore(state => state.selectVisibleEdges)
  const selectDepth = useMindMapStore(state => state.selectDepth)
  const initializeVisibilityOnResume = useMindMapStore(state => state.initializeVisibilityOnResume)
  const updateTaskSize = useMindMapStore(state => state.updateTaskSize)
  const linkNodes = useMindMapStore(state => state.linkNodes)
  const addNode = useMindMapStore(state => state.addNode)
  const addTask = useMindMapStore(state => state.addTask)
  const pendingSubnodeCreation = useMindMapStore(state => state.pendingSubnodeCreation)
  const { getNodes, fitView } = useReactFlow()
  const containerRef = useRef(null)
  const fitViewTimeoutRef = useRef(null)

  const onNodesChange = useCallback(
    (changes) => {
      const updatedNodes = applyNodeChanges(changes, allNodes)
      
      // Check for dimension changes
      changes.forEach(change => {
        if (change.type === 'dimensions' && change.dimensions) {
          updateTaskSize(change.id, change.dimensions.width, change.dimensions.height)
        }
      })
      
      updateNodes(updatedNodes)
    },
    [allNodes, updateNodes, updateTaskSize]
  )

  const onEdgesChange = useCallback(
    (changes) => {
      const updatedEdges = applyEdgeChanges(changes, allEdges)
      updateEdges(updatedEdges)
    },
    [allEdges, updateEdges]
  )

  const onConnect = useCallback(
    (connection) => {
      if (connection.source && connection.target) {
        linkNodes(connection.source, connection.target)
      }
    },
    [linkNodes]
  )

  useEffect(() => {
    try {
      initializeVisibilityOnResume()
    } catch (e) {
      console.warn('Visibility init failed', e)
    }
  }, [initializeVisibilityOnResume])
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

  useEffect(() => {
    if (pendingSubnodeCreation) {
      const { parentId, subnodeId, name } = pendingSubnodeCreation
      const parentNode = allNodes.find(n => n.id === parentId)
      
      if (parentNode) {
        const newNode = {
          id: subnodeId,
          type: 'task',
          position: {
            x: parentNode.position.x + 50,
            y: parentNode.position.y + 100
          },
          data: {
            name,
            width: 150,
            height: 100
          }
        }
        
        addNode(newNode)
        linkNodes(parentId, subnodeId)
        
        useMindMapStore.setState({ pendingSubnodeCreation: null })
        
        setTimeout(() => {
          try {
            fitView({ padding: 0.1, duration: 300 })
          } catch (error) {
            console.warn('FitView failed:', error)
          }
        }, 100)
      }
    }
  }, [pendingSubnodeCreation, allNodes, addNode, linkNodes, fitView])

  const visibleNodes = selectVisibleNodes()
  const visibleEdges = selectVisibleEdges()
  const nodes = visibleNodes.map(n => ({
    ...n,
    data: {
      ...n.data,
      depth: selectDepth(n.id)
    }
  }))
  const edges = visibleEdges
  useEffect(() => {
    const nodeCount = nodes.length
    if (nodeCount > 0) {
      setTimeout(() => {
        try {
          fitView({ padding: 0.1, duration: 300 })
        } catch (error) {
          console.warn('FitView failed:', error)
        }
      }, 100)
    }
  }, [nodes.length, fitView])

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
          fitView({ padding: 0.1, duration: 200, maxZoom: 1.5 })
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

    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onOrient)
    document.addEventListener('visibilitychange', onVis)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onOrient)
      document.removeEventListener('visibilitychange', onVis)
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
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        className="mm-full"
        style={{ width: '100%', height: '100%' }}
        fitView
        minZoom={0.2}
        maxZoom={2}
        defaultEdgeOptions={{
          style: {
            stroke: 'var(--mm-color-edge)',
            strokeWidth: 2,
            opacity: 0.75
          },
          type: 'routed'
        }}
        connectionLineStyle={{
          stroke: 'var(--mm-color-edge)',
          strokeWidth: 3,
          strokeDasharray: '6,6'
        }}
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
