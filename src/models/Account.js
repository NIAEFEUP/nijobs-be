const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { Schema } = mongoose;

const AccountSchema = new Schema({
    email: {
        type: String,
        trim: true,
        lowercase: true,
        unique: true,
        required: "Email address is required",
    },
    password: { type: String, required: true },
    isAdmin: {
        type: Boolean,
        required: function() {
            return !this.companyRef;
        },
        validate: {
            validator: function(isAdmin) {
                return isAdmin && !this.company;
            },
            message: "A user can not be an admin and a company representative",
        },
    },
    company: {
        type: Schema.Types.ObjectId, ref: "Company",
        required: function() {
            return !this.isAdmin;
        },
        validate: {
            validator: function(companyRef) {
                return !!companyRef && !this.isAdmin;
            },
            message: "A user can not be an admin and a company representative",

        },
    },
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
