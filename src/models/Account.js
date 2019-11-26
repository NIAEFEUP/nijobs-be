const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { Schema } = mongoose;

const AccountSchema = new Schema({
    username: { type: String, unique: true, maxlength: 20, minlength: 3, required: true },
    password: { type: String, required: true },
});

AccountSchema.methods.validatePassword = async function(password) {
    try {
        const isMatch = await bcrypt.compare(password, this.password);
        return isMatch;
    } catch (error) {
        return false;
    }
};

AccountSchema.pre("save", async function(next) {
    if (this.password && this.isModified("password")) {
        try {
            this.password = await bcrypt.hash(this.password, 10);
        } catch (error) {
            return next(error);
        }
    }
    return next();
});

const Account = mongoose.model("Account", AccountSchema);
module.exports = Account;
