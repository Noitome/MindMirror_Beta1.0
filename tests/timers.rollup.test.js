
import { rollUpNodeTime, rollUpAllAncestors } from '../src/utils/rollup.js'

// Test data setup
const createTasks = () => ({
  'main1': { id: 'main1', timeSpent: 100, intervals: [{ duration: 100 }] },
  'sub1': { id: 'sub1', timeSpent: 50, intervals: [{ duration: 50 }] },
  'sub2': { id: 'sub2', timeSpent: 30, intervals: [{ duration: 30 }] },
  'subsub1': { id: 'subsub1', timeSpent: 20, intervals: [{ duration: 20 }] }
})

const createRelationships = () => ({
  'main1': { parent: null, children: ['sub1', 'sub2'] },
  'sub1': { parent: 'main1', children: ['subsub1'] },
  'sub2': { parent: 'main1', children: [] },
  'subsub1': { parent: 'sub1', children: [] }
})

test('rollUpNodeTime aggregates direct children time', () => {
  const tasks = createTasks()
  const relationships = createRelationships()
  
  const result = rollUpNodeTime(tasks, relationships, 'main1')
  
  // main1 should have its direct time (100) + sub1 (50) + sub2 (30) + subsub1 (20) = 200
  expect(result['main1'].timeSpent).toBe(200)
  expect(result['sub1'].timeSpent).toBe(50) // unchanged
  expect(result['sub2'].timeSpent).toBe(30) // unchanged
})

test('rollUpAllAncestors updates all parent levels', () => {
  const tasks = createTasks()
  const relationships = createRelationships()
  
  // Change subsub1 time and roll up
  const updatedTasks = {
    ...tasks,
    'subsub1': { ...tasks['subsub1'], timeSpent: 40 }
  }
  
  const result = rollUpAllAncestors(updatedTasks, relationships, 'subsub1')
  
  // sub1 should include subsub1's new time: 50 + 40 = 90
  expect(result['sub1'].timeSpent).toBe(90)
  // main1 should include all: 100 + 90 + 30 = 220
  expect(result['main1'].timeSpent).toBe(220)
})

test('rollup preserves task notes and intervals', () => {
  const tasks = {
    'parent': { 
      id: 'parent', 
      timeSpent: 60,
      intervals: [{ duration: 60, notes: [{ content: 'important note' }] }],
      someOtherProperty: 'preserved'
    },
    'child': { id: 'child', timeSpent: 40, intervals: [{ duration: 40 }] }
  }
  const relationships = {
    'parent': { parent: null, children: ['child'] },
    'child': { parent: 'parent', children: [] }
  }
  
  const result = rollUpNodeTime(tasks, relationships, 'parent')
  
  expect(result['parent'].timeSpent).toBe(100) // 60 + 40
  expect(result['parent'].intervals).toEqual(tasks['parent'].intervals)
  expect(result['parent'].someOtherProperty).toBe('preserved')
})

test('handles empty children gracefully', () => {
  const tasks = {
    'lone': { id: 'lone', timeSpent: 30, intervals: [{ duration: 30 }] }
  }
  const relationships = {
    'lone': { parent: null, children: [] }
  }
  
  const result = rollUpNodeTime(tasks, relationships, 'lone')
  
  expect(result['lone'].timeSpent).toBe(30) // unchanged
})
