const {
  getTransactionApiBase,
  fetchPolicySearch,
} = require('../services/transactionApiClient');

const getPolicyDetails = async (req, res, next) => {
  try {
    const { data } = await fetchPolicySearch(req.params.policyID);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const getAgentRepudiationDetails = async (req, res) => {
  const { agentCode } = req.body;
  const url = `${getTransactionApiBase()}/api/agentRepudiation/${agentCode}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'An error occurred while fetching the details.' });
  }
};

module.exports = {
  getPolicyDetails,
  getAgentRepudiationDetails,
};
