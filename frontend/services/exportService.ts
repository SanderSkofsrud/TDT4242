import api from './api'

export async function exportMyData(): Promise<void> {
  const response = await api.get('/api/user/export', {
    responseType: 'blob',
  })

  const blob = new Blob([response.data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = 'ai-usage-export.json'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

