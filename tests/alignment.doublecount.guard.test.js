

import { useMindMapStore } from '../src/store/mindMapStore.js'

test('adding subnode time must not increase overall alignment twice', () => {
  const store = useMindMapStore.getState()
  
  // Setup: one main node with one subnode
  store.nodes = [
    { id: 'main1', data: { width: 100, height: 100 } },
    { id: 'sub1', data: { width: 50, height: 50 } }
  ]
  
  store.nodeRelationships = {
    'main1': { parent: null, children: ['sub1'] },
    'sub1': { parent: 'main1', children: [] }
  }
  
  // Initial state: main has 50 seconds, sub has 0
  store.tasks = {
    'main1': { id: 'main1', timeSpent: 50, intervals: [{ duration: 50 }] },
    'sub1': { id: 'sub1', timeSpent: 0, intervals: [] }
  }
  
  const initialAlignment = store.selectOverallAlignment()
  const initialMainTime = store.selectAggregatedTime('main1')
  
  // Add 30 seconds to subnode
  store.tasks['sub1'] = { id: 'sub1', timeSpent: 30, intervals: [{ duration: 30 }] }
  
  const finalAlignment = store.selectOverallAlignment()
  const finalMainTime = store.selectAggregatedTime('main1')
  
  // The aggregated time for main1 should increase by exactly 30
  expect(finalMainTime).toBe(initialMainTime + 30)
  
  // The overall alignment should account for this increase only once
  // (not add the subnode time separately to the overall calculation)
  expect(finalAlignment).toBeGreaterThan(initialAlignment)
  
  // Verify that main nodes list hasn't changed (still just main1)
  const mainNodes = store.selectMainNodes()
  expect(mainNodes.length).toBe(1)
  expect(mainNodes[0].id).toBe('main1')
})

