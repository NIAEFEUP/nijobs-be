const mongoose = require("mongoose");
const { Schema } = mongoose;
const ApplicationStatus = require("./constants/ApplicationStatus");
const CompanyApplicationConstants = require("./constants/CompanyApplication");
const { checkDuplicatedEmail } = require("../api/middleware/validators/validatorUtils");

const CompanyApplicationRules = Object.freeze({
    // Email already linked to a non-rejected company application
    ONLY_ONE_APPLICATION_ACTIVE_PER_EMAIL: {
        validator: validateSingleActiveApplication,
        msg: "company-application-duplicate-email",
    },
    // Email already linked to an existing account
    EMAIL_ALREADY_IN_USE: {
        validator: validateEmailUniqueAccount,
        msg: "account-already-using-email",
    },
    DECISION_AFTER_SUBMISSION: (decision) => ({
        validator: validateDecisionDate,
        msg: `\`${decision}\` must be after \`submittedAt\``,
    }),
    MUTUALLY_EXCLUSIVE: (otherField, thisField) => ({
        validator: validateMutuallyExclusiveEvents(otherField),
        msg: `\`${thisField}\` and \`${otherField}\` are mutually exclusive`,
    }),
});

const CompanyApplicationSchema = new Schema({
    email: {
        type: String,
        trim: true,
        lowercase: true,
        required: true,
        validate: [
            CompanyApplicationRules.EMAIL_ALREADY_IN_USE,
            CompanyApplicationRules.ONLY_ONE_APPLICATION_ACTIVE_PER_EMAIL,
        ],
    },
    password: { type: String, required: true },
    companyName: { type: String, required: true },
    motivation: {
        type: String,
        maxlength: CompanyApplicationConstants.motivation.max_length,
        minlength: CompanyApplicationConstants.motivation.min_length,
        required: true,
    },
    submittedAt: {
        type: Date,
        required: true,
    },
    approvedAt: {
        type: Date,
        validate: [

            CompanyApplicationRules.DECISION_AFTER_SUBMISSION("approvedAt"),
            CompanyApplicationRules.MUTUALLY_EXCLUSIVE("rejectedAt", "approvedAt"),
        ],
    },
    rejectedAt: {
        type: Date,
        validate: [
            CompanyApplicationRules.DECISION_AFTER_SUBMISSION("rejectedAt"),
            CompanyApplicationRules.MUTUALLY_EXCLUSIVE("approvedAt", "rejectedAt"),
        ],
    },
    rejectReason: {
        type: String,
        maxlength: CompanyApplicationConstants.rejectReason.max_length,
        minlength: CompanyApplicationConstants.rejectReason.min_length,
        required: function() {
            return !!this.rejectedAt;
        },
    },
});

CompanyApplicationSchema.virtual("state").get(function() {
    if (!this.approvedAt && !this.rejectedAt) return ApplicationStatus.PENDING;
    else if (this.approvedAt) return ApplicationStatus.APPROVED;
    else return ApplicationStatus.REJECTED;
});

async function validateEmailUniqueAccount(value) {
    try {
        await checkDuplicatedEmail(value);
    } catch (e) {
        return false;
    }
    return true;
}


function validateDecisionDate(value) {
    return !value || (value > this.submittedAt);
}

function validateMutuallyExclusiveEvents(field) {

    return function(value) {
        return !value || !this[field];
    };
}

const applicationUniqueness = async (email) => {
    const existingApplications = await CompanyApplication.find({ email });
    if (existingApplications.some((application) =>
        application.state === ApplicationStatus.PENDING ||
    application.state === ApplicationStatus.APPROVED)
    ) {
        throw new Error(CompanyApplicationRules.ONLY_ONE_APPLICATION_ACTIVE_PER_EMAIL.msg);
    }

    return true;
};

async function validateSingleActiveApplication(value) {
    try {
        await applicationUniqueness(value);
    } catch (e) {
        return false;
    }
    return true;
}

const CompanyApplication = mongoose.model("CompanyApplication", CompanyApplicationSchema);
module.exports = CompanyApplication;
module.exports.applicationUniqueness = applicationUniqueness;
module.exports.CompanyApplicationRules = CompanyApplicationRules;
