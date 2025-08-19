
/**
 * Pure helper for rolling up subnode time to parent nodes
 */

export function rollUpNodeTime(tasks, nodeRelationships, targetNodeId) {
  const result = { ...tasks }
  
  // Get all descendants of the target node
  const getDescendants = (nodeId) => {
    const children = nodeRelationships[nodeId]?.children || []
    const descendants = [...children]
    children.forEach(childId => {
      descendants.push(...getDescendants(childId))
    })
    return descendants
  }

  // Calculate total time from all descendants
  const descendants = getDescendants(targetNodeId)
  const totalDescendantTime = descendants.reduce((sum, nodeId) => {
    const task = tasks[nodeId]
    return sum + (task?.timeSpent || 0)
  }, 0)

  // Update the target node's aggregated time (preserve its own direct time)
  const targetTask = tasks[targetNodeId]
  if (targetTask) {
    // Get the node's own direct time (intervals not marked as subnode contributions)
    const directTime = (targetTask.intervals || []).reduce((sum, interval) => {
      return interval.isSubnodeContribution ? sum : sum + (interval.duration || 0)
    }, 0)

    result[targetNodeId] = {
      ...targetTask,
      timeSpent: directTime + totalDescendantTime
    }
  }

  return result
}

export function rollUpAllAncestors(tasks, nodeRelationships, changedNodeId) {
  let result = { ...tasks }
  let currentId = changedNodeId

  // Walk up the tree and update each ancestor
  while (nodeRelationships[currentId]?.parent) {
    const parentId = nodeRelationships[currentId].parent
    result = rollUpNodeTime(result, nodeRelationships, parentId)
    currentId = parentId
  }

  return result
}
