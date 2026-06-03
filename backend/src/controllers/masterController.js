// Master data endpoints — states, countries, cause events, assessment questions, places of death, etc.

const STATES = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Jammu & Kashmir','Ladakh','Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli','Daman and Diu','Lakshadweep','Puducherry']

const COUNTRIES = ['India','United States','United Kingdom','Canada','Australia','Germany','France','Singapore','UAE','Saudi Arabia','Others']

const CAUSE_EVENTS = [
  { causeCode:'D001', causeDescription:'Natural Death',           causeCategory:'Natural',    claimSubType:'Death', claimRegistrationType:'Normal' },
  { causeCode:'D002', causeDescription:'Accidental Death',        causeCategory:'Accidental', claimSubType:'Death', claimRegistrationType:'Investigation' },
  { causeCode:'D003', causeDescription:'Death due to Illness',    causeCategory:'Medical',    claimSubType:'Death', claimRegistrationType:'Normal' },
  { causeCode:'D004', causeDescription:'Cardiac Arrest',          causeCategory:'Medical',    claimSubType:'Death', claimRegistrationType:'Normal' },
  { causeCode:'D005', causeDescription:'Accidental Drowning',     causeCategory:'Accidental', claimSubType:'Death', claimRegistrationType:'Investigation' },
  { causeCode:'D006', causeDescription:'Road Accident',           causeCategory:'Accidental', claimSubType:'Death', claimRegistrationType:'Investigation' },
  { causeCode:'D007', causeDescription:'Cancer',                  causeCategory:'Medical',    claimSubType:'Death', claimRegistrationType:'Normal' },
  { causeCode:'D008', causeDescription:'Suicide',                 causeCategory:'Intentional',claimSubType:'Death', claimRegistrationType:'Investigation' },
  { causeCode:'D009', causeDescription:'COVID-19',                causeCategory:'Medical',    claimSubType:'Death', claimRegistrationType:'Normal' },
  { causeCode:'D010', causeDescription:'Respiratory Failure',     causeCategory:'Medical',    claimSubType:'Death', claimRegistrationType:'Normal' },
  { causeCode:'D011', causeDescription:'Kidney Failure',          causeCategory:'Medical',    claimSubType:'Death', claimRegistrationType:'Normal' },
  { causeCode:'D012', causeDescription:'Stroke / Brain Hemorrhage',causeCategory:'Medical',   claimSubType:'Death', claimRegistrationType:'Investigation' },
  { causeCode:'D013', causeDescription:'Others',                  causeCategory:'Others',     claimSubType:'Death', claimRegistrationType:'Normal' },
]

const PLACES_OF_DEATH = ['Hospital','Home','Public Place','Road Accident Site','Workplace','Religious Place','Forest/Jungle','Water Body','Railway Station','Airport','Others']

const ASSESSMENT_QUESTIONS = [
  { id:1,  question:'Was the claim reported within 30 days of the event?',                    section:'Reporting'     },
  { id:2,  question:'Does the cause of death match the policy coverage terms?',               section:'Eligibility'   },
  { id:3,  question:'Is the nominee correctly mentioned in the policy document?',             section:'Nomination'    },
  { id:4,  question:'Are all mandatory documents submitted?',                                 section:'Documentation' },
  { id:5,  question:'Were any previous claims registered on this policy?',                    section:'History'       },
  { id:6,  question:'Was there any medical history of serious illness prior to policy start?',section:'Medical'       },
  { id:7,  question:'Was the life assured employed at the time of death?',                    section:'Personal'      },
  { id:8,  question:'Are there any other active life insurance policies for the life assured?',section:'Disclosure'   },
  { id:9,  question:'Was the death witnessed by any person?',                                 section:'Circumstances' },
  { id:10, question:'Has the claimant provided any police FIR or post-mortem report?',       section:'Legal'         },
  { id:11, question:'Is there any suspicion of fraud or misrepresentation?',                 section:'Fraud'         },
  { id:12, question:'Does the address on documents match the policy records?',               section:'Verification'  },
]

const PORTFOLIOS = ['Individual Life','Group Life','Credit Life','Micro Insurance','Term','ULIP']

exports.getStates = (req, res) => res.json(STATES)
exports.getCountries = (req, res) => res.json(COUNTRIES)
exports.getCauseEvents = (req, res) => res.json(CAUSE_EVENTS)
exports.getPlacesOfDeath = (req, res) => res.json(PLACES_OF_DEATH)
exports.getAssessmentQuestions = (req, res) => res.json(ASSESSMENT_QUESTIONS)
exports.getPortfolios = (req, res) => res.json(PORTFOLIOS)

// GET /api/role/roles
exports.getRoles = (req, res) => res.json([
  { id:1, role_name:'Pre Assessor',  role_description:'Registers new claims and initial data entry' },
  { id:2, role_name:'Assessor',      role_description:'Evaluates and assesses registered claims' },
  { id:3, role_name:'Verifier',      role_description:'Verifies and approves/rejects claims' },
  { id:4, role_name:'Admin',         role_description:'Full system access and user management' },
  { id:5, role_name:'Clerk',         role_description:'Document management and communication' },
  { id:6, role_name:'Business',      role_description:'Business reporting and analytics access' },
])

// POST /api/systemDec/system
exports.getSystemDecision = (req, res) => {
  const { policyData } = req.body || {}
  const sa = policyData?.sumAssured || 1250000
  res.json({
    recommendation:  'Approve',
    payableAmount:   sa,
    reason:          'Automated analysis: Policy is within coverage period. All submitted documents verified. Cause of death aligns with policy terms. No fraud indicators detected.',
    riskScore:       'Low',
    processedOn:     new Date().toISOString().split('T')[0],
  })
}

// POST /api/trap-score (or /api/trapScoreRoutes)
exports.getTrapScore = (req, res) => {
  const score   = Math.floor(Math.random() * 40) + 15
  const risk    = score >= 50 ? 'High' : score >= 30 ? 'Medium' : 'Low'
  res.json({
    trapScore:   score,
    trapRisk:    risk,
    trapRemarks: `Trap score ${score}. Risk level: ${risk}. Based on ${Object.keys(req.body || {}).length} parameters.`,
    trapDate:    new Date().toISOString().split('T')[0],
  })
}

// GET /api/history-search (policy search)
exports.historySearch = (req, res) => {
  const { policyNo } = req.query || req.body || {}
  res.json({ message: `Policy search for ${policyNo || 'all'}`, results: [] })
}
