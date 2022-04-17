import Account from "../models/Account.js";
import hash from "../lib/passwordHashing.js";
import Company from "../models/Company.js";
import jwt from "jsonwebtoken";
import { RECOVERY_LINK_EXPIRATION } from "../models/constants/Account.js";
import env from "../config/env.js";
import EmailService from "../lib/emailService.js";
import { REQUEST_ACCOUNT_RECOVERY } from "../email-templates/accountManagement.js";

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

    async updatePassword(email, password) {
        await Account.findOneAndUpdate({ email }, { password: await hash(password) });
    }

    async findByEmail(email) {
        const account = await Account.findOne({ email });
        return account;
    }

    buildPasswordRecoveryLink(account) {
        const token = jwt.sign({
            email: account.email
        },
        env.awt_secret,
        {
            expiresIn: RECOVERY_LINK_EXPIRATION
        });
        return `${env.password_recovery_link}/${token}`;
    }

    decodeToken(token) {
        try {
            return jwt.verify(token, env.awt_secret);
        } catch (err) {
            return null;
        }
    }

    sendPasswordRecoveryNotification(account, link) {
        try {
            EmailService.sendMail({
                to: account.email,
                ...REQUEST_ACCOUNT_RECOVERY(link),
            });
        } catch (err) {
            console.error(err);
            throw err;
        }
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
