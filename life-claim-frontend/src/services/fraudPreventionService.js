import { API_URL } from '../util/config';
import userDetailsService from './userService';
import wrapper from '../util/ApiWrapper';

//To get the data for rule 1
const fraudPreventionService = async (pincode, city) => {
    console.log('Services >> fraudPreventionService.js >> Pincode > ', pincode, '\n City > ', city);
    const response = await wrapper.fetchWithToken(`/fraudprevention/getSafeCityPincodeCheck`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ pincode, city })
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        return `Server error: ${response.status} - ${errorText}`;
    }
    const fraudPreventionData = await response.json();
    console.log('Services >> fruadPreventionService.js >> fraudPreventionData > ', fraudPreventionData);
    return fraudPreventionData;
}

//To get the data for rule 2
const ruleTwoService = async (claimant) => {
    console.log('Services >> FraudPreventionService.js >> ruleTwoService Methed called ');
    const ruleTwoResponse = await wrapper.fetchWithToken(`/fraudprevention/claimant_Bankdetails_Check`,
        {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
        });
    if (!ruleTwoResponse.ok) {
        const errorText = await ruleTwoResponse.text();
        return `Server error: ${ruleTwoResponse.status} - ${errorText}`;
    }
    const ruleTwoData = await ruleTwoResponse.json();
    console.log('Services >> FraudPreventionService.js >> ruleTwoData > ', ruleTwoData);
    return ruleTwoData;
}

//To get the data for rule 3
const ruleThreeService = async (source) => {
    console.log('Services >> FraudPreventionService.js >> ruleThreeService Methed called ');
    const ruleThreeResponse = await wrapper.fetchWithToken(`/fraudprevention/agent_Trend_Check`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ source })
        }
    );
    if (!ruleThreeResponse.ok) {
        const errorText = await ruleThreeResponse.text();
        return `Server error: ${ruleThreeResponse.status} - ${errorText}`;
    }
    const ruleThreeData = await ruleThreeResponse.json();
    console.log('Services >> FraudPreventionService.js >> ruleThreeData > ', ruleThreeData);
    return ruleThreeData;
}

//To get the data for rule 4
const ruleFourService = async (numbers) => {
    console.log('Services >> FraudPreventionService.js >> ruleFourService Methed called');
    try {
        const ruleFourResponse = await wrapper.fetchWithToken(`/fraudprevention/mobile_Number_Check`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ numbers })
            }
        );

        if (!ruleFourResponse.ok) {
            const errorText = await ruleFourResponse.text();
            return `Server error: ${ruleFourResponse.status} - ${errorText}`;
        }
        const ruleFourData = await ruleFourResponse.json();
        console.log('Services >> FraudPreventionService.js >> ruleFourData > ', ruleFourData);
        return ruleFourData;
    } catch (error) {
        console.log('Services >> FraudPreventionService.js >> ruleFourService Error > ', error);
        return error;
    }

}

// To add the Accessor feedback for visible rules 
const addAccessorFeedback = async (feedback, claimNumber) => {
    const username = sessionStorage.getItem('loggedUser');

    console.log('Services >> FraudPreventionService.js >> addAccessorFeedback Methed called ', feedback, '\n Username > ', username, '\n Claim Number > ', claimNumber);

    try {
        console.log('Services >> FraudPreventionService.js >> About to call userDetailsService.getUserById');
        const userDetails = await userDetailsService.getUserById(username);
        console.log('Services >> FraudPreventionService.js >> userDetails > ', userDetails);
        const role = userDetails.roles[0];
        console.log('Services >> FraudPreventionService.js >> role > ', role);
        console.log('Before Response...');
        const addAccessorFeedbackResponse = await wrapper.fetchWithToken(`/fraudprevention/add_remarks_decisions`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ feedback, claimNumber, role, username })
            },
        );
        console.log('After Response...');
        console.log('Services >> FraudPreventionService.js >> Response status: ', addAccessorFeedbackResponse.status);
        if (!addAccessorFeedbackResponse.ok) {
            const errorText = await addAccessorFeedbackResponse.text();
            console.log('Services >> FraudPreventionService.js >> Response not ok, error: ', errorText);
            return (`Server error: ${addAccessorFeedbackResponse.status} - ${errorText}`);
        } else {
            const addAccessorFeedbackData = await addAccessorFeedbackResponse.json();
            console.log('Services >> FraudPreventionService.js >> addAccessorFeedbackData > ', addAccessorFeedbackData);
            return addAccessorFeedbackData;
        }

    } catch (error) {
        console.log('Services >> FraudPreventionService.js >> addAccessorFeedback Error > ', error);
        console.log('Services >> FraudPreventionService.js >> Error stack: ', error.stack);
        return error;
    }
}

//To get the existing feedback based on the claim number to decide to update or add
export const getExistingFeedback = async (claimNumber) => {
    console.log('FraudPrevetionModal.jsx >> FraudPrevetionModal >> getExistingFeedback >> claimNumber: >>', claimNumber);
    try {
        const response = await wrapper.fetchWithToken(`/fraudprevention/get_eagle_rule_details`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ claimNumber })
        });

        if (response.ok) {
            const existingFeedback = await response.json();
            console.log('FraudPrevetionModal.jsx >> FraudPrevetionModal >> getExistingFeedback >> existingFeedback: >>', JSON.stringify(existingFeedback));
            return existingFeedback;
        } else {
            console.error('Error response from server:', response.status, response.statusText);
            const errorText = await response.text();
            console.error('Error details:', errorText);
            return null;
        }
    } catch (error) {
        console.error('Error fetching existing feedback:', error);
        return null;
    }
};

export const updateAccessorFeedback = async (feedback, claimNumber) => {
    console.log('FraudPrevetionModal.jsx >> FraudPrevetionModal >> updateAccessorFeedback >> feedback: >>', feedback, '\n claimNumber: >>', claimNumber);
    try {
        const response = await wrapper.fetchWithToken(`/fraudprevention/update_eagle_rule_details`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ feedback, claimNumber })
        });
        if (response.ok) {
            return await response.json();
        } else {
            const errorText = await response.text();
            throw new Error(`Server error: ${response.status} - ${errorText}`);
        }
    } catch (error) {
        console.error('Error updating feedback:', error);
        throw error;
    }
};

export { fraudPreventionService, ruleTwoService, ruleThreeService, ruleFourService, addAccessorFeedback };