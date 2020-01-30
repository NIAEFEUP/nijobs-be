const mongoose = require("mongoose");
const { Schema } = mongoose;

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
        maxlength: 1500,
        minlength: 10,
        required: true,
    },
    submittedAt: {
        type: Date,
        required: true,
    },
    approvedAt: {
        type: Date,
        validate: [
            validateDecisionDate,
            "`approvedAt` must be after `submittedAt`",
        ],
    },
    rejectedAt: {
        type: Date,
        validate: [
            validateDecisionDate,
            "`rejectedAt` must be after `submittedAt`",
        ],
    },
    rejectReason: {
        type: String,
        maxlength: 1500,
        minlength: 10,
        required: function() {
            return !!this.rejectedAt;
        },
    },
});

function validateDecisionDate(value) {
    return !value || (value > this.submittedAt);
}

const CompanyApplication = mongoose.model("CompanyApplication", CompanyApplicationSchema);
module.exports = CompanyApplication;
