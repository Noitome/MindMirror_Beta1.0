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
import { isAuthEnabled } from '../utils/firebase.js'

export const useMindMapStore = create((set, get) => ({
  nodes: [],
  edges: [],
  tasks: {},
  nodeRelationships: {}, // { nodeId: { parent: parentId, children: [childIds] } }
  goalCounter: 0,
  nodeCreationTime: null,
  popupOpen: false,
  
  user: null,
  isAuthenticated: false,
  isGuest: true,
  syncStatus: 'idle',
  syncError: null,
  
  alignmentFeedbackThresholdMs: 300000,
  collapsed: {},

  selectDepth: (nodeId) => {
    const { nodeRelationships } = get()
    let depth = 0
    let current = nodeId
    while (nodeRelationships[current]?.parent) {
      depth += 1
      current = nodeRelationships[current].parent
    }
    return depth
  },

  selectLastTrackedTaskId: () => {
    const { tasks } = get()
    let lastId = null
    let lastTime = -1
    Object.values(tasks).forEach(t => {
      const tLast = t.lastWorkedOn || 0
      if (tLast > lastTime) {
        lastTime = tLast
        lastId = t.id
      }
    })
    return lastId
  },

  selectTotalTrackedMs: () => {
    const { tasks } = get()
    let total = 0
    Object.values(tasks).forEach(t => {
      total += (t.timeSpent || 0) * 1000
      if (t.isRunning && t.runningInterval?.start) {
        total += (Date.now() - t.runningInterval.start)
      }
    })
    return total
  },

  selectHasNonTrivialTime: (minMs = 60000) => {
    const total = get().selectTotalTrackedMs()
    return total >= minMs
  },

  showAlignmentFeedback: () => {
    const { alignmentFeedbackThresholdMs } = get()
    const total = get().selectTotalTrackedMs()
    return total >= alignmentFeedbackThresholdMs
  },

  toggleCollapse: (nodeId) => {
    set(state => ({
      collapsed: {
        ...state.collapsed,
        [nodeId]: !state.collapsed[nodeId]
      }
    }))
  },

  selectVisibleNodes: () => {
    const { nodes, nodeRelationships, collapsed } = get()
    const isHiddenByAncestor = (id) => {
      let current = id
      while (nodeRelationships[current]?.parent) {
        const parent = nodeRelationships[current].parent
        if (collapsed[parent]) return true
        current = parent
      }
      return false
    }
    return nodes.filter(n => !isHiddenByAncestor(n.id))
  },

  selectVisibleEdges: () => {
    const { edges } = get()
    const visibleIds = new Set(get().selectVisibleNodes().map(n => n.id))
    return edges.filter(e => visibleIds.has(e.source) && visibleIds.has(e.target))
  },

  initializeVisibilityOnResume: () => {
    const state = get()
    const lastId = state.selectLastTrackedTaskId()
    const collapsed = {}

    Object.keys(state.nodeRelationships).forEach(id => {
      const rel = state.nodeRelationships[id]
      if (rel?.parent) {
        collapsed[rel.parent] = collapsed[rel.parent] || false
      }
    })
    Object.keys(state.nodeRelationships).forEach(id => {
      const rel = state.nodeRelationships[id]
      if (rel?.children?.length) {
        collapsed[id] = true
      }
    })

    if (lastId && state.nodeRelationships[lastId]?.parent) {
      let current = lastId
      while (state.nodeRelationships[current]?.parent) {
        const parent = state.nodeRelationships[current].parent
        collapsed[parent] = false
        current = parent
      }
    }

    set({ collapsed })
  },
  setPopupOpen: (isOpen) => {
    set({ popupOpen: isOpen })
  },

  setUser: (user) => {
    if (!isAuthEnabled) {
      set({ user: null, isAuthenticated: false, isGuest: true })
      return
    }
    set({ 
      user, 
      isAuthenticated: !!user, 
      isGuest: !user 
    })
  },

  setSyncStatus: (status, error = null) => {
    set({ syncStatus: status, syncError: error })
  },

  login: async (provider, email = '', password = '') => {
    if (!isAuthEnabled) {
      throw new Error('Authentication is disabled. Set VITE_AUTH_ENABLED=true to enable authentication.')
    }
    set({ syncStatus: 'syncing' })
    try {
      const user = await persistence.login(provider, email, password)
      set({ 
        user, 
        isAuthenticated: true, 
        isGuest: false,
        syncStatus: 'success'
      })
      
      const state = get()
      const localData = {
        tasks: state.tasks,
        nodes: state.nodes,
        edges: state.edges,
        nodeRelationships: state.nodeRelationships,
        achievements: state.achievements,
        goalCounter: state.goalCounter,
        eventLog: eventLogger.exportEvents()
      }
      
      const syncResult = await persistence.syncData(localData)
      if (syncResult.synced && syncResult.data !== localData) {
        set({
          tasks: syncResult.data.tasks || {},
          nodes: syncResult.data.nodes || [],
          edges: syncResult.data.edges || [],
          nodeRelationships: syncResult.data.nodeRelationships || {},
          achievements: syncResult.data.achievements || {
            crownCount: 0,
            lastCrownTime: null,
            crownColor: 'gold',
            isPermanentBackground: false
          },
          goalCounter: syncResult.data.goalCounter || 0
        })
        
        if (syncResult.data.eventLog) {
          eventLogger.importEvents(syncResult.data.eventLog)
        }
      }
      
      return user
    } catch (error) {
      set({ syncStatus: 'error', syncError: error.message })
      throw error
    }
  },

  logout: async () => {
    if (!isAuthEnabled) {
      return
    }
    try {
      await persistence.logout()
      set({ 
        user: null, 
        isAuthenticated: false, 
        isGuest: true,
        syncStatus: 'idle',
        syncError: null
      })
    } catch (error) {
      console.error('Logout error:', error)
      throw error
    }
  },

  syncToCloud: async () => {
    if (!isAuthEnabled) {
      return
    }
    const state = get()
    if (!state.isAuthenticated || !state.user) {
      return
    }

    set({ syncStatus: 'syncing' })
    try {
      const saveData = {
        tasks: state.tasks,
        nodes: state.nodes,
        edges: state.edges,
        nodeRelationships: state.nodeRelationships,
        achievements: state.achievements,
        goalCounter: state.goalCounter,
        eventLog: eventLogger.exportEvents()
      }
      
      await persistence.saveCloud(state.user.uid, saveData)
      set({ syncStatus: 'success' })
    } catch (error) {
      set({ syncStatus: 'error', syncError: error.message })
      throw error
    }
  },

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
      
      const isMainNode = !state.nodeRelationships[taskId]?.parent
      if (isMainNode) {
        const runningSubnodes = (state.nodeRelationships[taskId]?.children || []).filter(childId => 
          updatedTasks[childId]?.isRunning
        )
        
        if (runningSubnodes.length > 0) {
          const subnodeDetails = runningSubnodes.map(childId => {
            const childTask = updatedTasks[childId]
            const childNode = state.nodes.find(n => n.id === childId)
            const childElapsed = Math.floor((now - childTask.startTime) / 1000)
            const minutes = Math.floor(childElapsed / 60)
            const seconds = childElapsed % 60
            return `${childNode?.data.name || 'Unnamed'} (${minutes}m ${seconds}s)`
          }).join(', ')
          
          const simultaneousNote = `Simultaneous timers detected: ${subnodeDetails} - total time shown in brackets`
          newInterval.notes = [...(newInterval.notes || []), {
            id: Date.now() + 1,
            content: simultaneousNote,
            createdAt: now,
            type: 'simultaneous_timer_note'
          }]
        }
      }
      
      if (options && options.type) {
        const hasSubnodes = state.nodeRelationships[taskId]?.children?.length > 0
        
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

      if (state.nodeRelationships[taskId]?.parent && (!options || options.type === 'add_note')) {
        updatedTasks = rollUpAllAncestors(updatedTasks, state.nodeRelationships, taskId)
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

      if (state.nodeRelationships[taskId]?.parent) {
        updatedTasks = rollUpAllAncestors(updatedTasks, state.nodeRelationships, taskId)
      }

      return { tasks: updatedTasks }
    })
  },

  findEmptyPosition: (newWidth, newHeight, existingNodes) => {
    const calculateOverlapPercentage = (rect1, rect2) => {
      const overlapX = Math.max(0, Math.min(rect1.x + rect1.width, rect2.x + rect2.width) - Math.max(rect1.x, rect2.x))
      const overlapY = Math.max(0, Math.min(rect1.y + rect1.height, rect2.y + rect2.height) - Math.max(rect1.y, rect2.y))
      const overlapArea = overlapX * overlapY
      const rect1Area = rect1.width * rect1.height
      const rect2Area = rect2.width * rect2.height
      const smallerArea = Math.min(rect1Area, rect2Area)
      return smallerArea > 0 ? overlapArea / smallerArea : 0
    }

    const checkPosition = (x, y) => {
      const newRect = { x, y, width: newWidth, height: newHeight }
      
      for (const node of existingNodes) {
        const nodeRect = { 
          x: node.position.x, 
          y: node.position.y, 
          width: node.data.width || 200, 
          height: node.data.height || 150 
        }
        
        if (calculateOverlapPercentage(newRect, nodeRect) > 0.15) {
          return false
        }
      }
      return true
    }

    const centerX = 200
    const centerY = 150
    const step = 50

    if (checkPosition(centerX, centerY)) {
      return { x: centerX, y: centerY }
    }

    for (let radius = 1; radius <= 20; radius++) {
      for (let angle = 0; angle < 360; angle += 45) {
        const x = centerX + Math.cos(angle * Math.PI / 180) * radius * step
        const y = centerY + Math.sin(angle * Math.PI / 180) * radius * step
        
        if (checkPosition(x, y)) {
          return { x, y }
        }
      }
    }

    return { x: Math.random() * 400, y: Math.random() * 300 }
  },

  updateTaskSize: (taskId, width, height) => {
    set(state => {
      const calculateOverlapPercentage = (rect1, rect2) => {
        const overlapX = Math.max(0, Math.min(rect1.x + rect1.width, rect2.x + rect2.width) - Math.max(rect1.x, rect2.x))
        const overlapY = Math.max(0, Math.min(rect1.y + rect1.height, rect2.y + rect2.height) - Math.max(rect1.y, rect2.y))
        const overlapArea = overlapX * overlapY
        const rect1Area = rect1.width * rect1.height
        const rect2Area = rect2.width * rect2.height
        const smallerArea = Math.min(rect1Area, rect2Area)
        return smallerArea > 0 ? overlapArea / smallerArea : 0
      }

      const currentNode = state.nodes.find(n => n.id === taskId)
      if (!currentNode) return state

      const newRect = { x: currentNode.position.x, y: currentNode.position.y, width, height }
      
      for (const otherNode of state.nodes) {
        if (otherNode.id !== taskId) {
          const otherRect = { 
            x: otherNode.position.x, 
            y: otherNode.position.y, 
            width: otherNode.data.width || 200, 
            height: otherNode.data.height || 150 
          }
          const overlapPercentage = calculateOverlapPercentage(newRect, otherRect)
          if (overlapPercentage > 0.15) {
            return state
          }
        }
      }

      const updatedNodes = state.nodes.map(node => 
        node.id === taskId 
          ? { ...node, data: { ...node.data, width, height } }
          : node
      )

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
        type: 'routed'
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
      const goalName = `Goal ${state.goalCounter + 1}`
      const newTaskData = { ...taskData, name: goalName }
      
      const newWidth = 200
      const newHeight = 150
      const position = state.findEmptyPosition(newWidth, newHeight, state.nodes)
      
      const newNode = {
        id: taskData.id,
        type: 'task',
        position,
        data: { name: goalName, width: newWidth, height: newHeight }
      }
      
      return {
        tasks: { ...state.tasks, [taskData.id]: newTaskData },
        nodes: [...state.nodes, newNode],
        goalCounter: state.goalCounter + 1,
        nodeCreationTime: Date.now()
      }
    })
  },

  updateEdges: (edges) => {
    set({ edges })
  },

  updateTaskName: (taskId, newName) => {
    set(state => {
      // Check if the new name follows "Goal X" pattern and update goalCounter if needed
      const goalMatch = newName.match(/^Goal (\d+)$/)
      let newGoalCounter = state.goalCounter
      
      if (goalMatch) {
        const goalNumber = parseInt(goalMatch[1])
        if (goalNumber > state.goalCounter) {
          newGoalCounter = goalNumber
        }
      }
      
      const existingNames = Object.values(state.tasks).map(task => task.name)
      if (existingNames.includes(newName) && state.tasks[taskId].name !== newName) {
        return state // Prevent duplicate names
      }
      
      return {
        tasks: {
          ...state.tasks,
          [taskId]: { ...state.tasks[taskId], name: newName }
        },
        nodes: state.nodes.map(node => 
          node.id === taskId 
            ? { ...node, data: { ...node.data, name: newName } }
            : node
        ),
        goalCounter: newGoalCounter
      }
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
      goalCounter: state.goalCounter,
      eventLog: eventLogger.exportEvents()
    }
    
    try {
      await persistence.saveLocal(saveData)
      
      if (state.isAuthenticated && state.user && persistence.isOnline) {
        try {
          await persistence.saveCloud(state.user.uid, saveData)
          set({ syncStatus: 'success' })
        } catch (error) {
          console.warn('Cloud sync failed:', error)
          set({ syncStatus: 'error', syncError: error.message })
        }
      }
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
          },
          goalCounter: data.goalCounter || 0
        })
        
        if (data.eventLog) {
          eventLogger.importEvents(data.eventLog)
        }
      }

      const unsubscribe = isAuthEnabled ? persistence.onAuthStateChanged((user) => {
        set({ 
          user, 
          isAuthenticated: !!user, 
          isGuest: !user 
        })
        
        if (user) {
          const state = get()
          const localData = {
            tasks: state.tasks,
            nodes: state.nodes,
            edges: state.edges,
            nodeRelationships: state.nodeRelationships,
            achievements: state.achievements,
            goalCounter: state.goalCounter,
            eventLog: eventLogger.exportEvents()
          }
          
          persistence.syncData(localData).then(syncResult => {
            if (syncResult.synced && syncResult.data !== localData) {
              set({
                tasks: syncResult.data.tasks || {},
                nodes: syncResult.data.nodes || [],
                edges: syncResult.data.edges || [],
                nodeRelationships: syncResult.data.nodeRelationships || {},
                achievements: syncResult.data.achievements || {
                  crownCount: 0,
                  lastCrownTime: null,
                  crownColor: 'gold',
                  isPermanentBackground: false
                },
                goalCounter: syncResult.data.goalCounter || 0,
                syncStatus: 'success'
              })
              
              if (syncResult.data.eventLog) {
                eventLogger.importEvents(syncResult.data.eventLog)
              }
            }
          }).catch(error => {
            console.warn('Auto-sync failed:', error)
            set({ syncStatus: 'error', syncError: error.message })
          })
        }
      }) : () => {}

      return unsubscribe
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
      goalCounter: state.goalCounter,
      eventLog: eventLogger.exportEvents()
    }
    
    await persistence.exportData(exportData)
  },

  deleteNode: (nodeId, mergeOptions = null) => {
    set(state => {
      const { tasks, nodes, nodeRelationships } = state
      const nodeToDelete = tasks[nodeId]
      
      if (!nodeToDelete) return state
      
      let updatedTasks = { ...tasks }
      let updatedNodes = nodes.filter(n => n.id !== nodeId)
      let updatedRelationships = { ...nodeRelationships }
      
      if (mergeOptions && mergeOptions.targetNodeId) {
        const targetNode = updatedTasks[mergeOptions.targetNodeId]
        if (targetNode) {
          updatedTasks[mergeOptions.targetNodeId] = {
            ...targetNode,
            timeSpent: targetNode.timeSpent + nodeToDelete.timeSpent,
            intervals: [
              ...(targetNode.intervals || []),
              ...(nodeToDelete.intervals || []).map(interval => ({
                ...interval,
                notes: (interval.notes || []).map(note => ({
                  ...note,
                  content: `(from ${nodeToDelete.name}) ${note.content}`,
                  backgroundColor: '#e3f2fd'
                }))
              }))
            ]
          }
        }
      }
      
      if (updatedRelationships[nodeId]) {
        const parent = updatedRelationships[nodeId].parent
        const children = updatedRelationships[nodeId].children || []
        
        if (parent && updatedRelationships[parent]) {
          updatedRelationships[parent].children = updatedRelationships[parent].children.filter(id => id !== nodeId)
        }
        
        children.forEach(childId => {
          if (updatedRelationships[childId]) {
            updatedRelationships[childId].parent = null
          }
        })
        
        delete updatedRelationships[nodeId]
      }
      
      delete updatedTasks[nodeId]
      
      return {
        tasks: updatedTasks,
        nodes: updatedNodes,
        nodeRelationships: updatedRelationships
      }
    })
  }
}))

export default useMindMapStore
