import { API_URL } from '../../util/config';
import wrapper from '../../util/ApiWrapper';
import * as XLSX from 'xlsx';

// Utility function to get authenticated user information
const getAuthenticatedUser = () => {
    const username = sessionStorage.getItem("loggedUser");
    if (!username) {
        throw new Error("No authenticated user found");
    }
    return { username };
};

// Function to read and process Excel file data
export const readExcelFileData = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                // Get the first worksheet
                const worksheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[worksheetName];
                // Convert worksheet to JSON with headers
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                // Check if we have data and at least 2 rows (header + data)
                if (jsonData.length < 2) {
                    reject(new Error('File must contain header row and at least one data row'));
                    return;
                }
                
                // Get headers from first row
                const headers = jsonData[0];
                // Remove header row and process data rows
                const dataRows = jsonData.slice(1);
                // Convert to array of objects with proper keys
                const processedData = dataRows.map(row => {
                    const rowData = {};
                    headers.forEach((header, index) => {
                        rowData[header] = row[index] || '';
                    });
                    return rowData;
                }).filter(row => row.POLICY_ID && row.ASSIGNED_TO); // Filter out empty rows
                
                resolve(processedData);
                
            } catch (error) {
                console.error('Error reading file:', error);
                reject(new Error('Error reading file. Please check the file format.'));
            }
        };
        
        reader.onerror = () => {
            reject(new Error('Error reading file'));
        };
        
        reader.readAsArrayBuffer(file);
    });
};

// get the policy_number and assigned_to from the database
async function getPolicyNumberAndUsername(){
    console.log('Services >> add >> caseAssignmentService >> getPolicyNumberAndUsername');
    try{
        const response = await wrapper.fetchWithToken(`/caseassignment/policynumberusername`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('result:', result);
        return result;
        
    }catch(error){
        console.error('Error in getPolicyNumberAndAssignedTo:', error);
        throw error;
    }
}

export async function CaseAssignmentService(processedData) {
    try {
        const { username } = getAuthenticatedUser();
        const policyNumberAndUsername = await getPolicyNumberAndUsername();

        const dbPolicyNumber = policyNumberAndUsername.data.responsePolicyNumber;
        const dbUsername = policyNumberAndUsername.data.responseUsername;
        console.log('services >> add >> caseAssignmentService >> dbPolicyNumber:', dbPolicyNumber);
        console.log('services >> add >> caseAssignmentService >> dbUsername:', dbUsername);

        console.log('services >> add >> caseAssignmentService >> policyNumberAndUsername:', policyNumberAndUsername);
        console.log('services >> add >> caseAssignmentService >> processedData:', processedData);
       
        // Validate processed data against database values
        const validationErrors = [];
        const validData = [];

        processedData.forEach((item, index) => {
            const policyId = item.POLICY_ID;
            const assignedTo = item.ASSIGNED_TO;
            
            // Check if policy number exists in database
            const isPolicyValid = dbPolicyNumber.includes(policyId);
            // Check if username exists in database
            const isUsernameValid = dbUsername.includes(assignedTo);
            
            if (!isPolicyValid || !isUsernameValid) {
                const errors = [];
                if (!isPolicyValid) {
                    errors.push(`Policy ID: ${policyId} not found in database`);
                }
                if (!isUsernameValid) {
                    errors.push(`Username: ${assignedTo} not found in database`);
                }
                validationErrors.push({
                    row: index + 2, // +2 because index starts at 0 and we skip header row
                    policyId,
                    assignedTo,
                    errors
                });
            } else {
                validData.push(item);
            }
        });

        // If there are validation errors, throw an error with details
        if (validationErrors.length > 0) {
            const errorMessage = validationErrors.map(error => 
                `Row ${error.row}: ${error.errors.join(', ')}`
            ).join('; ');
            
            throw new Error(`Validation failed: ${errorMessage}`);
        }

        // If all data is valid, proceed with backend call
        if (validData.length > 0) {
            const response = await wrapper.fetchWithToken(`/case-assignment/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    data: validData,
                    uploadedBy: username
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            return {
                success: true,
                message: `Successfully processed ${validData.length} records`,
                data: result
            };
        } else {
            throw new Error('No valid data found to process');
        }
        
    } catch (error) {
        console.error('Error in case assignment service:', error);
        throw error;
    }
}
