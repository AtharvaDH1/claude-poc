import wrapper from '../util/ApiWrapper';

const normalizeArrayPayload = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const documentService = {
    /** get all the documentType exist in the 'DocumentList' table. */
    getDocumentList: async () => {
      const response = await wrapper.fetchWithToken(`/documents/documentList`);
      const payload = await response.json().catch(() => null);
      const data = normalizeArrayPayload(payload);
      console.log('documentService.js >> documentList >>', data);
      return data;
    },

    /** get all the details from 'UploadedDocuments' table based on claimNumber */
    getUploadedDocumentList: async(claimId) =>{
      console.log('claimNumber Passing to Query',claimId);
      const response = await wrapper.fetchWithToken('/uploaded/uploadedDocuments', {
        method:'POST',
        headers:{
          'Content-Type': 'application/json',
        },
        body:JSON.stringify({claimId})
      });
      const payload = await response.json().catch(() => null);
      const claimNumberDocumentDetails = normalizeArrayPayload(payload);
      console.log('documentService.js getDocumentCount UploadedDocuments  >>:<< ', claimNumberDocumentDetails);
      return claimNumberDocumentDetails;
    },

    getUploadedDocumentListCount: async() =>{
      const response = await wrapper.fetchWithToken('/uploaded/getDocumentCount');
      const data = await response.json().catch(() => null);
      console.log('documentService.js getDocumentCount data >>:<< ', data);
      return data;
    },

    // addUploadedDocument : async(claimNo) =>{
    //     const response = await wrapper.fetchWithToken('/uploaded-Document/uploadedDocuments');
    //     const uploadedDocument = response.json();
    //     console.log('documentService.js > addUploadedDocument : ', uploadedDocument);
    //     return uploadedDocument;
    // }
  
  
}
  
  export default documentService;