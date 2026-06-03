import api from './api'

export const getDocuments = async (claimId) => {
  const res = await api.get(`/uploaded/${claimId}`)
  return res.data
}

export const uploadDocument = async (claimId, file, documentType) => {
  const form = new FormData()
  form.append('file', file)
  form.append('claimId', claimId)
  form.append('documentType', documentType || 'Supporting Document')
  const res = await api.post('/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  return res.data
}

export const deleteDocument = async (docId) => {
  await api.delete(`/uploaded/${docId}`)
}
