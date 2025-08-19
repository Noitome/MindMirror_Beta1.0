class EventLogger {
  constructor() {
    this.events = []
    this.maxEvents = 10000
  }
  
  logEvent(type, data) {
    const event = {
      id: Date.now() + Math.random(),
      timestamp: Date.now(),
      type,
      data: JSON.parse(JSON.stringify(data))
    }
    
    this.events.push(event)
    
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents)
    }
  }
  
  getEvents(startTime = 0, endTime = Date.now()) {
    return this.events.filter(event => 
      event.timestamp >= startTime && event.timestamp <= endTime
    )
  }
  
  clearEvents() {
    this.events = []
  }
  
  exportEvents() {
    return [...this.events]
  }
  
  importEvents(events) {
    this.events = [...events]
  }
  
  generateTimelapse(startTime, endTime, speedMultiplier = 10) {
    const events = this.getEvents(startTime, endTime)
    const duration = endTime - startTime
    const timelapseEvents = []
    
    events.forEach(event => {
      const relativeTime = (event.timestamp - startTime) / speedMultiplier
      timelapseEvents.push({
        ...event,
        timelapseTime: relativeTime
      })
    })
    
    return {
      events: timelapseEvents,
      duration: duration / speedMultiplier,
      speedMultiplier
    }
  }
}

export const eventLogger = new EventLogger()

export const logNodeMove = (nodeId, oldPosition, newPosition) => {
  eventLogger.logEvent('NODE_MOVE', {
    nodeId,
    oldPosition,
    newPosition
  })
}

export const logTimerStart = (taskId) => {
  eventLogger.logEvent('TIMER_START', { taskId })
}

export const logTimerStop = (taskId, duration) => {
  eventLogger.logEvent('TIMER_STOP', { taskId, duration })
}

export const logAlignmentChange = (oldAlignment, newAlignment) => {
  eventLogger.logEvent('ALIGNMENT_CHANGE', {
    oldAlignment,
    newAlignment
  })
}

export const logNodeCreate = (nodeId, nodeData) => {
  eventLogger.logEvent('NODE_CREATE', {
    nodeId,
    nodeData
  })
}

export const logNodeLink = (parentId, childId) => {
  eventLogger.logEvent('NODE_LINK', {
    parentId,
    childId
  })
}
