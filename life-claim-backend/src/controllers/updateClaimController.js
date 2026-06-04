const IntimationDetail = require("../models/IntimationDetail");
const TrapScore = require("../models/TrapScore");
const CauseEvent = require("../models/CauseEvent");
const PayeeDetail = require("../models/PayeeDetail");
const ClaimantDetail = require("../models/ClaimantDetail");
const LifeAssuredDetail = require("../models/LifeAssuredDetail");
const ContactDetail = require("../models/ContactDetail");
const EagleScreen = require("../models/EagleScreen");
const Requirement = require("../models/Requirement");
const RequirementTable = require("../models/RequirementTable");
const DecisionAccessor = require("../models/DecisionAccessor");
const DecisionSystem = require("../models/DecisionSystem");
const DecisionVerificationAndSummary = require("../models/DecisionVerificationAndSummary");
const sequelize = require("../config/sequelize");
const StatusHistory = require("../models/StatusHistory");
const Claim = require("../models/Claim");
const { camelToSnakeCase, snakeToCamelCase } = require("../util/convertCase");
const ClaimQuestions = require("../models/ClaimsQuestions");
const IibEnquiry = require("../models/IibEnquiry");
const EstablishedCause = require("../models/EstablishedCause");
const RiderDetailsTable = require("../models/RiderDetailsTable");
const SystemAssessorRemark = require("../models/SystemAssessorRemark");
const HospitalDetailsTable = require("../models/HospitalDetails");
const DoctorDetailsTable = require("../models/DoctorDetails");
const ProofDetailsTable = require("../models/ProofDetails");
const InsuranceProofDetailsTable = require("../models/InsuranceProofDetails");
const WitnessDetailsTable = require("../models/WitnessDetails");
const IncomeDetailsTable = require("../models/IncomeDetails");
const TelecallingTable = require("../models/Telecalling");
const CaseTriggerTable = require("../models/CaseTrigger");

const updateClaim = async (req, res) => {
  console.log("updateClaim controller request received");
  const transaction = await sequelize.transaction();
  // code by sujal
  try {
    const {
      claimNo,
      intimationDetails = {},
      establishedCauseDetails = {},
      payeeDetails = [],
      claimantDetails = [],
      lifeAssuredDetails = {},
      contactDetails = {},
      riderDetailsTable = [],
      eagleScreenDetails = {},
      requirements = {},
      requirementTable = [],
      systemDetails = {},
      iibEnquiryTable = [],
      verifierDetails = {},
      claimQuestions = {},
      systemAssessorRemarks = {},
      modifiedBy,

      // added by simran
      hospitalDetailsTable = [],
      doctorDetailsTable = [],
      proofDetailsTable = [],
      insuranceProofDetailsTable = [],
      witnessDetailsTable = [],
      incomeDetailsTable = [],

      telecallingTable = [],
      caseTriggerTable = [],
    } = req.body || {};

    console.log(claimNo);

    const claim = await Claim.findOne({
      where: { CLAIM_NUMBER: claimNo },
    });

    const { CLAIM_ID: claimId } = claim;

    const intimationDetailsSnake = camelToSnakeCase({
      ...intimationDetails,
      intimationDate : intimationDetails.intimationDate,
      whatsappFlag : intimationDetails.whatsappFlag,
      accidentDate : intimationDetails.accidentDate,
      modifiedBy: modifiedBy,
    });
    const intimation = await IntimationDetail.update(intimationDetailsSnake, {
      where: { CLAIM_ID: claimId },
      transaction,
    });
    console.log("Intimation");

    const systemAssessorRemarksSnake = camelToSnakeCase({
      ...systemAssessorRemarks,
      claimId: claimId,
      modifiedBy: modifiedBy,
    });
   
    /*
    //To Update existing record
    const systemAssessor = await SystemAssessorRemark.update(
      systemAssessorRemarksSnake,
      {
        where: { CLAIM_ID: claimId },
        transaction,
      }
    ); 
    console.log("System Assessor remarks", systemAssessor);
    */
   
    
    
    //To Create new record
    const systemAssessor1 = await SystemAssessorRemark.create(
      systemAssessorRemarksSnake,
      {
        transaction,
      }
    );
    console.log("System Assessor remarks1", systemAssessor1);


    const claimQuestionsSnake = camelToSnakeCase({
      ...claimQuestions,
      modifiedBy: modifiedBy,
    });
    claimQuestionsSnake.CLAIM_ID = claim.CLAIM_ID;
    const questions = await ClaimQuestions.update(claimQuestionsSnake, {
      where: { CLAIM_ID: claimId },
      transaction,
    });
    console.log("Questions");

    const establishedCauseSnake = camelToSnakeCase({
      ...establishedCauseDetails,
      claimId: claimId,
      modifiedBy: modifiedBy,
    });
    await EstablishedCause.destroy({
      where: { CLAIM_ID: claimId },
      transaction,
    });
    const establishedCause = await EstablishedCause.create(
      establishedCauseSnake,
      {
        transaction,
      }
    );
    console.log("Establish done");

    const lifeAssuredDetailsSnake = camelToSnakeCase({
      ...lifeAssuredDetails,
      modifiedBy: modifiedBy,
    });
    const life = await LifeAssuredDetail.update(lifeAssuredDetailsSnake, {
      where: { CLAIM_ID: claimId },
      transaction,
    });
    console.log("Life assured");

    const contactDetailsSnake = camelToSnakeCase({
      ...contactDetails,
      modifiedBy: modifiedBy,
    });
    const contact = await ContactDetail.update(contactDetailsSnake, {
      where: { CLAIM_ID: claimId },
      transaction,
    });
    console.log("Contacts done");
    const eagleScreenSnake = camelToSnakeCase({
      ...eagleScreenDetails,
      modifiedBy: modifiedBy,
    });

    const eagle = await EagleScreen.update(eagleScreenSnake, {
      where: { CLAIM_ID: claimId },
      transaction,
    });
    console.log("eagleScreenSnake done");

    await IibEnquiry.destroy({ where: { CLAIM_ID: claimId }, transaction });
    const iibResult = await Promise.all(
      iibEnquiryTable.map(async (row) => {
        const rowSnake = camelToSnakeCase(row);
        rowSnake.CLAIM_ID = claimId;
        rowSnake.CREATED_BY = modifiedBy;
        rowSnake.MODIFIED_BY = modifiedBy;
        console.log(rowSnake);
        return await IibEnquiry.create(rowSnake, { transaction });
      })
    );
    console.log("IIB done");

    if (payeeDetails.length > 0) {
      const payeeDetail = payeeDetails.map((payee) =>
        camelToSnakeCase({ ...payee, modifiedBy: modifiedBy })
      );
      await PayeeDetail.destroy({ where: { CLAIM_ID: claimId }, transaction });
      for (const payee of payeeDetail) {
        payee.CLAIM_ID = claimId;
        await PayeeDetail.create(payee, { transaction });
      }
    } else {
      console.log("No changes in payee");
    }

    const claimantDetail = claimantDetails.map((claimant) =>
      camelToSnakeCase({ ...claimant,
         modifiedBy: modifiedBy,
         flat: claimantDetails[0].flat,
         road: claimantDetails[0].road,
         area: claimantDetails[0].area,
         city: claimantDetails[0].city,
         country: claimantDetails[0].country,
         pinCode: claimantDetails[0].pinCode,
         nationality: claimantDetails[0].nationality,
         panNo: claimantDetails[0].panNo,
        })
    );
    await ClaimantDetail.destroy({ where: { CLAIM_ID: claimId }, transaction });
    for (const claimant of claimantDetail) {
      claimant.CLAIM_ID = claimId;
      await ClaimantDetail.create(claimant, { transaction });
    }

    // update and insert for requirement table
    const requirementsSnake = camelToSnakeCase({
      ...requirements,
      modifiedBy: modifiedBy,
    });
    await Requirement.update(requirementsSnake, {
      where: { CLAIM_ID: claimId },
      transaction,
    });

    await RequirementTable.destroy({
      where: { CLAIM_ID: claimId },
      transaction,
    });
    for (const reqItem of requirementTable) {
      const requirementTableSnake = camelToSnakeCase({
        ...reqItem,
        modifiedBy: modifiedBy,
      });
      requirementTableSnake.CLAIM_ID = claimId;
      await RequirementTable.create(requirementTableSnake, { transaction });
    }

    // Update and insert for hospitalDetailsTable
    await HospitalDetailsTable.destroy({
      where: { CLAIM_ID: claimId },
      transaction,
    });
    for (const item of hospitalDetailsTable) {
      const itemSnake = camelToSnakeCase({
        ...item,
        modifiedBy: modifiedBy,
      });
      itemSnake.CLAIM_ID = claimId;
      await HospitalDetailsTable.create(itemSnake, { transaction });
    }

    // Update and insert for doctorDetailsTable
    await DoctorDetailsTable.destroy({
      where: { CLAIM_ID: claimId },
      transaction,
    });
    for (const item of doctorDetailsTable) {
      const itemSnake = camelToSnakeCase({
        ...item,
        modifiedBy: modifiedBy,
      });
      itemSnake.CLAIM_ID = claimId;
      await DoctorDetailsTable.create(itemSnake, { transaction });
    }

    // Update and insert for proofDetailsTable
    await ProofDetailsTable.destroy({
      where: { CLAIM_ID: claimId },
      transaction,
    });
    for (const item of proofDetailsTable) {
      const itemSnake = camelToSnakeCase({
        ...item,
        proofType: item.proofType,
        documentType: item.documentType,
        issueDate: item.issueDate,
        documentId: item.documentId,
        modifiedBy: modifiedBy,
        
        
      });
      itemSnake.CLAIM_ID = claimId;
      await ProofDetailsTable.create(itemSnake, { transaction });
    }

    // Update and insert for insuranceProofDetailsTable--same table hence commented
    // await InsuranceProofDetailsTable.destroy({
    //   where: { CLAIM_ID: claimId },
    //   transaction,
    // });
    // for (const item of insuranceProofDetailsTable) {
    //   const itemSnake = camelToSnakeCase({
    //     ...item,
    //     modifiedBy: modifiedBy,
    //   });
    //   itemSnake.CLAIM_ID = claimId;
    //   await InsuranceProofDetailsTable.create(itemSnake, { transaction });
    // }

    // Update and insert for witnessDetailsTable--was getting error hence converted claim id to string
    await WitnessDetailsTable.destroy({
      where: { CLAIM_ID: String(claimId) }, // Ensure claimId is treated as a string
      transaction,
    });

    for (const item of witnessDetailsTable) {
      const itemSnake = camelToSnakeCase({
        ...item,
        instanceNo: item.instanceNo,
        modifiedBy: modifiedBy,
      });

      itemSnake.CLAIM_ID = String(claimId); // Ensure claimId is a string

      await WitnessDetailsTable.create(itemSnake, { transaction });
    }

    // Update and insert for incomeDetailsTable
    await IncomeDetailsTable.destroy({
      where: { CLAIM_ID: claimId },
      transaction,
    });
    for (const item of incomeDetailsTable) {
      const itemSnake = camelToSnakeCase({
        ...item,
        modifiedBy: modifiedBy,
      });
      itemSnake.CLAIM_ID = claimId;
      await IncomeDetailsTable.create(itemSnake, { transaction });
    }

    // Update and insert for telecallingTable
    await TelecallingTable.destroy({
      where: { CLAIM_ID: claimId },
      transaction,
    });
    for (const item of telecallingTable) {
      const itemSnake = camelToSnakeCase({
        ...item,
        modifiedBy: modifiedBy,
      });
      itemSnake.CLAIM_ID = claimId;
      await TelecallingTable.create(itemSnake, { transaction });
    }

    // Update and insert for caseTriggerTable
    await CaseTriggerTable.destroy({
      where: { CLAIM_ID: claimId },
      transaction,
    });
    for (const item of caseTriggerTable) {
      const itemSnake = camelToSnakeCase({
        ...item,
        modifiedBy: modifiedBy,
      });
      itemSnake.CLAIM_ID = claimId;
      await CaseTriggerTable.create(itemSnake, { transaction });
    }

     // Update and insert for riderDetailsTable
    //  await RiderDetailsTable.destroy({
    //   where: { CLAIM_ID: claimId },
    //   transaction,
    // });
    // for (const item of riderDetailsTable) {
    //   const itemSnake = camelToSnakeCase({
    //     ...item,
    //     modifiedBy: modifiedBy,
    //   });
    //   itemSnake.CLAIM_ID = claimId;
    //   await RiderDetailsTable.create(itemSnake, { transaction });
    // }

    await transaction.commit();
    res.status(200).json({ message: "Claim updated successfully" });
  } catch (error) {
    if (transaction.finished !== "commit") {
      await transaction.rollback();
    }
    console.log(error);
    res.status(500).json({
      message: "Internal server error",
      ...(process.env.NODE_ENV !== "production" ? { detail: error?.message || String(error) } : {}),
    });
  }
};

module.exports = { updateClaim };
