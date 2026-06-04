const logger = require('../config/logConfig')
const systemDecisionService = require("../services/systemDecisionService")


const generateSystemDecision = async(req, res, next)=>{
    try {
        const {policyData} = req.body
        const result = await systemDecisionService.generateSystemDecision(policyData)
        const result1 = await systemDecisionService.generateSystemDecision1(policyData)

        return res.status(201).json({result, result1})
    } catch (error) {
        logger.error("Issue in calling the service")
        next(error)
    }
}

module.exports ={
    generateSystemDecision
}