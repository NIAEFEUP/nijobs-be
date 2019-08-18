const mongoose = require("mongoose");
const { Schema } = mongoose;

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
        maxlength: 1500,
        required: true,
    },
});

const Company = mongoose.model("Company", CompanySchema);

module.exports = Company;
