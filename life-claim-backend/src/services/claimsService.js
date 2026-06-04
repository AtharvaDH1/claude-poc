const db = require("../config/dbConfig")
const LifeAssuredDetail = require('../models/LifeAssuredDetail');
const notificationQueueService = require('../services/notificationQueueService');
const DB_SCHEMA = process.env.DB_DATABASE || 'life_claim';

exports.getClaimByUsername = async (username) => {
    try {
        const query = `SELECT CLAIM_NUMBER, POLICY_ID, CLAIM_TYPE, CLAIM_STATUS, INITIMATION_DATE, CREATED_BY, CREATED_AT, MODIFIED_BY, MODIFIED_AT, status, role, ASSESSMENT_USERNAME, APPROVER_USERNAME from ${DB_SCHEMA}.claims where ASSIGNED_TO=? OR MODIFIED_BY=? OR ASSESSMENT_USERNAME=? OR APPROVER_USERNAME=? ORDER BY COALESCE(MODIFIED_AT, CREATED_AT) DESC;`
        const [rows] = await db.execute(query, [username, username, username, username])
        return rows
    } catch (error) {
        console.log(error)
    }
}


exports.unassignClaim = async (claimNumber) => {
    try {
        const query = `UPDATE ${DB_SCHEMA}.claims SET ASSIGNED_TO=NULL WHERE CLAIM_NUMBER=?`
        const [rows] = await db.execute(query, [claimNumber])
        return rows
    } catch (error) {
        console.log(error)
    }
}


exports.changeStatus = async (claimNumber, status, username, role = null) => {
    try {
        let query = `UPDATE ${DB_SCHEMA}.claims SET status=?, MODIFIED_BY=?, MODIFIED_AT=NOW()`;
        const params = [status, username];

        if (role === 'Assessor') {
            query += ', ASSESSMENT_USERNAME=?';
            params.push(username);
        } else if (role === 'Verifier') {
            query += ', APPROVER_USERNAME=?';
            params.push(username);
        }

        query += ' WHERE CLAIM_NUMBER=?';
        params.push(claimNumber);

        const [rows] = await db.execute(query, params);

        // Trigger assignment notifications when status changes to the appropriate states.
        try {
            const [claimRows] = await db.execute(
                `SELECT CLAIM_ID FROM ${DB_SCHEMA}.claims WHERE CLAIM_NUMBER = ?`,
                [claimNumber]
            );

            if (claimRows.length > 0) {
                const claimId = claimRows[0].CLAIM_ID;
                const lifeAssured = await LifeAssuredDetail.findOne({ where: { CLAIM_ID: String(claimId) } });

                if (lifeAssured) {
                    const mobileNo = lifeAssured.MOBILE_NO1 || lifeAssured.MOBILE_NO2 || lifeAssured.MOBILE_ID1;
                    const email = lifeAssured.EMAIL_ID1 || lifeAssured.EMAIL || null;

                    if (role === 'Assessor' && status === 'Pending Assessor Action') {
                        console.log(
                            'claimsService >> claim_assigned_to_assessor',
                            'claimNumber',
                            claimNumber,
                            'email',
                            email,
                            'mobileNo',
                            mobileNo
                        );
                        await notificationQueueService.enqueueAssessorAssignmentNotification({
                            claimId: claimNumber,
                            email,
                            mobileNo,
                        });
                    } else if (role === 'Verifier' && status === 'Pending Verifier Allocation') {
                        console.log(
                            'claimsService >> claim_assigned_to_verifier',
                            'claimNumber',
                            claimNumber,
                            'email',
                            email,
                            'mobileNo',
                            mobileNo
                        );
                        await notificationQueueService.enqueueVerifierAssignmentNotification({
                            claimId: claimNumber,
                            email,
                            mobileNo,
                        });
                    }
                }
            }
        } catch (notifyErr) {
            console.error(
                'claimsService >> Error enqueueing assignment notification:',
                notifyErr?.message || notifyErr
            );
        }

        return rows;
    } catch (error) {
        console.log(error);
    }
}

exports.changeRole = async (claimNumber, role) => {
    try {
        const query = `UPDATE ${DB_SCHEMA}.claims SET role=? WHERE CLAIM_NUMBER=?`
        const [rows] = await db.execute(query, [role, claimNumber])
        return rows
    } catch (error) {
        console.log(error)
    }
}