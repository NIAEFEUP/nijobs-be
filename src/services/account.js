import Account from "../models/Account.js";
import hash from "../lib/passwordHashing.js";
import Company from "../models/Company.js";
import jwt from "jsonwebtoken";
import { RECOVERY_LINK_EXPIRATION } from "../models/constants/Account.js";

class AccountService {
    // TODO: Use typedi or similar
    constructor() {

    }

    async registerAdmin(email, password) {
        const account = await Account.create({
            email,
            password: await hash(password),
            isAdmin: true,
        });

        return {
            email: account.email,
        };
    }

    async registerCompany(email, password, companyName) {

        const company = await Company.create({ name: companyName });

        const account = await Account.create({
            email,
            password,
            company,
        });

        return {
            email: account.email,
            companyName: account.company.name,
        };
    }

    async findByEmail(email) {
        const account = await Account.findOne({ email });
        return account;
    }

    _buildLink(account) {
        const token = jwt.sign({ email: account.email }, "secret", { expiresIn: RECOVERY_LINK_EXPIRATION });
        console.log(token);
    }

    requestRecoverAccount(account) {
        this._buildLink(account);
        return account;
    }

    async findAndDeleteByCompanyId(company) {
        try {
            const account = await Account.findOne({ company });
            await Account.findByIdAndRemove(account._id);
            return account;
        } catch (err) {
            console.error(err);
            throw err;
        }
    }
}

export default AccountService;
