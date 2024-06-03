import mongoose from "mongoose";

import Account from "./Account.js";

const { Schema } = mongoose;


const AdminAccountSchema = new Schema({});

const AdminAccount = Account.discriminator("AdminAccount", AdminAccountSchema);

export default AdminAccount;
