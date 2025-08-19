/**
 * MindMirror / Mindmap-App
 * © 2025 Daniel — First Public Disclosure: 2025-08-18 (AEST)
 * Licensed under MIT (see LICENSE). Non-code assets reserved.
 */

import { create } from 'zustand'
import { format } from 'date-fns'
import { rollUpAllAncestors } from '../utils/rollup.js'
import { persistence } from '../utils/persistence.js'
import { eventLogger, logTimerStart, logTimerStop, logAlignmentChange, logNodeMove, logNodeCreate, logNodeLink } from '../utils/eventLogger.js'

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

  startTimer: (taskId, note = null) => {
    set(state => {
      const task = state.tasks[taskId]
      if (!task || task.isRunning) return state

      const now = Date.now()
      
      const noteObj = {
        id: Date.now(),
        content: note || `Timer started at ${new Date(now).toLocaleString()}`,
        createdAt: now,
        type: 'start_note'
      }

      const runningInterval = {
        start: now,
        notes: [noteObj]
      }

      logTimerStart(taskId)

      return {
        tasks: {
          ...state.tasks,
          [taskId]: {
            ...task,
            isRunning: true,
            startTime: now,
            runningInterval
          }
        }
      }
    })
  },

  stopTimer: (taskId, note = null, options = null) => {
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

      let updatedTasks = { ...state.tasks }
      
      if (options && options.type) {
        const { nodeRelationships } = state
        const hasSubnodes = nodeRelationships[taskId]?.children?.length > 0
        
        if (hasSubnodes && options.type === 'allocate_existing' && options.subnodeId) {
          const subnodeTask = updatedTasks[options.subnodeId]
          if (subnodeTask) {
            const allocationInterval = {
              start: task.startTime,
              end: now,
              duration: elapsed,
              notes: [{
                id: Date.now(),
                content: `Allocated from parent: ${note || 'Timer stopped'}`,
                createdAt: now,
                type: 'allocation'
              }],
              isAllocation: true
            }
            
            updatedTasks[options.subnodeId] = {
              ...subnodeTask,
              timeSpent: subnodeTask.timeSpent + elapsed,
              intervals: [...(subnodeTask.intervals || []), allocationInterval],
              lastWorkedOn: now
            }
          }
          
          updatedTasks[taskId] = {
            ...task,
            isRunning: false,
            runningInterval: null,
            lastWorkedOn: now
          }
        } else if (hasSubnodes && options.type === 'create_new' && options.newSubnodeName) {
          // Create new subnode and allocate time to it
          const newSubnodeId = `node_${Date.now()}`
          
          updatedTasks[newSubnodeId] = {
            id: newSubnodeId,
            name: options.newSubnodeName,
            timeSpent: elapsed,
            isRunning: false,
            startTime: null,
            intervals: [{
              start: task.startTime,
              end: now,
              duration: elapsed,
              notes: [{
                id: Date.now(),
                content: `Created from parent allocation: ${note || 'Timer stopped'}`,
                createdAt: now,
                type: 'creation'
              }]
            }],
            runningInterval: null,
            createdAt: now,
            lastWorkedOn: now
          }
          
          updatedTasks[taskId] = {
            ...task,
            isRunning: false,
            runningInterval: null,
            lastWorkedOn: now
          }
          
          return { 
            tasks: updatedTasks,
            pendingSubnodeCreation: {
              parentId: taskId,
              subnodeId: newSubnodeId,
              name: options.newSubnodeName
            }
          }
        } else {
          updatedTasks[taskId] = {
            ...task,
            isRunning: false,
            timeSpent: task.timeSpent + elapsed,
            intervals: [...(task.intervals || []), newInterval],
            runningInterval: null,
            lastWorkedOn: now
          }
        }
      } else {
        updatedTasks[taskId] = {
          ...task,
          isRunning: false,
          timeSpent: task.timeSpent + elapsed,
          intervals: [...(task.intervals || []), newInterval],
          runningInterval: null,
          lastWorkedOn: now
        }
      }

      const { nodeRelationships } = state
      if (nodeRelationships[taskId]?.parent && (!options || options.type === 'add_note')) {
        updatedTasks = rollUpAllAncestors(updatedTasks, nodeRelationships, taskId)
      }

      logTimerStop(taskId, elapsed)

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

      if (newRelationships[childId]?.parent) {
        console.warn('Cannot create sub-sub node: child already has a parent')
        return state
      }

      const isDescendant = (nodeId, ancestorId) => {
        const relationship = newRelationships[nodeId]
        if (!relationship?.parent) return false
        if (relationship.parent === ancestorId) return true
        return isDescendant(relationship.parent, ancestorId)
      }

      if (isDescendant(parentId, childId)) {
        console.warn('Cannot create circular relationship')
        return state
      }

      if (newRelationships[parentId]?.children?.length >= 10) {
        console.warn('Cannot add more than 10 subnodes to a parent')
        return state
      }

      if (!newRelationships[parentId]) {
        newRelationships[parentId] = { parent: null, children: [] }
      }

      if (!newRelationships[childId]) {
        newRelationships[childId] = { parent: null, children: [] }
      }

      if (newRelationships[childId].parent) {
        const oldParent = newRelationships[newRelationships[childId].parent]
        if (oldParent) {
          oldParent.children = oldParent.children.filter(id => id !== childId)
        }
      }

      newRelationships[childId].parent = parentId
      if (!newRelationships[parentId].children.includes(childId)) {
        newRelationships[parentId].children.push(childId)
      }

      const newEdge = {
        id: `${parentId}-${childId}`,
        source: parentId,
        target: childId,
        type: 'smoothstep'
      }

      logNodeLink(parentId, childId)

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
    set(state => {
      logNodeCreate(newNode.id, newNode.data)
      return {
        nodes: [...state.nodes, newNode]
      }
    })
  },

  addTask: (taskData) => {
    set(state => {
      const newNode = {
        id: taskData.id,
        type: 'task',
        position: { x: Math.random() * 400, y: Math.random() * 400 },
        data: {
          name: taskData.name,
          width: 150,
          height: 100,
          timeSpent: taskData.timeSpent || 0,
          isRunning: taskData.isRunning || false
        }
      }

      return {
        tasks: {
          ...state.tasks,
          [taskData.id]: taskData
        },
        nodes: [...state.nodes, newNode],
        lastNodeCreationTime: Date.now()
      }
    })
  },

  updateEdges: (edges) => {
    set({ edges })
  },

  updateTaskName: (id, name) => {
    set(state => {
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

  updateTaskSize: (taskId, width, height) => {
    set(state => {
      const updatedNodes = state.nodes.map(node => 
        node.id === taskId 
          ? { ...node, data: { ...node.data, width, height } }
          : node
      )

      return { nodes: updatedNodes }
    })
  },

  exportCSV: () => {
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
    
    if (children.length === 0) return 100

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
    const ratio = totalActual / totalTarget
    return Math.max(0, Math.min(100, Math.round(100 - Math.abs(ratio - 1) * 100)))
  },

  getStarRating: (alignmentScore) => {
    if (alignmentScore >= 90) return 5
    if (alignmentScore >= 80) return 4
    if (alignmentScore >= 70) return 3
    if (alignmentScore >= 60) return 2
    if (alignmentScore >= 50) return 1
    return 0
  },

  achievements: {
    crownCount: 0,
    lastCrownTime: null,
    crownColor: 'gold',
    isPermanentBackground: false
  },

  pendingSubnodeCreation: null,

  damageEffects: {
    isActive: false,
    intensity: 1,
    type: 'flash'
  },

  lastNodeCreationTime: null,
  isAnyPopupOpen: false,

  updateAchievements: (alignmentScore) => {
    set(state => {
      const newAchievements = { ...state.achievements }
      
      if (alignmentScore === 100 && state.achievements.crownCount === 0) {
        newAchievements.crownCount = 1
        newAchievements.lastCrownTime = Date.now()
      } else if (alignmentScore === 100 && Date.now() - state.achievements.lastCrownTime > 60000) {
        newAchievements.crownCount += 1
        newAchievements.lastCrownTime = Date.now()
      }
      
      if (newAchievements.crownCount >= 100) {
        newAchievements.crownColor = 'blue'
        newAchievements.isPermanentBackground = alignmentScore >= 40
      } else if (newAchievements.crownCount >= 10) {
        newAchievements.crownColor = 'blue'
      } else if (newAchievements.crownCount >= 5) {
        newAchievements.crownColor = 'green'
      }
      
      return { achievements: newAchievements }
    })
  },

  triggerDamageEffect: (alignmentScore) => {
    set(state => {
      if (alignmentScore >= 95) return state
      
      if (state.isAnyPopupOpen) return state
      
      if (state.lastNodeCreationTime && Date.now() - state.lastNodeCreationTime < 5000) {
        return state
      }
      
      let intensity = 1
      let type = 'flash'
      
      if (alignmentScore < 10) {
        intensity = 5
        type = 'barrage'
      } else if (alignmentScore < 20) {
        intensity = 4
        type = 'multi'
      } else if (alignmentScore < 30) {
        intensity = 3
        type = 'multi'
      } else if (alignmentScore < 40) {
        intensity = 2
        type = 'double'
      } else if (alignmentScore < 50) {
        intensity = 1.5
        type = 'flash'
      }
      
      return {
        damageEffects: {
          isActive: true,
          intensity,
          type,
          timestamp: Date.now()
        }
      }
    })
  },

  setPopupOpen: (isOpen) => {
    set({ isAnyPopupOpen: isOpen })
  },

  clearDamageEffect: () => {
    set(state => ({
      damageEffects: { ...state.damageEffects, isActive: false }
    }))
  },

  saveState: async () => {
    const state = get()
    const saveData = {
      tasks: state.tasks,
      nodes: state.nodes,
      edges: state.edges,
      nodeRelationships: state.nodeRelationships,
      achievements: state.achievements,
      eventLog: eventLogger.exportEvents()
    }
    
    try {
      await persistence.saveLocal(saveData)
    } catch (error) {
      console.error('Failed to save state:', error)
    }
  },

  loadState: async () => {
    try {
      const data = await persistence.loadLocal()
      if (data) {
        set({
          tasks: data.tasks || {},
          nodes: data.nodes || [],
          edges: data.edges || [],
          nodeRelationships: data.nodeRelationships || {},
          achievements: data.achievements || {
            crownCount: 0,
            lastCrownTime: null,
            crownColor: 'gold',
            isPermanentBackground: false
          }
        })
        
        if (data.eventLog) {
          eventLogger.importEvents(data.eventLog)
        }
      }
    } catch (error) {
      console.error('Failed to load state:', error)
    }
  },

  exportData: async () => {
    const state = get()
    const exportData = {
      tasks: state.tasks,
      nodes: state.nodes,
      edges: state.edges,
      nodeRelationships: state.nodeRelationships,
      achievements: state.achievements,
      eventLog: eventLogger.exportEvents()
    }
    
    await persistence.exportData(exportData)
  }
}))

export default useMindMapStore
