const mongoose = require("mongoose");
const { Schema } = mongoose;
const companyConstants = require("./constants/Company");

const CompanySchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    contacts: {
        type: Map,
        of: String,
        required: true,
        validate: [
            (val) => val.size >= 1,
            "There must be at least one contact",
        ],
    },
    bio: {
        type: String,
        maxlength: companyConstants.bio.max_length,
        required: true,
    },
});

const Company = mongoose.model("Company", CompanySchema);

module.exports = Company;
