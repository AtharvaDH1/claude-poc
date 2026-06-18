import ApiWrapper from '../util/ApiWrapper';

export const getDocumentList = () => ApiWrapper.fetchWithToken('documents/documentList');

export const getUploadedDocumentList = (claimId) =>
  ApiWrapper.fetchWithToken('uploaded/uploadedDocuments', {
    method: 'POST',
    body: JSON.stringify({ claimId }),
  });

export const getUploadedDocumentListCount = () => ApiWrapper.fetchWithToken('uploaded/getDocumentCount');

const documentService = { getDocumentList, getUploadedDocumentList, getUploadedDocumentListCount };
export default documentService;
