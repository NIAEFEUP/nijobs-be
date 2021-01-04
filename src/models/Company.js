const mongoose = require("mongoose");
const { Schema } = mongoose;
const CompanyConstants = require("./constants/Company");

const CompanySchema = new Schema({
    name: {
        type: String,
        required: true,
        maxlength: CompanyConstants.companyName.max_length,
        minlength: CompanyConstants.companyName.min_length,
    },
    contacts: {
        type: [String],
    },
    bio: {
        type: String,
        maxlength: CompanyConstants.bio.max_length,
    },
});

const Company = mongoose.model("Company", CompanySchema);

module.exports = Company;
