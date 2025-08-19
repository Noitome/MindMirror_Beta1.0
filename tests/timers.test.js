
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
