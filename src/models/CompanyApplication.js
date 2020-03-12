const mongoose = require("mongoose");
const { Schema } = mongoose;
const ApplicationStatus = require("./ApplicationStatus");
const CompanyApplicationConstants = require("./constants/CompanyApplication");

const CompanyApplicationSchema = new Schema({
    email: {
        type: String,
        trim: true,
        lowercase: true,
        required: true,
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
            {
                validator: validateDecisionDate,
                msg: "`approvedAt` must be after `submittedAt`",
            },
            {
                validator: validateApprovedDate,
                msg: "`approvedAt` and `rejectedAt` are mutually exclusive",
            },
        ],
    },
    rejectedAt: {
        type: Date,
        validate: [
            {
                validator: validateDecisionDate,
                msg: "`rejectedAt` must be after `submittedAt`",
            },
            {
                validator: validateRejectedDate,
                msg: "`approvedAt` and `rejectedAt` are mutually exclusive",
            },
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

function validateDecisionDate(value) {
    return !value || (value > this.submittedAt);
}

function validateApprovedDate(value) {

    return !value || !this.rejectedAt;
}

function validateRejectedDate(value) {
    return !value || !this.approvedAt;
}

CompanyApplicationSchema.query.pending = function() {
    return this.where({
        approvedAt: {
            $exists: false,
        },
        rejectedAt: {
            $exists: false,
        },
    });
};

const CompanyApplication = mongoose.model("CompanyApplication", CompanyApplicationSchema);
module.exports = CompanyApplication;
