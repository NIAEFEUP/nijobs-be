import Account from "../models/Account.js";
import hash from "../lib/passwordHashing.js";
import Company from "../models/Company.js";
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
