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
        type: Map,
        of: String,
        validate: [
            (val) => val.size >= 1,
            "There must be at least one contact",
        ],
    },
    bio: {
        type: String,
        maxlength: CompanyConstants.bio.max_length,
    },
});

const Company = mongoose.model("Company", CompanySchema);

module.exports = Company;
