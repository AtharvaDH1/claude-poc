const axios  = require('axios')
const logger = require('../config/logger')

// GET /api/policy/:policyID
// Proxies to Transaction API (Life Asia) — falls back to mock if unavailable
exports.getPolicyDetails = async (req, res, next) => {
  try {
    const { policyID } = req.params
    const txnBase = process.env.TXN_API_BASE_URL || 'http://localhost:3003'

    try {
      const response = await axios.get(`${txnBase}/api/policy/policySearch/${policyID}`, { timeout: 5000 })
      return res.json(response.data)
    } catch (txnErr) {
      logger.warn(`Transaction API unreachable: ${txnErr.message}. Returning mock data for ${policyID}.`)
    }

    // Fallback mock for POC (when Life Asia is offline)
    const MOCK = {
      'POL-78432': {
        policyId:'POL-78432', productCode:'ENP01', productName:'Endowment Plus',
        sumAssured:1250000, issueDate:'2010-06-01', riskCommencementDate:'2010-06-01',
        paidToDate:'2025-06-01', premiumStatus:'Active', premiumFrequency:'Annual',
        term:20, premPaidYrs:15, totalPremiumPaid:937500,
        currentSA:1250000, originalSA:1250000, cashValue:875000, maturityValue:1425000,
        advisorCode:'ADV-12345', advisorStatus:'Active', uwDecision:'Standard',
        salesChannel:'Agency', ekitPrinted:'Yes', assignment:'None',
        clients:[
          { clientId:'CL-0001', name:'Ramesh', lastName:'Patel', dob:'1975-03-15', gender:'Male', role:'Life Assured', relation:'Self', idNumber:'AAAPB1234C', panNo:'AAAPB1234C', flat:'12A', road:'MG Road', area:'Andheri', city:'Mumbai', state:'Maharashtra', country:'India', pincode:'400053', mobileNo:'9876543210', emailId:'ramesh.patel@email.com', status:'Deceased' },
          { clientId:'CL-0002', name:'Sunita', lastName:'Patel', dob:'1978-07-20', gender:'Female', role:'Nominee', relation:'Spouse', idNumber:'BBAPB5678D', panNo:'BBAPB5678D', flat:'12A', road:'MG Road', area:'Andheri', city:'Mumbai', state:'Maharashtra', country:'India', pincode:'400053', mobileNo:'9876543211', emailId:'sunita.patel@email.com', status:'Alive' },
        ],
        riders:[
          { riderCode:'ADB', riderSA:1250000, riderRCD:'2010-06-01', riderTerm:20, riderStatus:'Active', riderCessationDate:'2030-06-01' },
        ],
        agentRepudiation:[],
      },
      'POL-65219': {
        policyId:'POL-65219', productCode:'TRM01', productName:'Term Protect',
        sumAssured:800000, issueDate:'2015-03-15', riskCommencementDate:'2015-03-15',
        paidToDate:'2025-03-15', premiumStatus:'Active', premiumFrequency:'Annual',
        term:25, premPaidYrs:10, totalPremiumPaid:160000,
        currentSA:800000, originalSA:800000, cashValue:0, maturityValue:0,
        advisorCode:'ADV-67890', advisorStatus:'Active', uwDecision:'Standard',
        salesChannel:'Bancassurance', ekitPrinted:'Yes', assignment:'None',
        clients:[
          { clientId:'CL-0011', name:'Sunita', lastName:'Rao', dob:'1980-07-22', gender:'Female', role:'Life Assured', relation:'Self', idNumber:'CCAPR4321E', panNo:'CCAPR4321E', flat:'5B', road:'JP Nagar', area:'JP Nagar 7th Phase', city:'Bengaluru', state:'Karnataka', country:'India', pincode:'560078', mobileNo:'9845612300', emailId:'sunita.rao@email.com', status:'Deceased' },
          { clientId:'CL-0012', name:'Vikram', lastName:'Rao', dob:'1978-04-10', gender:'Male', role:'Nominee', relation:'Spouse', idNumber:'DDAPR8765F', panNo:'DDAPR8765F', flat:'5B', road:'JP Nagar', area:'JP Nagar 7th Phase', city:'Bengaluru', state:'Karnataka', country:'India', pincode:'560078', mobileNo:'9845612301', emailId:'vikram.rao@email.com', status:'Alive' },
        ],
        riders:[], agentRepudiation:[],
      },
    }

    const policy = MOCK[policyID]
    if (!policy) return res.status(404).json({ message: `Policy ${policyID} not found.` })
    return res.json(policy)
  } catch (err) { next(err) }
}

// GET /api/agentRepudiation/:agentCode
exports.getAgentRepudiation = async (req, res, next) => {
  try {
    const { agentCode } = req.params
    const txnBase = process.env.TXN_API_BASE_URL || 'http://localhost:3003'
    try {
      const r = await axios.get(`${txnBase}/api/agentRepudiation/${agentCode}`, { timeout: 5000 })
      return res.json(r.data)
    } catch { return res.json([]) }
  } catch (err) { next(err) }
}
