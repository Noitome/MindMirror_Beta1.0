
function alignmentScore(targetSecs, actualSecs) {
  if (!targetSecs) return 0
  const ratio = Math.min(actualSecs / targetSecs, 2) // cap at 2x
  return Math.round(ratio * 50) // 1x -> 50, 2x -> 100
}

test('alignment increases with logged time up to a cap', () => {
  expect(alignmentScore(60, 0)).toBe(0)
  expect(alignmentScore(60, 60)).toBe(50)
  expect(alignmentScore(60, 120)).toBe(100)
  expect(alignmentScore(60, 240)).toBe(100)
})
