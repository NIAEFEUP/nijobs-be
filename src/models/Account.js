const mongoose = require("mongoose");
const bcrypt = require("bcrypt-nodejs");
const { Schema } = mongoose;

const hashPassword = (password) => {
    const salt = bcrypt.genSaltSync();
    const hash = bcrypt.hashSync(password, salt);
    return hash;
};

const AccountSchema = new Schema({
    username: { type: String, unique: true },
    password: { type: String },
});

AccountSchema.methods.validatePassword = function(password) {
    try {
        return bcrypt.compareSync(password, this.password);
    } catch (error) {
        return false;
    }
};

AccountSchema.pre("save", function(next) {
    if (this.password && this.isModified("password")) {
        this.password = hashPassword(this.password);
    }
    next();
});

const Account = mongoose.model("Account", AccountSchema);
module.exports = Account;
