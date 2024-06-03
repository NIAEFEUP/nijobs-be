import Account from "../models/Account.js";
import AdminAccount from "../models/AdminAccount.js";
import CompanyAccount from "../models/CompanyAccount.js";
import hash from "../lib/passwordHashing.js";
import Company from "../models/Company.js";
import { RECOVERY_LINK_EXPIRATION } from "../models/constants/Account.js";
import env from "../config/env.js";
import EmailService from "../lib/emailService.js";
import { REQUEST_ACCOUNT_RECOVERY } from "../email-templates/accountManagement.js";
import { generateToken } from "../lib/token.js";

class AccountService {
    // TODO: Use typedi or similar
    constructor() {

    }

    async registerAdmin(email, password) {
        const adminAccount = await AdminAccount.create({
            email,
            password: await hash(password)
        });

        return {
            email: adminAccount.email,
        };
    }

    async registerCompany(email, password, companyName) {

        const company = await Company.create({ name: companyName });
        const companyAccount = await CompanyAccount.create({
            email,
            password,
            company
        });

        return {
            email: companyAccount.email,
            companyName: companyAccount.company.name,
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
        const token = generateToken({ email: account.email }, env.jwt_secret, RECOVERY_LINK_EXPIRATION);
        return `${env.password_recovery_link}/${token}`;
    }

    async sendPasswordRecoveryNotification(account, link) {
        try {
            await EmailService.sendMail({
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
            const account = CompanyAccount.findOne({ company });
            await CompanyAccount.findByIdAndRemove(account._id);

            return account;
        } catch (err) {
            console.error(err);
            throw err;
        }
    }
}

export default AccountService;
