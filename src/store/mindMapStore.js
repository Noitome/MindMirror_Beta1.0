/**
 * MindMirror / Mindmap-App
 * © 2025 Daniel — First Public Disclosure: 2025-08-18 (AEST)
 * Licensed under MIT (see LICENSE). Non-code assets reserved.
 */

import { create } from 'zustand'
import { format } from 'date-fns'
import { rollUpAllAncestors } from '../utils/rollup.js'

export const useMindMapStore = create((set, get) => ({
  nodes: [],
  edges: [],
  tasks: {},
  nodeRelationships: {}, // { nodeId: { parent: parentId, children: [childIds] } }

  addNote: (taskId, content) => {
    set(state => {
      const task = state.tasks[taskId]
      if (!task) return state

      const note = {
        id: Date.now(),
        content,
        createdAt: Date.now(),
        type: 'note'
      }

      // If there's no running interval, create one
      const runningInterval = task.runningInterval || {
        start: Date.now(),
        notes: []
      }

      return {
        tasks: {
          ...state.tasks,
          [taskId]: {
            ...task,
            runningInterval: {
              ...runningInterval,
              notes: [...(runningInterval.notes || []), note]
            }
          }
        }
      }
    })
  },

  startTimer: (taskId) => {
    set(state => {
      const now = Date.now()
      return {
        tasks: {
          ...state.tasks,
          [taskId]: {
            ...state.tasks[taskId],
            isRunning: true,
            startTime: now,
            runningInterval: {
              start: now,
              notes: []
            }
          }
        }
      }
    })
  },

  stopTimer: (taskId, note = null) => {
    set(state => {
      const task = state.tasks[taskId]
      if (!task?.isRunning) return state

      const now = Date.now()
      const elapsed = Math.floor((now - task.startTime) / 1000)

      const newInterval = {
        ...task.runningInterval,
        end: now,
        duration: elapsed
      }

      if (note) {
        newInterval.notes = [...(newInterval.notes || []), {
          id: Date.now(),
          content: note,
          createdAt: now,
          type: 'stop_note'
        }]
      }

      const updatedTask = {
        ...task,
        isRunning: false,
        timeSpent: task.timeSpent + elapsed,
        intervals: [...(task.intervals || []), newInterval],
        runningInterval: null,
        lastWorkedOn: now
      }

      // Roll up time to all ancestor nodes
      const { nodeRelationships } = state
      let updatedTasks = { ...state.tasks, [taskId]: updatedTask }

      if (nodeRelationships[taskId]?.parent) {
        updatedTasks = rollUpAllAncestors(updatedTasks, nodeRelationships, taskId)
      }

      return { tasks: updatedTasks }
    })
  },

  updateRunningTime: (taskId) => {
    set(state => {
      const task = state.tasks[taskId]
      if (!task?.isRunning) return state

      const now = Date.now()
      const elapsed = Math.floor((now - task.startTime) / 1000)

      return {
        tasks: {
          ...state.tasks,
          [taskId]: {
            ...task,
            timeSpent: task.timeSpent + elapsed,
            startTime: now
          }
        }
      }
    })
  },

  adjustTime: (taskId, adjustment, note) => {
    set(state => {
      const task = state.tasks[taskId]
      if (!task) return state

      const now = Date.now()
      const newTimeSpent = Math.max(0, task.timeSpent + adjustment)

      // Create a new interval for the adjustment
      const adjustmentInterval = {
        start: now - Math.abs(adjustment) * 1000,
        end: now,
        duration: Math.abs(adjustment),
        notes: note ? [{ content: note, createdAt: now }] : [],
        isAdjustment: adjustment < 0
      }

      let updatedTasks = {
        ...state.tasks,
        [taskId]: {
          ...task,
          timeSpent: newTimeSpent,
          intervals: [...(task.intervals || []), adjustmentInterval],
          runningInterval: task.isRunning ? {
            ...task.runningInterval,
            start: now
          } : null,
          lastWorkedOn: now
        }
      }

      // Roll up time adjustments to ancestors
      const { nodeRelationships } = state
      if (nodeRelationships[taskId]?.parent) {
        updatedTasks = rollUpAllAncestors(updatedTasks, nodeRelationships, taskId)
      }

      return { tasks: updatedTasks }
    })
  },

  updateTaskSize: (taskId, width, height) => {
    set(state => {
      const { nodeRelationships } = state
      const relationship = nodeRelationships[taskId]

      // Check if this size conflicts with cluster siblings or parent
      const conflictingNodes = []

      if (relationship?.parent) {
        const parent = state.nodes.find(n => n.id === relationship.parent)
        if (parent && Math.abs(parent.data.width - width) < 10 && Math.abs(parent.data.height - height) < 10) {
          conflictingNodes.push(parent)
        }

        // Check siblings
        const siblings = nodeRelationships[relationship.parent]?.children?.filter(id => id !== taskId) || []
        siblings.forEach(siblingId => {
          const sibling = state.nodes.find(n => n.id === siblingId)
          if (sibling && Math.abs(sibling.data.width - width) < 10 && Math.abs(sibling.data.height - height) < 10) {
            conflictingNodes.push(sibling)
          }
        })
      }

      if (relationship?.children) {
        relationship.children.forEach(childId => {
          const child = state.nodes.find(n => n.id === childId)
          if (child && Math.abs(child.data.width - width) < 10 && Math.abs(child.data.height - height) < 10) {
            conflictingNodes.push(child)
          }
        })
      }

      // Adjust conflicting sizes
      let updatedNodes = state.nodes.map(node => {
        if (conflictingNodes.find(n => n.id === node.id)) {
          const adjustment = (Math.random() - 0.5) * 40 + 20 // Random adjustment of ±20-40px
          return {
            ...node,
            data: {
              ...node.data,
              width: Math.max(50, node.data.width + adjustment),
              height: Math.max(50, node.data.height + adjustment)
            }
          }
        }
        return node.id === taskId 
          ? { ...node, data: { ...node.data, width, height } }
          : node
      })

      return { nodes: updatedNodes }
    })
  },

  linkNodes: (parentId, childId) => {
    set(state => {
      const newRelationships = { ...state.nodeRelationships }

      // Initialize parent relationship if it doesn't exist
      if (!newRelationships[parentId]) {
        newRelationships[parentId] = { parent: null, children: [] }
      }

      // Initialize child relationship if it doesn't exist
      if (!newRelationships[childId]) {
        newRelationships[childId] = { parent: null, children: [] }
      }

      // Remove child from any existing parent
      if (newRelationships[childId].parent) {
        const oldParent = newRelationships[newRelationships[childId].parent]
        if (oldParent) {
          oldParent.children = oldParent.children.filter(id => id !== childId)
        }
      }

      // Set new relationship
      newRelationships[childId].parent = parentId
      if (!newRelationships[parentId].children.includes(childId)) {
        newRelationships[parentId].children.push(childId)
      }

      // Create edge
      const newEdge = {
        id: `${parentId}-${childId}`,
        source: parentId,
        target: childId,
        type: 'default'
      }

      return {
        nodeRelationships: newRelationships,
        edges: [...state.edges.filter(e => e.id !== newEdge.id), newEdge]
      }
    })
  },

  unlinkNodes: (parentId, childId) => {
    set(state => {
      const newRelationships = { ...state.nodeRelationships }

      if (newRelationships[childId]) {
        newRelationships[childId].parent = null
      }

      if (newRelationships[parentId]) {
        newRelationships[parentId].children = newRelationships[parentId].children.filter(id => id !== childId)
      }

      return {
        nodeRelationships: newRelationships,
        edges: state.edges.filter(e => e.id !== `${parentId}-${childId}`)
      }
    })
  },

  getMainNode: (nodeId) => {
    const { nodeRelationships } = get()
    let currentId = nodeId

    // Traverse up to find the root parent
    while (nodeRelationships[currentId]?.parent) {
      currentId = nodeRelationships[currentId].parent
    }

    return currentId
  },

  isMainNode: (nodeId) => {
    const { nodeRelationships } = get()
    return !nodeRelationships[nodeId]?.parent && nodeRelationships[nodeId]?.children?.length > 0
  },

  updateNodes: (newNodes) => {
    set({ nodes: newNodes })
  },

  addNode: (newNode) => {
    set(state => ({
      nodes: [...state.nodes, newNode]
    }))
  },

  updateEdges: (edges) => {
    set({ edges })
  },

  updateTaskName: (id, name) => {
    set(state => {
      // Check for existing task with the same name
      let existingTask = Object.values(state.tasks).find(task => task.name === name && task.id !== id)
      let newName = name
      let counter = 2

      while (existingTask) {
        newName = `${name} (${counter})`
        counter++
        existingTask = Object.values(state.tasks).find(task => task.name === newName && task.id !== id)
      }

      const updatedTasks = {
        ...state.tasks,
        [id]: {
          ...state.tasks[id],
          name: newName
        }
      }

      const updatedNodes = state.nodes.map(node => 
        node.id === id 
          ? { ...node, data: { ...node.data, name: newName } }
          : node
      )

      return {
        tasks: updatedTasks,
        nodes: updatedNodes
      }
    })
  },

  addTask: (id, name) => {
    set(state => {
      // Check for existing task with the same name
      let existingTask = Object.values(state.tasks).find(task => task.name === name)
      let newName = name
      let counter = 2

      while (existingTask) {
        newName = `${name} (${counter})`
        counter++
        existingTask = Object.values(state.tasks).find(task => task.name === newName)
      }

      return {
        tasks: {
          ...state.tasks,
          [id]: {
            id,
            name: newName,
            timeSpent: 0,
            isRunning: false,
            startTime: null,
            intervals: [],
            runningInterval: null,
            createdAt: Date.now(),
            lastWorkedOn: null
          }
        }
      }
    })
  },

  exportData: () => {
    const { tasks } = get()
    const rows = [
      ['Task Name', 'Start Time', 'End Time', 'Duration', 'Notes', 'Type']
    ]

    Object.values(tasks).forEach(task => {
      task.intervals.forEach(interval => {
        rows.push([
          task.name,
          format(new Date(interval.start), 'yyyy-MM-dd HH:mm:ss'),
          interval.end ? format(new Date(interval.end), 'yyyy-MM-dd HH:mm:ss') : 'Running',
          interval.duration ? `${Math.floor(interval.duration / 3600)}:${Math.floor((interval.duration % 3600) / 60)}:${interval.duration % 60}` : '',
          interval.notes?.map(n => n.content).join(' | ') || '',
          interval.isAdjustment ? 'Adjustment' : 'Timer'
        ])
      })
    })

    const csvContent = rows.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `mindmap_export_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  },

  // Selectors for alignment calculations
  selectMainNodes: () => {
    const { nodes, nodeRelationships } = get()
    return nodes.filter(node => !nodeRelationships[node.id]?.parent)
  },

  selectAggregatedTime: (nodeId) => {
    const { tasks, nodeRelationships } = get()
    const task = tasks[nodeId]
    if (!task) return 0

    // Get direct time from intervals not marked as subnode contributions
    const directTime = (task.intervals || []).reduce((sum, interval) => {
      return interval.isSubnodeContribution ? sum : sum + (interval.duration || 0)
    }, 0)

    // Get all descendant time
    const getDescendants = (id) => {
      const children = nodeRelationships[id]?.children || []
      const descendants = [...children]
      children.forEach(childId => {
        descendants.push(...getDescendants(childId))
      })
      return descendants
    }

    const descendants = getDescendants(nodeId)
    const descendantTime = descendants.reduce((sum, id) => {
      const descendantTask = tasks[id]
      return sum + (descendantTask?.timeSpent || 0)
    }, 0)

    return directTime + descendantTime
  },

  selectOverallAlignment: () => {
    const state = get()
    const mainNodes = state.selectMainNodes()
    
    if (mainNodes.length === 0) return 0

    let totalActual = 0
    let totalTarget = 0

    mainNodes.forEach(node => {
      const actual = state.selectAggregatedTime(node.id)
      const target = (node.data?.width || 50) * (node.data?.height || 50) / 100 // Convert bounding box to target seconds
      
      totalActual += actual
      totalTarget += target
    })

    if (totalTarget === 0) return 0
    return Math.min(100, Math.round((totalActual / totalTarget) * 100))
  },

  selectInternalAlignment: (mainNodeId) => {
    const { nodeRelationships, tasks } = get()
    const children = nodeRelationships[mainNodeId]?.children || []
    
    if (children.length === 0) return 100 // Perfect if no subnodes

    let totalActual = 0
    let totalTarget = 0

    children.forEach(childId => {
      const actual = tasks[childId]?.timeSpent || 0
      const childNode = get().nodes.find(n => n.id === childId)
      const target = childNode ? (childNode.data?.width || 50) * (childNode.data?.height || 50) / 100 : 0
      
      totalActual += actual
      totalTarget += target
    })

    if (totalTarget === 0) return 100
    return Math.min(100, Math.round((totalActual / totalTarget) * 100))
  }
}))