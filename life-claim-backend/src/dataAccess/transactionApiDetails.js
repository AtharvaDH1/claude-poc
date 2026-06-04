const db = require('../config/dbConfig');

const getTransactionApiDBDetails = async (policyNumber) => {
    try {
        const queryResult = await db.query('SELECT * FROM transactionApiDetails WHERE txnpolicyNumber = ?', [policyNumber]);
        console.log(' dataAccess >> transactionApiDetails.js >> getTransactionApiDetails >> queryResult :>', queryResult);
        return queryResult;
    } catch (error) {
        console.log(' dataAccess >> transactionApiDetails.js >> getTransactionApiDetails >> error :>', error);
        throw new Error('Database error: ' + error.message);
    }
}

const saveTransactionApiDetails = async (transactionApiDetails) => {
    let connection;
    try {
        console.log(' dataAccess >> transactionApiDetails.js >> saveTransactionApiDetails >> transactionApiDetails :>', transactionApiDetails);

        // Get a connection from the pool for transaction
        connection = await db.getConnection();
        
        // Start transaction
        await connection.beginTransaction();
        console.log(' dataAccess >> transactionApiDetails.js >> saveTransactionApiDetails >> Transaction started');

        // Check if it's an array or single object
        const records = Array.isArray(transactionApiDetails.transactionDetails) 
            ? transactionApiDetails.transactionDetails 
            : Array.isArray(transactionApiDetails)
            ? transactionApiDetails
            : [transactionApiDetails];

        const queryResults = [];

        // Process each record in the transaction
        for (const rawRecord of records) {
            // Normalise incoming API field names to internal txn* names
            const record = {
                txnpolicyNumber: rawRecord.txnpolicyNumber || rawRecord.PolicyNumber,
                txnDate:         rawRecord.txnDate         || rawRecord.Date,
                txnCode:         rawRecord.txnCode         || rawRecord.Code,
                txnAmount:       rawRecord.txnAmount       || rawRecord.Amount,
                txnStatus:       rawRecord.txnStatus       || rawRecord.Status,
                txnRemark:       rawRecord.txnRemark       || rawRecord.Remark,
                txnDescription:  rawRecord.txnDescription  || rawRecord.Description,
                txnAction:       rawRecord.txnAction       || rawRecord.Action,
            };

            const {
                txnpolicyNumber,
                txnDate,
                txnCode,
                txnAmount,
                txnStatus,
                txnRemark,
                txnDescription,
                txnAction
            } = record;

            // Normalise datetime to MySQL DATETIME format (YYYY-MM-DD HH:MM:SS)
            let formattedTxnDate = txnDate;
            if (typeof formattedTxnDate === 'string') {
                // Handle ISO string like 2024-05-31T18:30:00.000Z
                if (formattedTxnDate.includes('T')) {
                    formattedTxnDate = formattedTxnDate.replace('T', ' ');
                }
                if (formattedTxnDate.endsWith('Z')) {
                    formattedTxnDate = formattedTxnDate.slice(0, -1);
                }
                // Trim milliseconds if present
                const dotIndex = formattedTxnDate.indexOf('.');
                if (dotIndex !== -1) {
                    formattedTxnDate = formattedTxnDate.substring(0, dotIndex);
                }
            }

            // Validate required fields
            //console.log('txnpolicyNumber : ', txnpolicyNumber);
            if (!txnpolicyNumber || !formattedTxnDate || !txnCode || txnAmount === undefined || !txnStatus || !txnDescription) {
                console.log('records : ', records, '\n transactionApiDetails : ', transactionApiDetails);
                throw new Error(`Missing required fields for record: ${JSON.stringify(record)}`);
            }

            // 1. Check if record already exists
            const [existing] = await connection.query(
                'SELECT * FROM transactionApiDetails WHERE txnpolicyNumber = ? AND txnDate = ? AND txnCode = ? AND txnAmount = ?   AND txnStatus = ?  AND txnDescription = ? '  ,
                [txnpolicyNumber, formattedTxnDate, txnCode, txnAmount, txnStatus,  txnDescription]
            );
            console.log('dataAccess >> transactionApiDetails.js >> saveTransactionApiDetails >> existing :>', existing);
            let queryResult;

            if (existing && existing.length > 0) {
                // 2. Record exists -> update remark and action
                queryResult = await connection.query(
                    'UPDATE transactionApiDetails SET txnRemark = ?, txnAction = ? WHERE txnpolicyNumber = ? AND txnDate = ? AND txnAmount = ? AND txnCode = ? AND txnStatus = ?  AND txnDescription = ?',
                    [txnRemark, txnAction, txnpolicyNumber, formattedTxnDate, txnAmount, txnCode, txnStatus, txnDescription]
                );
                console.log(' dataAccess >> transactionApiDetails.js >> saveTransactionApiDetails >> updateResult :>', queryResult);
            } else {
                // 3. Record does not exist -> insert new row
                queryResult = await connection.query(
                    'INSERT INTO transactionApiDetails (txnpolicyNumber, txnDate, txnCode, txnAmount, txnStatus, txnDescription, txnRemark, txnAction) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    [txnpolicyNumber, formattedTxnDate, txnCode, txnAmount, txnStatus, txnDescription, txnRemark, txnAction]
                );
                console.log(' dataAccess >> transactionApiDetails.js >> saveTransactionApiDetails >> insertResult :>', queryResult);
            }

            queryResults.push(queryResult);
        }

        // If all records processed successfully, commit the transaction
        await connection.commit();
        console.log(' dataAccess >> transactionApiDetails.js >> saveTransactionApiDetails >> Transaction committed successfully');
        
        return queryResults.length === 1 ? queryResults[0] : queryResults;
    } catch (error) {
        // Rollback transaction on any error
        if (connection) {
            await connection.rollback();
            console.log(' dataAccess >> transactionApiDetails.js >> saveTransactionApiDetails >> Transaction rolled back due to error');
        }
        console.log(' dataAccess >> transactionApiDetails.js >> saveTransactionApiDetails >> error :>', error);
        throw new Error('Database error: ' + error.message);
    } finally {
        // Release the connection back to the pool
        if (connection) {
            connection.release();
        }
    }
}

module.exports = { getTransactionApiDBDetails, saveTransactionApiDetails };