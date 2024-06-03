import mongoose from "mongoose";
import bcrypt from "bcrypt";

const { Schema } = mongoose;

const AccountSchema = new Schema({
    email: {
        type: String,
        trim: true,
        lowercase: true,
        unique: true,
        required: true,
    },
    password: { type: String, required: true },
}, {
    discriminatorKey: "accountType",
});

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
