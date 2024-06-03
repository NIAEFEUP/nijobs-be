import mongoose from "mongoose";

import Account from "./Account.js";

const { Schema } = mongoose;

const CompanyAccountSchema = new Schema({
    company: {
        type: Schema.Types.ObjectId,
        ref: "Company",
        required: true,
    },
});

const CompanyAccount = Account.discriminator("CompanyAccount", CompanyAccountSchema);

export default CompanyAccount;
