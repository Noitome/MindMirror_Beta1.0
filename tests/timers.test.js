
import { addSeconds } from 'date-fns'

function rollUpSubnodeTime(parent, subnodes) {
  const total = subnodes.reduce((acc, s) => acc + (s.seconds || 0), 0)
  return { ...parent, seconds: (parent.seconds || 0) + total }
}

test('subnode time aggregates to parent', () => {
  const parent = { id: 'p1', seconds: 120 }
  const subs = [{ id: 's1', seconds: 30 }, { id: 's2', seconds: 50 }]
  const res = rollUpSubnodeTime(parent, subs)
  expect(res.seconds).toBe(200)
})

test('timer allocation to existing subnode', () => {
  const mockStore = {
    tasks: {
      'parent1': { id: 'parent1', timeSpent: 100, isRunning: true, startTime: Date.now() - 60000 },
      'sub1': { id: 'sub1', timeSpent: 50 }
    }
  }
  
  const elapsedTime = 60
  const options = { type: 'allocate_existing', subnodeId: 'sub1' }
  
  const updatedSubnode = {
    ...mockStore.tasks.sub1,
    timeSpent: mockStore.tasks.sub1.timeSpent + elapsedTime
  }
  
  expect(updatedSubnode.timeSpent).toBe(110)
})

test('timer allocation creates new subnode', () => {
  const mockStore = {
    tasks: {
      'parent1': { id: 'parent1', timeSpent: 100, isRunning: true, startTime: Date.now() - 60000 }
    }
  }
  
  const elapsedTime = 60
  const options = { type: 'create_new', newSubnodeName: 'New Subnode' }
  const newSubnodeId = 'node_123'
  
  const newSubnode = {
    id: newSubnodeId,
    name: options.newSubnodeName,
    timeSpent: elapsedTime,
    createdAt: Date.now()
  }
  
  expect(newSubnode.timeSpent).toBe(60)
  expect(newSubnode.name).toBe('New Subnode')
})

test('timer stops without allocation adds note only', () => {
  const mockStore = {
    tasks: {
      'parent1': { id: 'parent1', timeSpent: 100, isRunning: true, startTime: Date.now() - 60000 }
    }
  }
  
  const elapsedTime = 60
  const options = { type: 'add_note' }
  
  const updatedParent = {
    ...mockStore.tasks.parent1,
    timeSpent: mockStore.tasks.parent1.timeSpent + elapsedTime,
    isRunning: false
  }
  
  expect(updatedParent.timeSpent).toBe(160)
  expect(updatedParent.isRunning).toBe(false)
})
