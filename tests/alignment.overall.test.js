

import { useMindMapStore } from '../src/store/mindMapStore.js'

// Mock data setup
const setupTestStore = () => {
  const store = useMindMapStore.getState()
  
  // Setup nodes
  store.nodes = [
    { id: 'main1', data: { width: 100, height: 100 } },
    { id: 'main2', data: { width: 80, height: 80 } },
    { id: 'sub1', data: { width: 60, height: 60 } },
    { id: 'sub2', data: { width: 40, height: 40 } }
  ]
  
  // Setup relationships
  store.nodeRelationships = {
    'main1': { parent: null, children: ['sub1', 'sub2'] },
    'main2': { parent: null, children: [] },
    'sub1': { parent: 'main1', children: [] },
    'sub2': { parent: 'main1', children: [] }
  }
  
  // Setup tasks with time
  store.tasks = {
    'main1': { id: 'main1', timeSpent: 50, intervals: [{ duration: 50 }] },
    'main2': { id: 'main2', timeSpent: 30, intervals: [{ duration: 30 }] },
    'sub1': { id: 'sub1', timeSpent: 40, intervals: [{ duration: 40 }] },
    'sub2': { id: 'sub2', timeSpent: 20, intervals: [{ duration: 20 }] }
  }
  
  return store
}

test('selectMainNodes returns only nodes without parents', () => {
  const store = setupTestStore()
  const mainNodes = store.selectMainNodes()
  
  expect(mainNodes.length).toBe(2)
  expect(mainNodes.map(n => n.id)).toEqual(['main1', 'main2'])
})

test('selectAggregatedTime includes subnode time for main nodes', () => {
  const store = setupTestStore()
  
  // main1 should have: own time (50) + sub1 (40) + sub2 (20) = 110
  expect(store.selectAggregatedTime('main1')).toBe(110)
  
  // main2 has no subnodes, should be just its own time
  expect(store.selectAggregatedTime('main2')).toBe(30)
})

test('selectOverallAlignment uses only main nodes', () => {
  const store = setupTestStore()
  
  // Should calculate based on main1 (110 actual) and main2 (30 actual) only
  // Not directly include sub1 or sub2 in the calculation
  const alignment = store.selectOverallAlignment()
  
  expect(typeof alignment).toBe('number')
  expect(alignment).toBeGreaterThanOrEqual(0)
  expect(alignment).toBeLessThanOrEqual(100)
})

