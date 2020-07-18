const Account = require("../models/Account");
const hash = require("../lib/passwordHashing");
const Company = require("../models/Company");
class AuthService {
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
}

module.exports = AuthService;
