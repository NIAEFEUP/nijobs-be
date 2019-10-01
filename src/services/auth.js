const Account = require("../models/Account");

class AuthService {
    // TODO: Use typedi or similar
    constructor() {

    }

    async register(username, password) {
        const account = await Account.create({
            username,
            password,
        });

        return {
            username: account.username,
        };
    }
}

module.exports = AuthService;
