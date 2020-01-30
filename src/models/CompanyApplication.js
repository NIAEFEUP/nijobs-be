const mongoose = require("mongoose");
const { Schema } = mongoose;

const CompanyApplicaionSchema = new Schema({
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
    submitedAt: {
        type: Date,
        required: true,
    },
    approvedAt: {
        type: Date,
        validate: [
            validateDecisionDate,
            "`approvalDate` must be after `submitDate`",
        ],
    },
    rejectedAt: {
        type: Date,
        validate: [
            validateDecisionDate,
            "`rejectedDate` must be after `submitDate`",
        ],
    },
    rejectReason: {
        type: String,
        maxlength: 1500,
        required: function() {
            return !!this.rejectedAt;
        },
    },
});

function validateDecisionDate(value) {
    return !value || (value > this.submitDate);
}

const CompanyApplicaion = mongoose.model("CompanyApplicaion", CompanyApplicaionSchema);
module.exports = CompanyApplicaion;
