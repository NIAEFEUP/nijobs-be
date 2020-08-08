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
    MUST_EXIST_TO_APPROVE: {
        msg: "company-application-does-not-exist",
    },
    MUST_EXIST_TO_REJECT: {
        msg: "company-application-does-not-exist",
    },
    CANNOT_REVIEW_TWICE: {
        msg: "company-application-already-reviewed",
    },
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

CompanyApplicationSchema.index({ companyName: "text" });

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

const isApprovable = async (id) => {
    const application = await CompanyApplication.findById(id).exec();
    if (!application) throw new Error(CompanyApplicationRules.MUST_EXIST_TO_APPROVE.msg);

    if (application.state !== ApplicationStatus.PENDING)
        throw new Error(CompanyApplicationRules.CANNOT_REVIEW_TWICE.msg);

    return true;
};

const isRejectable = async (id) => {
    const application = await CompanyApplication.findById(id).exec();
    if (!application) throw new Error(CompanyApplicationRules.MUST_EXIST_TO_REJECT.msg);

    if (application.state !== ApplicationStatus.PENDING)
        throw new Error(CompanyApplicationRules.CANNOT_REVIEW_TWICE.msg);

    return true;
};

CompanyApplicationSchema.methods.approve = function() {
    this.approvedAt = Date.now();
    // Need to prevent validation, otherwise it will fail the email uniqueness,
    // Since there is already an application with same email: itself :)
    return this.save({ validateModifiedOnly: true });
};

CompanyApplicationSchema.methods.reject = function(reason) {
    this.rejectedAt = Date.now();
    this.rejectReason = reason;
    // Need to prevent validation, otherwise it will fail the email uniqueness,
    // Since there is already an application with same email: itself :)
    return this.save({ validateModifiedOnly: true });
};

CompanyApplicationSchema.methods.undoApproval = function() {
    if (!this.approvedAt) throw new Error("Cannot undo approval of yet-to-be approved Company Application");
    this.approvedAt = undefined;
    // Need to prevent validation, otherwise it will fail the email uniqueness,
    // Since there is already an application with same email: itself :)
    return this.save({ validateModifiedOnly: true });
};

const CompanyApplication = mongoose.model("CompanyApplication", CompanyApplicationSchema);
module.exports = CompanyApplication;
module.exports.applicationUniqueness = applicationUniqueness;
module.exports.isApprovable = isApprovable;
module.exports.isRejectable = isRejectable;
module.exports.CompanyApplicationRules = CompanyApplicationRules;
