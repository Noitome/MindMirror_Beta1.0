import { formatTime } from './time'

export function exportToCSV(timers) {
  const rows = [
    ['Task Name', 'Total Time (hh:mm:ss)'],
    ...timers.map(timer => [timer.name || 'Untitled', formatTime(timer.time)])
  ]

  const csvContent = rows
    .map(row => row.join(','))
    .join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `time_tracking_${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
