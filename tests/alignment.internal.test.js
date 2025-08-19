

import { useMindMapStore } from '../src/store/mindMapStore.js'

// Setup function
const setupInternalTestStore = () => {
  const store = useMindMapStore.getState()
  
  store.nodes = [
    { id: 'main1', data: { width: 100, height: 100 } },
    { id: 'sub1', data: { width: 60, height: 60 } },
    { id: 'sub2', data: { width: 40, height: 40 } }
  ]
  
  store.nodeRelationships = {
    'main1': { parent: null, children: ['sub1', 'sub2'] },
    'sub1': { parent: 'main1', children: [] },
    'sub2': { parent: 'main1', children: [] }
  }
  
  return store
}

test('selectInternalAlignment returns 100% for perfect match', () => {
  const store = setupInternalTestStore()
  
  // Setup perfect alignment: sub1 gets 36 target (60*60/100), sub2 gets 16 target (40*40/100)
  store.tasks = {
    'main1': { id: 'main1', timeSpent: 100, intervals: [{ duration: 100 }] },
    'sub1': { id: 'sub1', timeSpent: 36, intervals: [{ duration: 36 }] },
    'sub2': { id: 'sub2', timeSpent: 16, intervals: [{ duration: 16 }] }
  }
  
  const alignment = store.selectInternalAlignment('main1')
  expect(alignment).toBe(100)
})

test('selectInternalAlignment returns 100% for node with no children', () => {
  const store = setupInternalTestStore()
  
  // main2 has no children
  store.nodeRelationships['main2'] = { parent: null, children: [] }
  
  const alignment = store.selectInternalAlignment('main2')
  expect(alignment).toBe(100)
})

test('selectInternalAlignment calculates correctly for partial match', () => {
  const store = setupInternalTestStore()
  
  // Setup partial alignment: sub1 gets half its target time
  store.tasks = {
    'main1': { id: 'main1', timeSpent: 100, intervals: [{ duration: 100 }] },
    'sub1': { id: 'sub1', timeSpent: 18, intervals: [{ duration: 18 }] }, // Half of 36
    'sub2': { id: 'sub2', timeSpent: 16, intervals: [{ duration: 16 }] }  // Full 16
  }
  
  const alignment = store.selectInternalAlignment('main1')
  // Total actual: 34, total target: 52, alignment = 34/52 ≈ 65%
  expect(alignment).toBeGreaterThan(60)
  expect(alignment).toBeLessThan(70)
})

