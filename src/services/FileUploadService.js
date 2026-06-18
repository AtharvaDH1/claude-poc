const fileUpload = async (claimNo, documentType, documentId, files) => {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('claimNo', claimNo);
  formData.append('documentType', documentType);
  formData.append('documentId', documentId);
  files.forEach((file) => formData.append('files[]', file));

  const response = await fetch('http://localhost:3001/api/upload/uploadFile', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!response.ok) throw new Error('Upload failed');
  return response.json();
};

const fileUploadService = { fileUpload };
export default fileUploadService;
