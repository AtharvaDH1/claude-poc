import wrapper from '../util/ApiWrapper';
const fileUploadService = {
    
     fileUpload : async ({ claimNo, documentType, documentId, files }) => {
        const formData = new FormData();
        formData.append('claimNo', claimNo);
        formData.append('documentType', documentType);
        formData.append('documentId', documentId);

        files.forEach(file => {
            formData.append('files', file); // key should match backend expectation
        });

        try {
            const response = await wrapper.fetchWithToken('/upload/uploadFile', {
                method: 'POST',
                body: formData,
            });

            const payload = await response.json().catch(() => null);
            const message = payload?.message || payload?.msg || 'File uploaded successfully';
            return { ...(payload || {}), message };
        } catch (error) {
            console.error('Upload failed in service: FileUploadService.js FileUpload : ', error);
            throw error;

        }

    }

}

export default fileUploadService;