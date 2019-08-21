// TODO: Use typedi or similar
const Account = require("../models/Account");

class AuthService {
    constructor() {

    }

    async register(username, password) {
        try {
            const account = await Account.create({
                username: username,
                password: password,
            });

            return {
                username: account.username,
            };
        } catch (err) {
            throw new Error("DB Error");
        }
    }
}

module.exports = AuthService;
