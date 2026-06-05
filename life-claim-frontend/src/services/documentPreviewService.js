import { API_URL } from '../util/config'

const baseUrl = `${API_URL || ''}/api`

/** Open Alfresco-backed preview with JWT (avoids 401 on plain new-tab links). */
export async function openDocumentPreview(nodeId) {
  if (!nodeId) throw new Error('Missing document node id')
  const token = sessionStorage.getItem('token')
  const res = await fetch(`${baseUrl}/document/preview/${encodeURIComponent(nodeId)}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    if (res.status === 403) {
      throw new Error('You are not allowed to preview this document.')
    }
    throw new Error(text || `Preview failed (${res.status})`)
  }
  const blob = await res.blob()
  const contentType = res.headers.get('content-type') || blob.type || 'application/octet-stream'
  const typedBlob = blob.type ? blob : new Blob([blob], { type: contentType })
  const url = URL.createObjectURL(typedBlob)
  const win = window.open(url, '_blank', 'noopener,noreferrer')
  if (!win) {
    URL.revokeObjectURL(url)
    throw new Error('Pop-up blocked. Allow pop-ups to preview documents.')
  }
  setTimeout(() => URL.revokeObjectURL(url), 120000)
}
