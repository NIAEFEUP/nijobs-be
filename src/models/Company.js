const mongoose = require("mongoose");
const bcrypt = require("bcrypt-nodejs");
const { Schema } = mongoose;

const hashPassword = password => {
    const salt = bcrypt.genSaltSync();
    const hash = bcrypt.hashSync(password, salt);
    return hash;
};

const CompanySchema = new Schema({
    username: {type: String, unique: true},
    password: {type: String}
});

CompanySchema.methods.validatePassword = function(password) {
    try {
        return bcrypt.compareSync(password, this.password);
    } catch (error) {
        return false;
    }
};

CompanySchema.pre("save", function (next) {
    if ( this.password && this.isModified("password") ) {
        this.password = hashPassword(this.password);
    }
    next();
});

const Company = mongoose.model("Company", CompanySchema);
module.exports = Company;