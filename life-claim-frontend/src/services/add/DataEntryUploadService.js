import wrapper from '../../util/ApiWrapper';
import * as XLSX from 'xlsx';

// Utility function to get authenticated user information
const getAuthenticatedUsername = () => {
    const username = sessionStorage.getItem("loggedUser");
    if (!username) {
        throw new Error("No authenticated user found");
    }
    return username;
};

async function ExcelUploaderService(file) {
    console.log('Service >> ExcelUploaderService called with file:', file);
    
    try {
        const username = getAuthenticatedUsername();
        const data = await readExcelFile(file);
        console.log('service >> DataEntryUploadService.js  Excel Data: ',  JSON.stringify(data), JSON.stringify(username));

        const response = await wrapper.fetchWithToken(`/capsAddDetails/addValue`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ data, username }), // Include username in request body
        });

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('ExcelUploaderService error:', error);
        throw error;
    }
}

// Helper to parse Excel file
function readExcelFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                resolve(jsonData);
            } catch (err) {
                reject(new Error('Error reading Excel file'));
            }
        };

        reader.onerror = () => {
            reject(new Error('Error reading file'));
        };

        reader.readAsArrayBuffer(file);
    });
}

async function searchWithUserInput(attribute, value, caseType, page = 0, limit = 10) {
    console.log('Service >> SearchWithUserInput called with attribute:', attribute, 'value:', value, 'caseType:', caseType, 'page:', page, 'limit:', limit);
    
    try {
        const username = getAuthenticatedUsername();
        
        const requestBody = {
            caseType,
            attribute, 
            value, 
            username,
            page,
            limit
        };
        
        const response = await wrapper.fetchWithToken(`/capsAddDetails/getData`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody),
        });
        const getDataRes = await response.json();
        return getDataRes;
    } catch (error) {
        console.error('SearchWithUserInput error:', error);
        throw error;
    }
}

async function approveData(selectedData, caseStatus) {  
    console.log('Service >> approveData called with data:', selectedData, 'Case Status:', caseStatus);
    const caseId = (selectedData || []).map(item => item.CASE_ID);

    try {
        const username = getAuthenticatedUsername();
        const response = await wrapper.fetchWithToken(`/capsAddDetails/approver-approve`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ caseId, caseStatus, username}),
        });
        const approveRes = await response.json();
        return approveRes;
    } catch (error) {
        console.error('ApproveData error:', error);
        throw error;
    }
}

async function rejectData(selectedData, caseStatus) {
    console.log('Service >> rejectData called with data:', selectedData, 'Case Status:', caseStatus);
    const caseId = (selectedData || []).map(item => item.CASE_ID);
    try {
        const username = getAuthenticatedUsername(); 
        const response = await wrapper.fetchWithToken(`/capsAddDetails/approver-approve`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ caseId, caseStatus, username }),
        });
        const rejectRes = await response.json();
        return rejectRes;
    } catch (error) {
        console.error('RejectData error:', error);
        throw error;
    }
}

export { ExcelUploaderService, searchWithUserInput, approveData, rejectData };