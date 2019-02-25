const mongoose = require("mongoose");
const { Schema } = mongoose;

const CompanySchema = new Schema({
    name: {type: String},
    // Should this instead be an array of key value strings?
    // Like email: john@doe.com, phone: 9139porfavornaoincomode, etc
    contacts: {type: String},
    bio: {type: String, maxlength: 1500},
});

const Company = mongoose.model("Company", CompanySchema);

module.exports = Company;