const { Document } = require('../models')
const axios  = require('axios')
const path   = require('path')
const logger = require('../config/logger')

// GET /api/documents/:claimId  — list documents for a claim
exports.getDocuments = async (req, res, next) => {
  try {
    const docs = await Document.findAll({ where: { claimId: req.params.claimId }, order: [['uploadedOn', 'DESC']] })
    return res.json(docs)
  } catch (err) { next(err) }
}

// GET /api/uploaded/:claimId  — same as above (original uses both endpoints)
exports.getUploadedDocuments = async (req, res, next) => {
  try {
    const docs = await Document.findAll({ where: { claimId: req.params.claimId }, order: [['uploadedOn', 'DESC']] })
    return res.json(docs)
  } catch (err) { next(err) }
}

// POST /api/upload  — upload document (to Alfresco if available, else local DB record)
exports.uploadDocument = async (req, res, next) => {
  try {
    const { claimId, documentType } = req.body
    const file = req.file

    if (!file)    return res.status(400).json({ message: 'No file uploaded.' })
    if (!claimId) return res.status(400).json({ message: 'claimId is required.' })

    let alfrescoFileId = null

    // Try Alfresco upload
    const alfrescoUrl = process.env.alfresco_API_URL
    const storageId   = process.env.DEV_DOCUMENT_STORAGE_LOCATION
    if (alfrescoUrl && storageId) {
      try {
        const FormData = require('form-data')
        const form = new FormData()
        form.append('filedata', file.buffer, { filename: file.originalname, contentType: file.mimetype })
        form.append('name', file.originalname)
        form.append('nodeType', 'cm:content')
        const alfRes = await axios.post(
          `${alfrescoUrl}${storageId}/children`,
          form,
          { headers: { ...form.getHeaders(), Authorization: `Basic ${Buffer.from(`${process.env.DMS_USER_ID}:${process.env.DMS_PASSWORD}`).toString('base64')}` }, timeout: 10000 }
        )
        alfrescoFileId = alfRes.data?.entry?.id
        logger.info(`Alfresco upload success: ${alfrescoFileId}`)
      } catch (alfErr) {
        logger.warn(`Alfresco upload failed: ${alfErr.message}. Saving reference only.`)
      }
    }

    const doc = await Document.create({
      claimId,
      fileName:       file.originalname,
      documentType:   documentType || 'Supporting Document',
      AlfrescoFileId: alfrescoFileId || `LOCAL-${Date.now()}`,
      alfrescoRepoId: storageId || 'local',
      uploadedOn:     new Date(),
      createdby:      req.user?.username || 'system',
    })

    return res.status(201).json({ message: 'Document uploaded.', document: doc })
  } catch (err) { next(err) }
}

// DELETE /api/uploaded/:docId
exports.deleteDocument = async (req, res, next) => {
  try {
    const doc = await Document.findByPk(req.params.docId)
    if (!doc) return res.status(404).json({ message: 'Document not found.' })
    await doc.destroy()
    return res.status(204).send()
  } catch (err) { next(err) }
}
