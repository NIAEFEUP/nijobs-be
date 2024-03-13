import mongoose from "mongoose";
import bcrypt from "bcrypt";
const { Schema } = mongoose;

export const AccountTypes = {
    ADMIN: "ADMIN",
    COMPANY: "COMPANY",
    STUDENT: "STUDENT",
};

const AccountSchema = new Schema({
    email: {
        type: String,
        trim: true,
        lowercase: true,
        unique: true,
        required: true,
    },
    type: {
        type: String,
        required: true,
        enum: Object.values(AccountTypes),
    },
    password: { type: String, required: true },
});


AccountSchema.virtual("isAdmin").get(() => this.type === AccountTypes.ADMIN);
AccountSchema.virtual("isCompany").get(() => this.type === AccountTypes.COMPANY);

AccountSchema.methods.validatePassword = async function(password) {
    try {
        const isMatch = await bcrypt.compare(password, this.password);
        return isMatch;
    } catch (error) {
        console.error(error);
        return false;
    }
};

const Account = mongoose.model("Account", AccountSchema);

export default Account;
