import mongoose from "mongoose";
import ApplicationStatus from "./constants/ApplicationStatus.js";
import CompanyApplicationConstants from "./constants/CompanyApplication.js";
import { checkDuplicatedEmail } from "../api/middleware/validators/validatorUtils.js";
import { CompanyApplicationAlreadyReviewed, CompanyApplicationUnverified } from "../services/application.js";


const { Schema } = mongoose;

export const CompanyApplicationRules = Object.freeze({
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
    APPLICATION_RECENTLY_CREATED: {
        msg: "company-application-recently-created",
    },
    APPLICATION_ALREADY_VALIDATED: {
        msg: "application-already-validated",
    },
    MUST_BE_VERIFIED: {
        msg: "application-must-be-verified",
    }
});

export const CompanyApplicationProps = {
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
    isVerified: {
        type: Boolean,
        default: true,
    },
};

const CompanyApplicationSchema = new Schema(CompanyApplicationProps);

CompanyApplicationSchema.index({ companyName: "text" });

CompanyApplicationSchema.virtual("state").get(function() {
    if (!this.isVerified) return ApplicationStatus.UNVERIFIED;
    else if (!this.approvedAt && !this.rejectedAt) return ApplicationStatus.PENDING;
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

export const applicationUniqueness = async (email) => {
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

export const isApprovable = (application) => {

    if (application.state === ApplicationStatus.UNVERIFIED)
        throw new CompanyApplicationUnverified(CompanyApplicationRules.MUST_BE_VERIFIED.msg);

    if (application.state !== ApplicationStatus.PENDING)
        throw new CompanyApplicationAlreadyReviewed(CompanyApplicationRules.CANNOT_REVIEW_TWICE.msg);

    return true;
};

export const isRejectable = (application) => {

    if (application.state === ApplicationStatus.UNVERIFIED)
        throw new CompanyApplicationUnverified(CompanyApplicationRules.MUST_BE_VERIFIED.msg);

    if (application.state !== ApplicationStatus.PENDING)
        throw new CompanyApplicationAlreadyReviewed(CompanyApplicationRules.CANNOT_REVIEW_TWICE.msg);

    return true;
};


CompanyApplicationSchema.methods.companyValidation = function() {
    if (this.isVerified)
        throw new Error(CompanyApplicationRules.APPLICATION_ALREADY_VALIDATED.msg);

    this.isVerified = true;
    return this.save({ validateModifiedOnly: true });
};

CompanyApplicationSchema.methods.approve = function() {
    isApprovable(this);
    this.approvedAt = Date.now();
    // Need to prevent validation, otherwise it will fail the email uniqueness,
    // Since there is already an application with same email: itself :)
    return this.save({ validateModifiedOnly: true });
};

CompanyApplicationSchema.methods.reject = function(reason) {
    isRejectable(this);
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

// Creating an index to make fetching faster
CompanyApplicationSchema.index({ submittedAt: 1 });

// Include virtuals and remove password field in toObject calls
CompanyApplicationSchema.set("toJSON", { getters: true });
CompanyApplicationSchema.set("toObject", { transform: (obj) => {
    // eslint-disable-next-line no-unused-vars
    const { password, ...trimmedDoc } = obj.toJSON();
    return { ...trimmedDoc };
} });

const CompanyApplication = mongoose.model("CompanyApplication", CompanyApplicationSchema);
export default CompanyApplication;
