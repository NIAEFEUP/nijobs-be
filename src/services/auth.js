const Account = require("../models/Account");
const hash = require("../lib/passwordHashing");
class AuthService {
    // TODO: Use typedi or similar
    constructor() {

    }

    async register(email, password) {
        const account = await Account.create({
            email,
            password: await hash(password),
            isAdmin: true,
        });

        return {
            email: account.email,
        };
    }

    async registerCompany(email, password, company_id) {
        const account = await Account.create({
            email,
            password,
            company: company_id,
        });

        return {
            email: account.email,
        };
    }
}

module.exports = AuthService;
